import type {
  AgentNotepadConvertToTaskParams,
  AgentNotepadListParams,
  AgentNotepadUpdateParams,
  DeliveryPayload,
  DeliveryType,
  NotepadAction,
  RequestMeta,
  TodoBucket,
  TodoItem,
} from "@cialloclaw/protocol";
import { isRpcChannelUnavailable, logRpcMockFallback } from "@/rpc/fallback";
import { convertNotepadToTask, listNotepad, updateNotepad } from "@/rpc/methods";
import { getMockNoteBuckets, getMockNoteExperience, runMockConvertNoteToTask, runMockUpdateNote } from "./notePage.mock";
import type { NoteConvertOutcome, NoteDetailExperience, NoteListItem, NoteResource, NoteUpdateOutcome } from "./notePage.types";

const NOTEPAD_RPC_TIMEOUT_MS = 2_500;

export type NotePageDataMode = "rpc" | "mock";

export type NoteResourceOpenExecutionPlan = {
  mode: "task_detail" | "open_url" | "copy_path";
  feedback: string;
  path: string | null;
  taskId: string | null;
  url: string | null;
};

function createRequestMeta(scope: string): RequestMeta {
  return {
    client_time: new Date().toISOString(),
    trace_id: `trace_${scope}_${Date.now()}`,
  };
}

function formatAbsoluteTime(value: string) {
  return new Date(value).toLocaleString("zh-CN", {
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    month: "numeric",
  });
}

function formatRelativeTime(value: string) {
  const targetTime = new Date(value).getTime();
  const diffMs = targetTime - Date.now();
  const absHours = Math.round(Math.abs(diffMs) / (1000 * 60 * 60));
  const absDays = Math.round(Math.abs(diffMs) / (1000 * 60 * 60 * 24));

  if (absHours < 1) {
    return diffMs >= 0 ? "within 1 hour" : "just overdue";
  }

  if (absHours < 24) {
    return diffMs >= 0 ? `${absHours}h left` : `${absHours}h overdue`;
  }

  return diffMs >= 0 ? `${absDays}d left` : `${absDays}d overdue`;
}

export function isAllowedNoteOpenUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

function resolveResourceOpenPayload(resource: NonNullable<TodoItem["related_resources"]>[number]): DeliveryPayload | null {
  if (!resource?.open_payload) {
    return null;
  }

  return {
    path: resource.open_payload.path ?? null,
    task_id: resource.open_payload.task_id ?? null,
    url: resource.open_payload.url ?? null,
  };
}

function getPreviewStatus(item: TodoItem) {
  if (item.bucket === "closed") {
    return item.status === "completed" ? "Completed" : "Cancelled";
  }

  if (item.bucket === "recurring_rule") {
    return item.recurring_enabled === false ? "Rule paused" : "Rule active";
  }

  if (item.status === "overdue") {
    return "Overdue";
  }

  if (item.status === "due_today") {
    return "Due today";
  }

  return item.bucket === "later" ? "Scheduled later" : "Upcoming";
}

function getDetailStatus(item: TodoItem) {
  if (item.bucket === "closed") {
    return item.status === "completed" ? "Finished" : "Cancelled";
  }

  if (item.bucket === "recurring_rule") {
    return item.recurring_enabled === false ? "Recurring rule paused" : "Recurring rule active";
  }

  if (item.status === "overdue") {
    return "Overdue";
  }

  if (item.status === "due_today") {
    return "Due today";
  }

  return item.bucket === "later" ? "Waiting window" : "Upcoming";
}

function getTimeHint(item: TodoItem) {
  const completedTime = item.ended_at ?? item.due_at;

  if (item.bucket === "closed") {
    return completedTime ? formatAbsoluteTime(completedTime) : "No time set";
  }

  if (!item.due_at) {
    return item.bucket === "recurring_rule" ? "Rule time pending" : "No time set";
  }

  if (item.bucket === "recurring_rule") {
    return formatAbsoluteTime(item.due_at);
  }

  if (item.status === "due_today" || item.status === "overdue") {
    return formatRelativeTime(item.due_at);
  }

  return formatAbsoluteTime(item.due_at);
}

function getSummaryLabel(item: TodoItem) {
  if (item.bucket === "closed") {
    return item.status === "completed" ? "Archived" : "Cancelled";
  }

  if (item.bucket === "recurring_rule") {
    return "Recurring reminder";
  }

  if (item.bucket === "later") {
    return "Scheduled later";
  }

  return item.status === "overdue" ? "Needs attention" : "Ready soon";
}

function getTypeLabel(item: TodoItem) {
  const normalizedType = item.type.replace(/[_-]/g, " ").trim();

  if (!normalizedType) {
    return item.bucket === "recurring_rule" ? "Recurring item" : "Note item";
  }

  return normalizedType
    .split(/\s+/)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function normalizeResourceOpenAction(action: DeliveryType | null, payload: DeliveryPayload | null): NoteResource["openAction"] {
  if (action === "task_detail") {
    return "task_detail";
  }

  if (action === "result_page" && payload?.url) {
    return "open_url";
  }

  return "copy_path";
}

function createResourceHints(item: TodoItem) {
  if (item.related_resources && item.related_resources.length > 0) {
    return item.related_resources.map<NoteResource>((resource) => {
      const payload = resolveResourceOpenPayload(resource);

      return {
        id: resource.resource_id,
        label: resource.label,
        openAction: normalizeResourceOpenAction(resource.open_action ?? null, payload),
        path: resource.path,
        taskId: payload?.task_id ?? null,
        type: resource.resource_type,
        url: payload?.url ?? null,
      };
    });
  }

  const normalizedTitle = item.title.toLowerCase();
  const resources: NoteResource[] = [];

  if (normalizedTitle.includes("template") || normalizedTitle.includes("模板")) {
    resources.push({
      id: `${item.item_id}_template`,
      label: "Linked template",
      path: "workspace/templates",
      type: "Template directory",
    });
  }

  if (normalizedTitle.includes("report") || normalizedTitle.includes("周报") || normalizedTitle.includes("报告")) {
    resources.push({
      id: `${item.item_id}_report`,
      label: "Draft workspace",
      path: "workspace/drafts",
      type: "Draft directory",
    });
  }

  if (normalizedTitle.includes("design") || normalizedTitle.includes("设计") || normalizedTitle.includes("page") || normalizedTitle.includes("页面")) {
    resources.push({
      id: `${item.item_id}_ui`,
      label: "Dashboard frontend",
      path: "apps/desktop/src/features/dashboard",
      type: "Code directory",
    });
  }

  return resources;
}

function createFallbackExperience(item: TodoItem): NoteDetailExperience {
  const previewStatus = getPreviewStatus(item);
  const detailStatus = getDetailStatus(item);
  const fallbackNoteType =
    item.bucket === "recurring_rule"
      ? "recurring"
      : item.bucket === "closed"
        ? "archive"
        : item.type === "follow_up"
          ? "follow-up"
          : item.type === "template"
            ? "template"
            : "reminder";

  return {
    agentSuggestion: {
      detail:
        item.agent_suggestion ??
        "This note only returned the formal notepad fields. Add more context before turning it into a task.",
      label: "Next step",
    },
    canConvertToTask: item.bucket !== "closed" && !item.linked_task_id,
    detailStatus,
    detailStatusTone: item.status === "overdue" ? "overdue" : item.status === "completed" || item.status === "cancelled" ? "done" : "normal",
    effectiveScope:
      item.effective_scope ?? (item.bucket === "recurring_rule" ? "This rule stays active until it is paused or cancelled." : null),
    endedAt: item.ended_at ?? (item.status === "completed" || item.status === "cancelled" ? item.due_at : null),
    isRecurringEnabled: item.bucket === "recurring_rule" ? item.recurring_enabled !== false : false,
    nextOccurrenceAt: item.next_occurrence_at ?? (item.bucket === "recurring_rule" ? item.due_at : null),
    noteText:
      item.note_text ??
      (item.agent_suggestion
        ? `${item.title}. ${item.agent_suggestion}`
        : `${item.title}. The frontend is using a minimal fallback summary for this note.`),
    noteType: fallbackNoteType,
    plannedAt: item.due_at,
    previewStatus,
    prerequisite:
      item.prerequisite ??
      (item.bucket === "later"
        ? "This note is intentionally parked until a later execution window."
        : item.bucket === "recurring_rule"
          ? "Confirm that this recurring rule should keep producing future instances."
          : null),
    recentInstanceStatus: item.recent_instance_status ?? null,
    relatedResources: createResourceHints(item),
    repeatRule:
      item.repeat_rule ?? (item.bucket === "recurring_rule" ? "The protocol has not returned a concrete repeat rule yet." : null),
    summaryLabel: getSummaryLabel(item),
    timeHint: getTimeHint(item),
    title: item.title,
    typeLabel: getTypeLabel(item),
  };
}

function mapItems(items: TodoItem[]): NoteListItem[] {
  return items.map((item) => ({
    experience: getMockNoteExperience(item.item_id) ?? createFallbackExperience(item),
    item,
  }));
}

async function withTimeout<T>(promise: Promise<T>, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      window.setTimeout(() => reject(new Error(`${label} request timed out`)), NOTEPAD_RPC_TIMEOUT_MS);
    }),
  ]);
}

function getMockNoteBucketPage(group: TodoBucket) {
  const buckets = getMockNoteBuckets();
  const items = buckets[group] ?? [];

  return {
    items,
    page: {
      has_more: false,
      limit: items.length,
      offset: 0,
      total: items.length,
    },
  };
}

export async function loadNoteBucket(group: TodoBucket, source: NotePageDataMode = "rpc") {
  if (source === "mock") {
    return getMockNoteBucketPage(group);
  }

  try {
    const params: AgentNotepadListParams = {
      group,
      limit: group === "closed" ? 24 : 12,
      offset: 0,
      request_meta: createRequestMeta(`notepad_${group}`),
    };

    const result = await withTimeout(listNotepad(params), `notepad bucket ${group}`);
    return {
      items: mapItems(result.items),
      page: result.page,
    };
  } catch (error) {
    if (isRpcChannelUnavailable(error)) {
      logRpcMockFallback(`notepad bucket ${group}`, error);
      return getMockNoteBucketPage(group);
    }

    throw error;
  }
}

export async function convertNoteToTask(itemId: string, source: NotePageDataMode = "rpc"): Promise<NoteConvertOutcome> {
  if (source === "mock") {
    return runMockConvertNoteToTask(itemId);
  }

  const params: AgentNotepadConvertToTaskParams = {
    confirmed: true,
    item_id: itemId,
    request_meta: createRequestMeta(`notepad_convert_${itemId}`),
  };

  try {
    const result = await withTimeout(convertNotepadToTask(params), `convert note ${itemId} to task`);
    return {
      result,
      source: "rpc",
    };
  } catch (error) {
    if (isRpcChannelUnavailable(error)) {
      logRpcMockFallback(`convert note ${itemId} to task`, error);
      return runMockConvertNoteToTask(itemId);
    }

    throw error;
  }
}

export async function updateNote(itemId: string, action: NotepadAction, source: NotePageDataMode = "rpc"): Promise<NoteUpdateOutcome> {
  if (source === "mock") {
    return runMockUpdateNote(itemId, action);
  }

  const params: AgentNotepadUpdateParams = {
    action,
    item_id: itemId,
    request_meta: createRequestMeta(`notepad_update_${action}_${itemId}`),
  };

  try {
    const result = await withTimeout(updateNotepad(params), `update note ${itemId} with ${action}`);
    return {
      result,
      source: "rpc",
    };
  } catch (error) {
    if (isRpcChannelUnavailable(error)) {
      logRpcMockFallback(`update note ${itemId} with ${action}`, error);
      return runMockUpdateNote(itemId, action);
    }

    throw error;
  }
}

export function resolveNoteResourceOpenExecutionPlan(resource: NoteResource): NoteResourceOpenExecutionPlan {
  if (resource.openAction === "task_detail" && resource.taskId) {
    return {
      feedback: `Focused task ${resource.label}.`,
      mode: "task_detail",
      path: resource.path,
      taskId: resource.taskId,
      url: resource.url ?? null,
    };
  }

  if (resource.openAction === "open_url" && resource.url) {
    return {
      feedback: `Opened ${resource.label}.`,
      mode: "open_url",
      path: resource.path || null,
      taskId: resource.taskId ?? null,
      url: resource.url,
    };
  }

  return {
    feedback: resource.path || resource.url ? `Prepared ${resource.label} for copy.` : `No openable target available for ${resource.label}.`,
    mode: "copy_path",
    path: resource.path || resource.url || null,
    taskId: resource.taskId ?? null,
    url: resource.url ?? null,
  };
}

export async function performNoteResourceOpenExecution(plan: NoteResourceOpenExecutionPlan): Promise<string> {
  if (plan.mode === "open_url" && plan.url) {
    if (!isAllowedNoteOpenUrl(plan.url)) {
      return "Blocked an unsupported note resource URL.";
    }

    window.open(plan.url, "_blank", "noopener,noreferrer");
    return plan.feedback;
  }

  if (plan.mode === "copy_path" && plan.path) {
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(plan.path);
        return `${plan.feedback} Copied the path.`;
      } catch {
        return `${plan.feedback} Path: ${plan.path}`;
      }
    }

    return `${plan.feedback} Path: ${plan.path}`;
  }

  return plan.feedback;
}

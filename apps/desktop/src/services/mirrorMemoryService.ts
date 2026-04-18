import type { AgentInputSubmitParams, AgentInputSubmitResult, BubbleMessage, InputMode, RequestSource } from "@cialloclaw/protocol";
import { loadStoredValue, removeStoredValue, saveStoredValue } from "../platform/storage";
import { loadSettings } from "./settingsService";

export type MirrorConversationRecordStatus = "submitted" | "responded" | "failed";

export type MirrorConversationRecord = {
  record_id: string;
  trace_id: string;
  created_at: string;
  updated_at: string;
  source: RequestSource;
  trigger: AgentInputSubmitParams["trigger"];
  input_mode: InputMode;
  session_id: string | null;
  task_id: string | null;
  user_text: string;
  agent_text: string | null;
  agent_bubble_type: BubbleMessage["type"] | null;
  status: MirrorConversationRecordStatus;
  error_message: string | null;
};

type MirrorConversationSnapshot = {
  version: 1;
  records: MirrorConversationRecord[];
};

const MIRROR_CONVERSATION_STORAGE_KEY = "cialloclaw.mirror.conversations";
const MIRROR_CONVERSATION_RECORD_LIMIT = 100;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function isConversationStatus(value: unknown): value is MirrorConversationRecordStatus {
  return value === "submitted" || value === "responded" || value === "failed";
}

function isBubbleMessageType(value: unknown): value is BubbleMessage["type"] {
  return value === "status" || value === "intent_confirm" || value === "result";
}

function isRequestSource(value: unknown): value is RequestSource {
  return value === "floating_ball" || value === "dashboard" || value === "tray_panel";
}

function isInputMode(value: unknown): value is InputMode {
  return value === "voice" || value === "text";
}

function isConversationTrigger(value: unknown): value is AgentInputSubmitParams["trigger"] {
  return value === "voice_commit" || value === "hover_text_input";
}

function isMirrorConversationRecord(value: unknown): value is MirrorConversationRecord {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.record_id === "string" &&
    typeof value.trace_id === "string" &&
    typeof value.created_at === "string" &&
    typeof value.updated_at === "string" &&
    isRequestSource(value.source) &&
    isConversationTrigger(value.trigger) &&
    isInputMode(value.input_mode) &&
    (typeof value.session_id === "string" || value.session_id === null) &&
    (typeof value.task_id === "string" || value.task_id === null) &&
    typeof value.user_text === "string" &&
    (typeof value.agent_text === "string" || value.agent_text === null) &&
    (value.agent_bubble_type === null || isBubbleMessageType(value.agent_bubble_type)) &&
    isConversationStatus(value.status) &&
    (typeof value.error_message === "string" || value.error_message === null)
  );
}

function cloneConversationRecord(record: MirrorConversationRecord): MirrorConversationRecord {
  return { ...record };
}

function sortMirrorConversationRecords(records: MirrorConversationRecord[]) {
  return [...records].sort((left, right) => {
    const updatedOrder = right.updated_at.localeCompare(left.updated_at);

    if (updatedOrder !== 0) {
      return updatedOrder;
    }

    const createdOrder = right.created_at.localeCompare(left.created_at);
    if (createdOrder !== 0) {
      return createdOrder;
    }

    return right.record_id.localeCompare(left.record_id);
  });
}

function capMirrorConversationRecords(records: MirrorConversationRecord[]) {
  return sortMirrorConversationRecords(records).slice(0, MIRROR_CONVERSATION_RECORD_LIMIT);
}

function isMirrorConversationMemoryEnabled() {
  return loadSettings().settings.memory.enabled;
}

function clearMirrorConversationRecords() {
  removeStoredValue(MIRROR_CONVERSATION_STORAGE_KEY);
}

export function upsertMirrorConversationRecord(records: MirrorConversationRecord[], nextRecord: MirrorConversationRecord) {
  const nextRecords = records.some((record) => record.trace_id === nextRecord.trace_id)
    ? records.map((record) => (record.trace_id === nextRecord.trace_id ? cloneConversationRecord(nextRecord) : cloneConversationRecord(record)))
    : [cloneConversationRecord(nextRecord), ...records.map(cloneConversationRecord)];

  return capMirrorConversationRecords(nextRecords);
}

export function loadMirrorConversationRecords(source: "rpc" | "fallback" = "rpc") {
  if (source === "rpc" && !isMirrorConversationMemoryEnabled()) {
    clearMirrorConversationRecords();
    return [];
  }

  try {
    const snapshot = loadStoredValue<unknown>(MIRROR_CONVERSATION_STORAGE_KEY);

    if (isRecord(snapshot) && snapshot.version === 1 && Array.isArray(snapshot.records)) {
      const records = snapshot.records.filter(isMirrorConversationRecord).map(cloneConversationRecord);
      if (records.length > 0) {
        return capMirrorConversationRecords(records);
      }
    }
  } catch {
    return [];
  }

  return [];
}

export function saveMirrorConversationRecords(records: MirrorConversationRecord[]) {
  if (!isMirrorConversationMemoryEnabled()) {
    clearMirrorConversationRecords();
    return;
  }

  saveStoredValue<MirrorConversationSnapshot>(MIRROR_CONVERSATION_STORAGE_KEY, {
    version: 1,
    records: capMirrorConversationRecords(records),
  });
}

export function recordMirrorConversationStart(params: AgentInputSubmitParams) {
  if (!isMirrorConversationMemoryEnabled()) {
    clearMirrorConversationRecords();
    return [];
  }

  const now = new Date().toISOString();
  const nextRecord: MirrorConversationRecord = {
    record_id: `mirror-conversation-${params.request_meta.trace_id}`,
    trace_id: params.request_meta.trace_id,
    created_at: now,
    updated_at: now,
    source: params.source,
    trigger: params.trigger,
    input_mode: params.input.input_mode,
    session_id: params.session_id ?? null,
    task_id: null,
    user_text: params.input.text,
    agent_text: null,
    agent_bubble_type: null,
    status: "submitted",
    error_message: null,
  };

  const currentRecords = loadMirrorConversationRecords();
  const nextRecords = upsertMirrorConversationRecord(currentRecords, nextRecord);
  saveMirrorConversationRecords(nextRecords);
  return nextRecords;
}

export function recordMirrorConversationSuccess(params: AgentInputSubmitParams, result: AgentInputSubmitResult) {
  if (!isMirrorConversationMemoryEnabled()) {
    clearMirrorConversationRecords();
    return [];
  }

  const currentRecords = loadMirrorConversationRecords();
  const existingRecord = currentRecords.find((record) => record.trace_id === params.request_meta.trace_id) ?? null;
  const updatedAt = result.bubble_message?.created_at ?? new Date().toISOString();
  const nextRecord: MirrorConversationRecord = {
    record_id: existingRecord?.record_id ?? `mirror-conversation-${params.request_meta.trace_id}`,
    trace_id: params.request_meta.trace_id,
    created_at: existingRecord?.created_at ?? updatedAt,
    updated_at: updatedAt,
    source: params.source,
    trigger: params.trigger,
    input_mode: params.input.input_mode,
    session_id: params.session_id ?? null,
    task_id: result.task.task_id,
    user_text: params.input.text,
    agent_text: result.bubble_message?.text ?? null,
    agent_bubble_type: result.bubble_message?.type ?? null,
    status: result.bubble_message ? "responded" : "submitted",
    error_message: null,
  };

  const nextRecords = upsertMirrorConversationRecord(currentRecords, nextRecord);
  saveMirrorConversationRecords(nextRecords);
  return nextRecords;
}

export function recordMirrorConversationFailure(params: AgentInputSubmitParams, error: unknown) {
  if (!isMirrorConversationMemoryEnabled()) {
    clearMirrorConversationRecords();
    return [];
  }

  const currentRecords = loadMirrorConversationRecords();
  const existingRecord = currentRecords.find((record) => record.trace_id === params.request_meta.trace_id) ?? null;
  const updatedAt = new Date().toISOString();
  const nextRecord: MirrorConversationRecord = {
    record_id: existingRecord?.record_id ?? `mirror-conversation-${params.request_meta.trace_id}`,
    trace_id: params.request_meta.trace_id,
    created_at: existingRecord?.created_at ?? updatedAt,
    updated_at: updatedAt,
    source: params.source,
    trigger: params.trigger,
    input_mode: params.input.input_mode,
    session_id: params.session_id ?? null,
    task_id: existingRecord?.task_id ?? null,
    user_text: params.input.text,
    agent_text: existingRecord?.agent_text ?? null,
    agent_bubble_type: existingRecord?.agent_bubble_type ?? null,
    status: "failed",
    error_message: error instanceof Error ? error.message : "input submit failed",
  };

  const nextRecords = upsertMirrorConversationRecord(currentRecords, nextRecord);
  saveMirrorConversationRecords(nextRecords);
  return nextRecords;
}

import type {
  ApprovalRequest,
  Task,
} from "@cialloclaw/protocol";
import { deriveShellBallDualFormState } from "./shellBall.dualForm";
import type { ShellBallDualFormState, ShellBallEngagementKind, ShellBallVisualState } from "./shellBall.types";

type ShellBallLocalInteractionEngagement = Exclude<ShellBallEngagementKind, "none" | "result">;

type ShellBallLocalInteractionContext = {
  hasRecommendation: boolean;
  activeEngagementKind: ShellBallLocalInteractionEngagement | null;
};

type ShellBallBackendFailure = {
  code: number;
  rpcMessage: string;
  detail?: string | null;
};

type ShellBallDeliveryResult = {
  type: string;
  title: string;
  payload: {
    path: string | null;
    url: string | null;
    task_id: string | null;
  };
  preview_text: string;
};

type ShellBallTaskResult = {
  task: Pick<Task, "task_id" | "source_type" | "status">;
  delivery_result?: ShellBallDeliveryResult | null;
};

type ShellBallTaskStartResult = ShellBallTaskResult & {
  bubble_message: unknown;
};

type ShellBallTaskConfirmResult = ShellBallTaskResult & {
  bubble_message: unknown;
};

type ShellBallTaskUpdatedTruth = {
  task_id: string;
  status: Task["status"];
};

type ShellBallApprovalPendingTruth = {
  task_id: string;
  approval_request: ApprovalRequest;
};

type ShellBallDeliveryReadyTruth = {
  task_id: string;
  delivery_result: ShellBallDeliveryResult;
};

type ShellBallTaskSnapshot = Pick<Task, "task_id" | "source_type" | "status">;

export type ShellBallRegisteredTruthSnapshot = {
  task?: ShellBallTaskSnapshot | null;
  approvalRequest?: ApprovalRequest | null;
  deliveryResult?: ShellBallDeliveryResult | null;
  failure?: ShellBallBackendFailure | null;
};

function getShellBallEngagementKindFromTaskSourceType(sourceType: Task["source_type"] | undefined): ShellBallLocalInteractionEngagement | null {
  switch (sourceType) {
    case "voice":
      return "voice";
    case "dragged_file":
      return "file_drag";
    case "hover_input":
    case "selected_text":
    case "error_signal":
      return "text_selection";
    case "todo":
      return "recommendation";
    default:
      return null;
  }
}

function getShellBallEngagementKindFromLocalContext(context: ShellBallLocalInteractionContext | undefined): ShellBallLocalInteractionEngagement | null {
  if (context === undefined) {
    return null;
  }

  if (context.activeEngagementKind !== null) {
    return context.activeEngagementKind;
  }

  if (context.hasRecommendation) {
    return "recommendation";
  }

  return null;
}

function resolveShellBallRegisteredTruthEngagement(input: {
  context?: ShellBallLocalInteractionContext;
  truths?: ShellBallRegisteredTruthSnapshot;
}): ShellBallEngagementKind {
  const truths = input.truths;
  const localEngagement = getShellBallEngagementKindFromLocalContext(input.context);

  if (localEngagement !== null) {
    return localEngagement;
  }

  const taskEngagement = getShellBallEngagementKindFromTaskSourceType(truths?.task?.source_type);

  if (taskEngagement !== null) {
    return taskEngagement;
  }

  return "none";
}

function deriveShellBallDualFormStateFromRegisteredTruths(input: {
  truths?: ShellBallRegisteredTruthSnapshot;
  context?: ShellBallLocalInteractionContext;
}): ShellBallDualFormState | null {
  const truths = input.truths;

  if (truths === undefined) {
    return null;
  }

  if (truths.deliveryResult !== undefined && truths.deliveryResult !== null) {
    return {
      systemState: "completed",
      engagementKind: "result",
    };
  }

  const engagementKind = resolveShellBallRegisteredTruthEngagement(input);

  if (truths.failure !== undefined && truths.failure !== null) {
    return {
      systemState: "abnormal",
      engagementKind,
    };
  }

  if (truths.approvalRequest !== undefined && truths.approvalRequest !== null) {
    return {
      systemState: "waiting_confirm",
      engagementKind,
      waitingConfirmReason: "authorization",
    };
  }

  switch (truths.task?.status) {
    case "confirming_intent":
      return {
        systemState: "intent_confirming",
        engagementKind,
      };

    case "processing":
      return {
        systemState: "processing",
        engagementKind,
      };

    case "waiting_auth":
      return {
        systemState: "waiting_confirm",
        engagementKind,
        waitingConfirmReason: "authorization",
      };

    case "failed":
    case "cancelled":
    case "ended_unfinished":
    case "blocked":
      return {
        systemState: "abnormal",
        engagementKind,
      };

    case "completed":
      return {
        systemState: "completed",
        engagementKind: "result",
      };

    default:
      return null;
  }
}

export function deriveShellBallDualFormViewModel(input: {
  visualState: ShellBallVisualState;
  context?: ShellBallLocalInteractionContext;
  hasRecommendation?: boolean;
  registeredTruths?: ShellBallRegisteredTruthSnapshot;
}): ShellBallDualFormState {
  if (input.visualState === "voice_listening" || input.visualState === "voice_locked") {
    return deriveShellBallDualFormState({
      visualState: input.visualState,
      context: input.context,
      hasRecommendation: input.hasRecommendation,
    });
  }

  const truthDerivedState = deriveShellBallDualFormStateFromRegisteredTruths({
    truths: input.registeredTruths,
    context: input.context,
  });

  if (truthDerivedState !== null) {
    return truthDerivedState;
  }

  return deriveShellBallDualFormState({
    visualState: input.visualState,
    context: input.context,
    hasRecommendation: input.hasRecommendation,
  });
}

function createShellBallRegisteredTruthSnapshotFromTaskResult(
  result: ShellBallTaskResult,
): ShellBallRegisteredTruthSnapshot {
  return {
    task: {
      task_id: result.task.task_id,
      source_type: result.task.source_type,
      status: result.task.status,
    },
    deliveryResult: "delivery_result" in result ? result.delivery_result : null,
  };
}

export function createShellBallRegisteredTruthSnapshotFromTaskStartResult(
  result: ShellBallTaskStartResult,
): ShellBallRegisteredTruthSnapshot {
  return createShellBallRegisteredTruthSnapshotFromTaskResult(result);
}

export function createShellBallRegisteredTruthSnapshotFromTaskConfirmResult(
  result: ShellBallTaskConfirmResult,
): ShellBallRegisteredTruthSnapshot {
  return createShellBallRegisteredTruthSnapshotFromTaskResult(result);
}

export function applyShellBallTaskUpdatedTruth(
  current: ShellBallRegisteredTruthSnapshot | undefined,
  notification: ShellBallTaskUpdatedTruth,
): ShellBallRegisteredTruthSnapshot {
  return {
    ...current,
    task: current?.task === undefined || current.task === null
      ? undefined
      : {
          ...current.task,
          task_id: notification.task_id,
          status: notification.status,
        },
  };
}

export function applyShellBallApprovalPendingTruth(
  current: ShellBallRegisteredTruthSnapshot | undefined,
  notification: ShellBallApprovalPendingTruth,
): ShellBallRegisteredTruthSnapshot {
  return {
    ...current,
    approvalRequest: notification.approval_request,
    task: current?.task === undefined || current.task === null
      ? current?.task
      : {
          ...current.task,
          task_id: notification.task_id,
          status: "waiting_auth",
        },
  };
}

export function applyShellBallDeliveryReadyTruth(
  current: ShellBallRegisteredTruthSnapshot | undefined,
  notification: ShellBallDeliveryReadyTruth,
): ShellBallRegisteredTruthSnapshot {
  return {
    ...current,
    deliveryResult: notification.delivery_result,
    approvalRequest: null,
    task: current?.task === undefined || current.task === null
      ? current?.task
      : {
          ...current.task,
          task_id: notification.task_id,
          status: "completed",
        },
  };
}

export function createShellBallRegisteredTruthSnapshotFromRpcFailure(error: ShellBallBackendFailure): ShellBallRegisteredTruthSnapshot {
  return {
    failure: error,
  };
}

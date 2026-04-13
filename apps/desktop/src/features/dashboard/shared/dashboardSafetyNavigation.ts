import type { AgentTaskDetailGetResult, ApprovalRequest, RecoveryPoint } from "@cialloclaw/protocol";
import { isApprovalRequest, isRecoveryPoint } from "./dashboardContractValidators";

const dashboardSafetySnapshotFeedback = "实时安全数据已变化，当前展示的是路由携带的快照。";

export type DashboardSafetyNavigationState = {
  task_id: string;
  approval_request: ApprovalRequest | null;
  latest_restore_point: RecoveryPoint | null;
};

export type DashboardSafetyFocusTarget =
  | {
      kind: "approval";
      source: "live" | "snapshot";
      anchor_id: `approval:${string}`;
      approval_request: ApprovalRequest;
      feedback: string | null;
    }
  | {
      kind: "restore_point";
      source: "live" | "snapshot";
      anchor_id: `restore_point:${string}`;
      recovery_point: RecoveryPoint;
      feedback: string | null;
    }
  | null;

export function buildDashboardSafetyNavigationState(detail: AgentTaskDetailGetResult): DashboardSafetyNavigationState | null {
  const approvalRequest = detail.approval_request ?? null;
  const latestRestorePoint = detail.security_summary.latest_restore_point ?? null;

  if (!approvalRequest && !latestRestorePoint) {
    return null;
  }

  return {
    approval_request: approvalRequest,
    latest_restore_point: latestRestorePoint,
    task_id: detail.task.task_id,
  };
}

export function readDashboardSafetyNavigationState(value: unknown): DashboardSafetyNavigationState | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Partial<DashboardSafetyNavigationState>;
  const approvalRequest = candidate.approval_request ?? null;
  const latestRestorePoint = candidate.latest_restore_point ?? null;

  if (typeof candidate.task_id !== "string") {
    return null;
  }

  if (approvalRequest !== null && !isApprovalRequest(approvalRequest)) {
    return null;
  }

  if (latestRestorePoint !== null && !isRecoveryPoint(latestRestorePoint)) {
    return null;
  }

  if (approvalRequest === null && latestRestorePoint === null) {
    return null;
  }

  return {
    approval_request: approvalRequest,
    latest_restore_point: latestRestorePoint,
    task_id: candidate.task_id,
  };
}

export function resolveDashboardSafetyFocusTarget({
  state,
  livePending,
  liveRestorePoint,
}: {
  state: DashboardSafetyNavigationState | null;
  livePending: ApprovalRequest | null;
  liveRestorePoint: RecoveryPoint | null;
}): DashboardSafetyFocusTarget {
  if (!state) {
    return null;
  }

  if (state.approval_request) {
    if (livePending?.approval_id === state.approval_request.approval_id) {
      return {
        anchor_id: `approval:${livePending.approval_id}`,
        approval_request: livePending,
        feedback: null,
        kind: "approval",
        source: "live",
      };
    }

    return {
      anchor_id: `approval:${state.approval_request.approval_id}`,
      approval_request: state.approval_request,
      feedback: dashboardSafetySnapshotFeedback,
      kind: "approval",
      source: "snapshot",
    };
  }

  if (state.latest_restore_point) {
    if (liveRestorePoint?.recovery_point_id === state.latest_restore_point.recovery_point_id) {
      return {
        anchor_id: `restore_point:${liveRestorePoint.recovery_point_id}`,
        feedback: null,
        kind: "restore_point",
        recovery_point: liveRestorePoint,
        source: "live",
      };
    }

    return {
      anchor_id: `restore_point:${state.latest_restore_point.recovery_point_id}`,
      feedback: dashboardSafetySnapshotFeedback,
      kind: "restore_point",
      recovery_point: state.latest_restore_point,
      source: "snapshot",
    };
  }

  return null;
}

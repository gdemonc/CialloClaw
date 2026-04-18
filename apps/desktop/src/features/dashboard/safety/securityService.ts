import type {
  AgentSecurityAuditListParams,
  AgentSecurityAuditListResult,
  AgentSecurityApprovalRespondResult,
  AgentSecurityPendingListParams,
  AgentSecurityPendingListResult,
  AgentSecurityRestoreApplyParams,
  AgentSecurityRestoreApplyResult,
  AgentSecurityRestorePointsListParams,
  AgentSecurityRestoreRespondResult,
  AgentSecurityRestorePointsListResult,
  AgentSecurityRespondParams,
  AgentSecurityRespondResult,
  AgentSecuritySummaryGetParams,
  AgentSecuritySummaryGetResult,
  AuditRecord,
  ApprovalDecision,
  ApprovalRequest,
  JsonRpcPage,
  RecoveryPoint,
  RequestMeta,
} from "@cialloclaw/protocol";
import {
  applySecurityRestoreDetailed,
  getSecuritySummaryDetailed,
  listSecurityAuditDetailed,
  listSecurityPendingDetailed,
  listSecurityRestorePointsDetailed,
  respondSecurityDetailed,
} from "@/rpc/methods";

export type SecurityModuleSource = "rpc";

export type SecurityRpcContext = {
  serverTime: string | null;
  warnings: string[];
};

export type SecurityModuleData = {
  summary: AgentSecuritySummaryGetResult["summary"];
  pending: AgentSecurityPendingListResult["items"];
  pendingPage: JsonRpcPage;
  rpcContext: SecurityRpcContext;
  source: SecurityModuleSource;
};

export type SecurityPendingListData = {
  items: ApprovalRequest[];
  page: JsonRpcPage;
  rpcContext: SecurityRpcContext;
  source: SecurityModuleSource;
};

export type SecurityRespondOutcome = {
  response: AgentSecurityRespondResult;
  rpcContext: SecurityRpcContext;
};

export type SecurityRestorePointListData = {
  items: RecoveryPoint[];
  page: JsonRpcPage;
  rpcContext: SecurityRpcContext;
  source: SecurityModuleSource;
};

export type SecurityAuditRecordListData = {
  items: AuditRecord[];
  page: JsonRpcPage;
  rpcContext: SecurityRpcContext;
  source: SecurityModuleSource;
  taskId: string | null;
};

export type SecurityRestoreApplyOutcome = {
  response: AgentSecurityRestoreApplyResult;
  rpcContext: SecurityRpcContext;
};

export function isSecurityApprovalRespondResult(
  response: AgentSecurityRespondResult,
): response is AgentSecurityApprovalRespondResult {
  return "authorization_record" in response;
}

export function isSecurityRestoreRespondResult(
  response: AgentSecurityRespondResult,
): response is AgentSecurityRestoreRespondResult {
  return "recovery_point" in response;
}

function createRequestMeta(): RequestMeta {
  return {
    trace_id: `trace_security_${Date.now()}`,
    client_time: new Date().toISOString(),
  };
}

export async function loadSecurityModuleData(source: SecurityModuleSource = "rpc"): Promise<SecurityModuleData> {
  void source;
  return loadSecurityModuleRpcData();
}

export async function loadSecurityModuleRpcData(): Promise<SecurityModuleData> {
  const summaryParams: AgentSecuritySummaryGetParams = {
    request_meta: createRequestMeta(),
  };

  const pendingParams: AgentSecurityPendingListParams = {
    request_meta: createRequestMeta(),
    limit: 20,
    offset: 0,
  };

  const [summaryResult, pendingResult] = await Promise.all([
    getSecuritySummaryDetailed(summaryParams),
    listSecurityPendingDetailed(pendingParams),
  ]);

  const serverTime = pendingResult.meta?.server_time ?? summaryResult.meta?.server_time ?? null;

  return {
    summary: summaryResult.data.summary,
    pending: pendingResult.data.items,
    pendingPage: pendingResult.data.page,
    rpcContext: {
      serverTime,
      warnings: [...summaryResult.warnings, ...pendingResult.warnings],
    },
    source: "rpc",
  };
}

export async function respondToApproval(
  approval: ApprovalRequest,
  decision: ApprovalDecision,
  rememberRule: boolean,
  source: SecurityModuleSource,
): Promise<SecurityRespondOutcome> {
  void source;
  const params: AgentSecurityRespondParams = {
    request_meta: createRequestMeta(),
    task_id: approval.task_id,
    approval_id: approval.approval_id,
    decision,
    remember_rule: rememberRule,
  };

  const response = await respondSecurityDetailed(params);

  return {
    response: response.data,
    rpcContext: {
      serverTime: response.meta?.server_time ?? null,
      warnings: response.warnings,
    },
  };
}

export async function loadSecurityPendingApprovals(
  source: SecurityModuleSource,
  options?: {
    limit?: number;
    offset?: number;
  },
): Promise<SecurityPendingListData> {
  void source;
  const limit = options?.limit ?? 20;
  const offset = options?.offset ?? 0;
  const params: AgentSecurityPendingListParams = {
    request_meta: createRequestMeta(),
    limit,
    offset,
  };
  const response = await listSecurityPendingDetailed(params);

  return {
    items: response.data.items,
    page: response.data.page,
    rpcContext: {
      serverTime: response.meta?.server_time ?? null,
      warnings: response.warnings,
    },
    source: "rpc",
  };
}

export async function loadSecurityRestorePoints(
  source: SecurityModuleSource,
  options?: {
    limit?: number;
    offset?: number;
    taskId?: string | null;
  },
): Promise<SecurityRestorePointListData> {
  void source;
  const limit = options?.limit ?? 20;
  const offset = options?.offset ?? 0;
  const taskId = options?.taskId?.trim() || undefined;
  const params: AgentSecurityRestorePointsListParams = {
    request_meta: createRequestMeta(),
    limit,
    offset,
    ...(taskId ? { task_id: taskId } : {}),
  };
  const response = await listSecurityRestorePointsDetailed(params);

  return {
    items: response.data.items,
    page: response.data.page,
    rpcContext: {
      serverTime: response.meta?.server_time ?? null,
      warnings: response.warnings,
    },
    source: "rpc",
  };
}

export async function loadSecurityAuditRecords(
  source: SecurityModuleSource,
  taskId?: string | null,
  options?: {
    limit?: number;
    offset?: number;
  },
): Promise<SecurityAuditRecordListData> {
  void source;
  const limit = options?.limit ?? 20;
  const offset = options?.offset ?? 0;
  const normalizedTaskId = taskId?.trim() || null;
  if (!normalizedTaskId) {
    throw new Error("Security audit list requires task context in RPC mode.");
  }

  const params: AgentSecurityAuditListParams = {
    request_meta: createRequestMeta(),
    task_id: normalizedTaskId,
    limit,
    offset,
  };
  const response = await listSecurityAuditDetailed(params);

  return {
    items: response.data.items,
    page: response.data.page,
    rpcContext: {
      serverTime: response.meta?.server_time ?? null,
      warnings: response.warnings,
    },
    source: "rpc",
    taskId: normalizedTaskId,
  };
}

export async function applySecurityRestorePoint(
  restorePoint: RecoveryPoint,
  source: SecurityModuleSource,
): Promise<SecurityRestoreApplyOutcome> {
  void source;
  const params: AgentSecurityRestoreApplyParams = {
    request_meta: createRequestMeta(),
    task_id: restorePoint.task_id,
    recovery_point_id: restorePoint.recovery_point_id,
  };

  const response = await applySecurityRestoreDetailed(params);

  return {
    response: response.data,
    rpcContext: {
      serverTime: response.meta?.server_time ?? null,
      warnings: response.warnings,
    },
  };
}

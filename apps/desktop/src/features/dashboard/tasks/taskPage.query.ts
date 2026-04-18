export const dashboardTaskBucketQueryPrefix = ["dashboard", "tasks", "bucket"] as const;
export const dashboardTaskDetailQueryPrefix = ["dashboard", "tasks", "detail"] as const;
export const dashboardTaskArtifactQueryPrefix = ["dashboard", "tasks", "artifacts"] as const;

export function buildDashboardTaskBucketQueryKey(dataMode: "rpc", group: "unfinished" | "finished", limit: number) {
  return [...dashboardTaskBucketQueryPrefix, dataMode, group, limit] as const;
}

export function buildDashboardTaskDetailQueryKey(dataMode: "rpc", taskId: string) {
  return [...dashboardTaskDetailQueryPrefix, dataMode, taskId] as const;
}

export function buildDashboardTaskArtifactQueryKey(dataMode: "rpc", taskId: string) {
  return [...dashboardTaskArtifactQueryPrefix, dataMode, taskId] as const;
}

export function getDashboardTaskSecurityRefreshPlan(dataMode: "rpc") {
  return {
    invalidatePrefixes: [dashboardTaskBucketQueryPrefix, dashboardTaskDetailQueryPrefix] as const,
    refetchOnMount: dataMode === "rpc",
  };
}

export function shouldEnableDashboardTaskDetailQuery(selectedTaskId: string | null, detailOpen: boolean) {
  return Boolean(selectedTaskId && detailOpen);
}

export function resolveDashboardTaskSafetyOpenPlan(detailSource: "rpc" | "fallback") {
  return {
    shouldRefetchDetail: detailSource === "fallback",
  };
}

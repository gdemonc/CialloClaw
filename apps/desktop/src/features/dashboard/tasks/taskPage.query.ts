export const dashboardTaskBucketQueryPrefix = ["dashboard", "tasks", "bucket"] as const;
export const dashboardTaskDetailQueryPrefix = ["dashboard", "tasks", "detail"] as const;

export function buildDashboardTaskBucketQueryKey({
  group,
  limit,
  source,
}: {
  group: "unfinished" | "finished";
  limit: number;
  source: "rpc" | "mock";
}) {
  return [...dashboardTaskBucketQueryPrefix, source, group, limit] as const;
}

export function buildDashboardTaskDetailQueryKey({
  source,
  taskId,
}: {
  source: "rpc" | "mock";
  taskId: string;
}) {
  return [...dashboardTaskDetailQueryPrefix, source, taskId] as const;
}

export type DashboardRouteTarget = "home" | "safety";

export const dashboardRoutePaths: Record<DashboardRouteTarget, string> = {
  home: "/",
  safety: "/safety",
};

export function resolveDashboardRoutePath(target: DashboardRouteTarget) {
  return dashboardRoutePaths[target];
}

export function resolveDashboardRouteHref(target: DashboardRouteTarget) {
  const routePath = resolveDashboardRoutePath(target);

  if (routePath === "/") {
    return "./dashboard.html";
  }

  return `./dashboard.html#${routePath}`;
}

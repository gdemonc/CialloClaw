import { resolveDashboardRouteHref, type DashboardRouteTarget } from "./dashboardRouteTargets";

export function openDashboardRoute(target: DashboardRouteTarget) {
  if (typeof window !== "undefined") {
    window.location.assign(resolveDashboardRouteHref(target));
  }

  return target;
}

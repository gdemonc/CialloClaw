import { Window } from "@tauri-apps/api/window";
import { resolveDashboardRouteHref, type DashboardRouteTarget } from "@/features/dashboard/shared/dashboardRouteTargets";

export type DesktopWindowLabel = "dashboard" | "control-panel";
export type { DashboardRouteTarget };

// 该文件封装桌面窗口控制能力。
export async function openOrFocusDesktopWindow(label: DesktopWindowLabel) {
  const windowHandle = await Window.getByLabel(label);

  if (windowHandle === null) {
    throw new Error(`Desktop window not found: ${label}`);
  }

  await windowHandle.show();
  await windowHandle.setFocus();

  return label;
}

// openDashboardRoute 处理当前模块的相关逻辑。
export function openDashboardRoute(target: DashboardRouteTarget) {
  if (typeof window !== "undefined") {
    window.location.assign(resolveDashboardRouteHref(target));
  }

  return target;
}

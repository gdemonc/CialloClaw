import { getCurrentWindow } from "@tauri-apps/api/window";
import { requestShellBallDashboardCloseTransition } from "./dashboardWindowTransition";

type HideOnCloseWindow = ReturnType<typeof getCurrentWindow>;

const destroyOnCloseLabels = new Set(["control-panel"]);

export function installHideOnCloseRequest(windowHandle: HideOnCloseWindow = getCurrentWindow()) {
  let hiding = false;

  return windowHandle.onCloseRequested(async (event) => {
    if (hiding) {
      return;
    }

    event.preventDefault();

    hiding = true;

    try {
      if (windowHandle.label === "dashboard") {
        await requestShellBallDashboardCloseTransition();
      }

      if (destroyOnCloseLabels.has(windowHandle.label)) {
        await windowHandle.destroy();
        return;
      }

      await windowHandle.hide();
    } finally {
      hiding = false;
    }
  });
}

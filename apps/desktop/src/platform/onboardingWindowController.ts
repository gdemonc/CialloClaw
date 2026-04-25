import { LogicalPosition, LogicalSize, Window } from "@tauri-apps/api/window";
import { resetOnboardingNativeTracking } from "./onboardingWindow";

export const ONBOARDING_WINDOW_LABEL = "onboarding";

export type OnboardingWindowFrame = {
  height: number;
  width: number;
  x: number;
  y: number;
};

type SyncOnboardingWindowFrameOptions = {
  alwaysOnTop?: boolean;
};

async function getOrCreateOnboardingWindow() {
  const existingWindow = await Window.getByLabel(ONBOARDING_WINDOW_LABEL);

  if (existingWindow !== null) {
    return existingWindow;
  }

  const onboardingWindowOptions = {
    title: "CialloClaw Onboarding",
    url: "onboarding.html",
    decorations: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    shadow: false,
    visible: false,
    focus: false,
    width: 1280,
    height: 720,
  } as const;

  const onboardingWindow = new Window(ONBOARDING_WINDOW_LABEL, onboardingWindowOptions);

  await new Promise<void>((resolve, reject) => {
    let settled = false;

    const settle = (callback: () => void) => {
      if (settled) {
        return;
      }

      settled = true;
      callback();
    };

    onboardingWindow.once("tauri://created", () => {
      settle(resolve);
    });

    onboardingWindow.once("tauri://error", (event) => {
      const payload = typeof event.payload === "string" ? event.payload : "failed to create onboarding window";
      settle(() => reject(new Error(payload)));
    });
  });

  return onboardingWindow;
}

/**
 * Ensures the onboarding overlay window matches the current monitor frame and
 * stays visible above the active workflow window.
 *
 * @param frame The target logical monitor frame.
 * @param options Window ordering overrides for the current onboarding step.
 */
export async function syncOnboardingWindowFrame(
  frame: OnboardingWindowFrame,
  options: SyncOnboardingWindowFrameOptions = {},
) {
  const onboardingWindow = await getOrCreateOnboardingWindow();
  // The fullscreen onboarding host must start in native click-through mode so a
  // freshly created replay window never blocks the monitor before React reports
  // the card hotspot rectangles.
  await onboardingWindow.setIgnoreCursorEvents(true);
  await onboardingWindow.setPosition(new LogicalPosition(frame.x, frame.y));
  await onboardingWindow.setSize(new LogicalSize(frame.width, frame.height));
  await onboardingWindow.setFocusable(true);
  await onboardingWindow.setAlwaysOnTop(options.alwaysOnTop ?? true);
  await onboardingWindow.show();
}

/**
 * Hides the onboarding overlay window when the guide is idle.
 */
export async function hideOnboardingWindow() {
  const onboardingWindow = await Window.getByLabel(ONBOARDING_WINDOW_LABEL);

  if (onboardingWindow === null) {
    return;
  }

  // Clear the native forwarding hook and stale hotspot cache before destroying
  // the overlay window so later replay sessions recreate a clean host state.
  await resetOnboardingNativeTracking();
  await onboardingWindow.destroy();
}

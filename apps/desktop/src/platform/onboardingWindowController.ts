import { LogicalPosition, LogicalSize, Window } from "@tauri-apps/api/window";

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

  return new Window(ONBOARDING_WINDOW_LABEL, onboardingWindowOptions);
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
  await onboardingWindow.setPosition(new LogicalPosition(frame.x, frame.y));
  await onboardingWindow.setSize(new LogicalSize(frame.width, frame.height));
  // Keep the transparent onboarding host click-through until the overlay webview
  // reports its real card hotspot regions. This prevents replaying onboarding
  // from briefly blocking the whole monitor while the window boots.
  await onboardingWindow.setIgnoreCursorEvents(true);
  // The overlay must stay focusable so its own buttons remain clickable once the
  // native hotspot regions are restored. We avoid explicit focusing here, so the
  // business window still keeps control until the user interacts with the guide.
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

  await onboardingWindow.destroy();
}

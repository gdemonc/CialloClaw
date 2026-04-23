import { LogicalPosition, Window, getCurrentWindow } from "@tauri-apps/api/window";

export const shellBallOnboardingWindowLabel = "shell-ball-onboarding";

const shellBallOnboardingWindowOptions = {
  title: "CialloClaw Onboarding",
  url: "shell-ball-onboarding.html",
  width: 320,
  height: 220,
  visible: false,
  decorations: false,
  transparent: true,
  alwaysOnTop: true,
  resizable: false,
  skipTaskbar: true,
  shadow: false,
  focus: false,
} as const;

async function getOrCreateShellBallOnboardingWindow() {
  const existingWindow = await Window.getByLabel(shellBallOnboardingWindowLabel);
  if (existingWindow !== null) {
    return existingWindow;
  }

  return new Window(shellBallOnboardingWindowLabel, shellBallOnboardingWindowOptions);
}

export async function showShellBallOnboardingWindow() {
  const windowHandle = await getOrCreateShellBallOnboardingWindow();
  await windowHandle.show();
  return windowHandle;
}

export async function hideShellBallOnboardingWindow() {
  const windowHandle = await Window.getByLabel(shellBallOnboardingWindowLabel);
  if (windowHandle === null) {
    return;
  }

  await windowHandle.hide();
}

export async function positionShellBallOnboardingWindow(offsetX = 18, offsetY = -24) {
  const ballWindow = getCurrentWindow();
  const onboardingWindow = await getOrCreateShellBallOnboardingWindow();
  const scaleFactor = await ballWindow.scaleFactor();
  const ballPosition = (await ballWindow.outerPosition()).toLogical(scaleFactor);
  const ballSize = (await ballWindow.outerSize()).toLogical(scaleFactor);

  await onboardingWindow.setPosition(
    new LogicalPosition(
      Math.round(ballPosition.x + ballSize.width + offsetX),
      Math.round(ballPosition.y + offsetY),
    ),
  );
}

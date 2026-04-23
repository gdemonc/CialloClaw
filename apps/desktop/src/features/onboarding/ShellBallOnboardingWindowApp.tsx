import { useCallback } from "react";
import { OnboardingOverlay } from "./OnboardingOverlay";
import {
  advanceDesktopOnboarding,
  skipDesktopOnboarding,
} from "./onboardingService";
import { useDesktopOnboardingSession } from "./useDesktopOnboardingSession";
import { openOrFocusDesktopWindow } from "@/platform/windowController";

/**
 * Renders the shell-ball specific onboarding steps inside a dedicated helper
 * window so the card remains interactive even while the shell-ball host window
 * is running with native click-through outside its registered hotspots.
 *
 * @returns The helper window content for shell-ball onboarding steps.
 */
export function ShellBallOnboardingWindowApp() {
  const onboardingSession = useDesktopOnboardingSession();

  const handleEnd = useCallback(() => {
    void skipDesktopOnboarding();
  }, []);

  const handleStart = useCallback(() => {
    void advanceDesktopOnboarding("shell_ball_intro");
  }, []);

  const handleNextFromIntro = useCallback(() => {
    void advanceDesktopOnboarding("shell_ball_hold_voice");
  }, []);

  const handleAdvanceToDashboard = useCallback(() => {
    void advanceDesktopOnboarding("dashboard_overview");
    void openOrFocusDesktopWindow("dashboard");
  }, []);

  const handleSkipStep = useCallback(() => {
    switch (onboardingSession?.step) {
      case "shell_ball_intro":
        void advanceDesktopOnboarding("shell_ball_hold_voice");
        return;
      case "shell_ball_hold_voice":
        void advanceDesktopOnboarding("shell_ball_double_click");
        return;
      case "shell_ball_double_click":
        void handleAdvanceToDashboard();
        return;
      default:
        return;
    }
  }, [handleAdvanceToDashboard, onboardingSession?.step]);

  if (onboardingSession?.isOpen !== true) {
    return null;
  }

  switch (onboardingSession.step) {
    case "welcome":
      return (
        <OnboardingOverlay
          body="这是一段约 2 分钟的轻量引导。你可以随时跳过，之后也能在控制面板重新查看。"
          onPrimary={handleStart}
          onSecondary={handleEnd}
          placement="modal"
          primaryLabel="开始引导"
          secondaryLabel="跳过"
          title="欢迎来到 CialloClaw"
        />
      );
    case "shell_ball_intro":
      return (
        <OnboardingOverlay
          body="这是桌面主入口。大多数核心操作都会从悬浮球开始。"
          endLabel="结束引导"
          onEnd={handleEnd}
          onPrimary={handleNextFromIntro}
          onSecondary={handleSkipStep}
          primaryLabel="下一步"
          secondaryLabel="跳过本步"
          stepLabel="第 1 步 / 6"
          title="先认识悬浮球"
        />
      );
    case "shell_ball_hold_voice":
      return (
        <OnboardingOverlay
          body="长按悬浮球可以快速发起语音，松开后结束输入。你可以现在试一下。"
          endLabel="结束引导"
          footer="检测到长按后会自动进入下一步；如果现在不想试，也可以直接继续。"
          onEnd={handleEnd}
          onPrimary={handleSkipStep}
          onSecondary={handleSkipStep}
          primaryLabel="下一步"
          secondaryLabel="跳过本步"
          stepLabel="第 2 步 / 6"
          title="长按试试语音"
        />
      );
    case "shell_ball_double_click":
      return (
        <OnboardingOverlay
          body="双击悬浮球可以打开主界面。你可以自己双击，也可以直接继续。"
          endLabel="结束引导"
          footer="检测到双击后会自动打开主界面并进入下一步。"
          onEnd={handleEnd}
          onPrimary={handleAdvanceToDashboard}
          onSecondary={handleSkipStep}
          primaryLabel="下一步"
          secondaryLabel="跳过本步"
          stepLabel="第 3 步 / 6"
          title="双击打开主界面"
        />
      );
    default:
      return null;
  }
}

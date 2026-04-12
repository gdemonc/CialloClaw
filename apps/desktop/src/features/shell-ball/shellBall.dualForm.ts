import { getShellBallHoverEngagementKind } from "./shellBall.interaction";
import type { ShellBallDualFormState, ShellBallEngagementKind, ShellBallVisualState } from "./shellBall.types";

type ShellBallLocalInteractionEngagement = Exclude<ShellBallEngagementKind, "none" | "result">;

type ShellBallLocalInteractionContext = {
  hasRecommendation: boolean;
  activeEngagementKind: ShellBallLocalInteractionEngagement | null;
};

function getShellBallActiveEngagementKind(input: {
  visualState: Extract<ShellBallVisualState, "confirming_intent" | "processing" | "waiting_auth">;
  context: ShellBallLocalInteractionContext;
}): ShellBallLocalInteractionEngagement {
  if (input.context.activeEngagementKind !== null) {
    return input.context.activeEngagementKind;
  }

  if (input.context.hasRecommendation) {
    return "recommendation";
  }

  return "text_selection";
}

export function deriveShellBallDualFormState(input: {
  visualState: ShellBallVisualState;
  context?: ShellBallLocalInteractionContext;
  hasRecommendation?: boolean;
}): ShellBallDualFormState {
  const context: ShellBallLocalInteractionContext = input.context ?? {
    hasRecommendation: input.hasRecommendation ?? false,
    activeEngagementKind: null,
  };

  switch (input.visualState) {
    case "idle":
      return {
        systemState: "idle",
        engagementKind: "none",
      };

    case "hover_input":
      return {
        systemState: "awakenable",
        engagementKind: getShellBallHoverEngagementKind(context.hasRecommendation),
      };

    case "confirming_intent":
      return {
        systemState: "intent_confirming",
        engagementKind: getShellBallActiveEngagementKind({
          visualState: input.visualState,
          context,
        }),
      };

    case "processing":
      return {
        systemState: "processing",
        engagementKind: getShellBallActiveEngagementKind({
          visualState: input.visualState,
          context,
        }),
      };

    case "waiting_auth":
      return {
        systemState: "waiting_confirm",
        engagementKind: getShellBallActiveEngagementKind({
          visualState: input.visualState,
          context,
        }),
        waitingConfirmReason: "authorization",
      };

    case "voice_listening":
      return {
        systemState: "capturing",
        engagementKind: "voice",
        voiceStage: "listening",
      };

    case "voice_locked":
      return {
        systemState: "capturing",
        engagementKind: "voice",
        voiceStage: "locked",
      };
  }
}

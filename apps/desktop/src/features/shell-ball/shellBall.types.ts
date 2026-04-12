export const shellBallVisualStates = [
  "idle",
  "hover_input",
  "confirming_intent",
  "processing",
  "waiting_auth",
  "voice_listening",
  "voice_locked",
] as const;

export type ShellBallVisualState = (typeof shellBallVisualStates)[number];

export const shellBallSystemStates = [
  "idle",
  "awakenable",
  "capturing",
  "intent_confirming",
  "processing",
  "waiting_confirm",
  "completed",
  "abnormal",
] as const;

export type ShellBallSystemState = (typeof shellBallSystemStates)[number];

export const shellBallEngagementKinds = [
  "none",
  "recommendation",
  "text_selection",
  "text_drag",
  "file_drag",
  "file_parsing",
  "voice",
  "result",
] as const;

export type ShellBallEngagementKind = (typeof shellBallEngagementKinds)[number];

export const shellBallWaitingConfirmReasons = ["authorization", "follow_up", "delivery_choice"] as const;

export type ShellBallWaitingConfirmReason = (typeof shellBallWaitingConfirmReasons)[number];

export const shellBallVoiceStages = ["listening", "locked"] as const;

export type ShellBallVoiceStage = (typeof shellBallVoiceStages)[number];

export type ShellBallDualFormState = {
  systemState: ShellBallSystemState;
  engagementKind: ShellBallEngagementKind;
  waitingConfirmReason?: ShellBallWaitingConfirmReason;
  voiceStage?: ShellBallVoiceStage;
};

export function isShellBallDualFormStateLegal(state: ShellBallDualFormState): boolean {
  const { systemState, engagementKind, waitingConfirmReason, voiceStage } = state;

  if (systemState === "waiting_confirm") {
    if (waitingConfirmReason === undefined) {
      return false;
    }

    if (waitingConfirmReason !== "authorization" && engagementKind !== "result") {
      return false;
    }
  } else if (waitingConfirmReason !== undefined) {
    return false;
  }

  if (engagementKind === "voice") {
    if (systemState !== "capturing" || voiceStage === undefined) {
      return false;
    }
  } else if (voiceStage !== undefined) {
    return false;
  }

  if (systemState === "completed" && engagementKind !== "result") {
    return false;
  }

  if (systemState === "idle" && engagementKind !== "none") {
    return false;
  }

  return true;
}

export type ShellBallInteractionEvent =
  | "pointer_enter_hotspot"
  | "pointer_leave_region"
  | "submit_text"
  | "attach_file"
  | "press_start"
  | "voice_lock"
  | "voice_cancel"
  | "voice_finish"
  | "primary_click_locked_voice_end"
  | "auto_advance";

export type ShellBallInputBarMode = "hidden" | "interactive" | "readonly" | "voice";

export type ShellBallTransitionResult =
  | {
      next: ShellBallVisualState;
      autoAdvanceTo: ShellBallVisualState;
      autoAdvanceMs: number;
    }
  | {
      next: ShellBallVisualState;
      autoAdvanceTo?: never;
      autoAdvanceMs?: never;
    };

export type ShellBallPanelMode = "hidden" | "peek" | "compact" | "full";

export type ShellBallBadgeTone = "status" | "intent_confirm" | "processing" | "waiting_auth";

export type ShellBallDemoViewModel = {
  badgeTone: ShellBallBadgeTone;
  badgeLabel: string;
  title: string;
  subtitle: string;
  helperText: string;
  panelMode: ShellBallPanelMode;
  showRiskBlock: boolean;
  riskTitle?: string;
  riskText?: string;
  showVoiceHint: boolean;
  voiceHintText?: string;
};

export type ShellBallPanelSection = "badge" | "title" | "subtitle" | "helperText" | "risk" | "voiceHint";

export type ShellBallAccentTone = "slate" | "sky" | "teal" | "amber";

export type ShellBallRingMode = "hidden" | "listening" | "locked";

export type ShellBallWingMode = "rest" | "lift" | "flutter" | "tucked";

export type ShellBallEyeMode = "soft" | "curious" | "focus" | "careful" | "listening" | "locked";

export type ShellBallMotionConfig = {
  accentTone: ShellBallAccentTone;
  wingMode: ShellBallWingMode;
  ringMode: ShellBallRingMode;
  eyeMode: ShellBallEyeMode;
  bodyScale: number;
  bodyTiltDeg: number;
  floatOffsetY: number;
  floatDurationMs: number;
  breatheScale: number;
  breatheDurationMs: number;
  wingLiftDeg: number;
  wingSpreadPx: number;
  wingDurationMs: number;
  tailSwingDeg: number;
  tailDurationMs: number;
  crestLiftPx: number;
  blinkDelayMs: number;
  showAuthMarker: boolean;
};

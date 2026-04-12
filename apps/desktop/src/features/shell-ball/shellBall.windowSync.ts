import { cloneShellBallBubbleItems } from "./shellBall.bubble";
import type { ShellBallBubbleItem } from "./shellBall.bubble";
import type { ShellBallVoicePreview } from "./shellBall.interaction";
import { getShellBallInputBarMode } from "./shellBall.interaction";
import type { ShellBallDualFormState, ShellBallInputBarMode, ShellBallVisualState } from "./shellBall.types";

export const shellBallWindowSyncEvents = Object.freeze({
  snapshot: "desktop-shell-ball:snapshot",
  geometry: "desktop-shell-ball:geometry",
  helperReady: "desktop-shell-ball:helper-ready",
  pinnedWindowReady: "desktop-shell-ball:pinned-window-ready",
  pinnedWindowDetached: "desktop-shell-ball:pinned-window-detached",
  inputHover: "desktop-shell-ball:input-hover",
  inputFocus: "desktop-shell-ball:input-focus",
  inputDraft: "desktop-shell-ball:input-draft",
  primaryAction: "desktop-shell-ball:primary-action",
  bubbleAction: "desktop-shell-ball:bubble-action",
});

export type ShellBallHelperWindowRole = "bubble" | "input" | "pinned";

export type ShellBallPrimaryAction =
  | "attach_file"
  | "submit"
  | "primary_click"
  | "confirm_intent"
  | "authorization_allow"
  | "authorization_reject"
  | "authorization_details"
  | "authorization_modify"
  | "result_continue"
  | "abnormal_retry"
  | "abnormal_modify";

export type ShellBallBubbleAction = "pin" | "unpin" | "delete";

export type ShellBallBubbleActionSource = "bubble" | "pinned_window";

export type ShellBallHelperWindowVisibility = {
  bubble: boolean;
  input: boolean;
};

export type ShellBallBubbleRegionState = {
  strategy: "persistent";
  hasVisibleItems: boolean;
  clickThrough: boolean;
};

export type ShellBallWindowSnapshotFrontendLocal = {
  dualFormState: ShellBallDualFormState;
};

export type ShellBallWindowSnapshot = {
  visualState: ShellBallVisualState;
  inputBarMode: ShellBallInputBarMode;
  inputValue: string;
  voicePreview: ShellBallVoicePreview;
  bubbleItems: ShellBallBubbleItem[];
  bubbleRegion: ShellBallBubbleRegionState;
  visibility: ShellBallHelperWindowVisibility;
  frontendLocal: ShellBallWindowSnapshotFrontendLocal;
};

export type ShellBallWindowGeometry = {
  ballFrame: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  bounds: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  };
  scaleFactor: number;
};

export type ShellBallHelperReadyPayload = {
  role: Exclude<ShellBallHelperWindowRole, "pinned">;
};

export type ShellBallPinnedWindowReadyPayload = {
  windowLabel: string;
  bubbleId: string;
};

export type ShellBallPinnedWindowDetachedPayload = {
  bubbleId: string;
};

export type ShellBallInputHoverPayload = {
  active: boolean;
};

export type ShellBallInputFocusPayload = {
  focused: boolean;
};

export type ShellBallInputDraftPayload = {
  value: string;
};

export type ShellBallPrimaryActionPayload = {
  source: ShellBallHelperWindowRole;
  action: ShellBallPrimaryAction;
};

export type ShellBallBubbleActionPayload = {
  source: ShellBallBubbleActionSource;
  action: ShellBallBubbleAction;
  bubbleId: string;
};

export function getShellBallHelperWindowVisibility(
  visualState: ShellBallVisualState,
  helpersVisible = true,
): ShellBallHelperWindowVisibility {
  if (!helpersVisible) {
    return {
      bubble: false,
      input: false,
    };
  }

  return {
    bubble: true,
    input: getShellBallInputBarMode(visualState) !== "hidden",
  };
}

export function getShellBallVisibleBubbleItems(items: ShellBallBubbleItem[]): ShellBallBubbleItem[] {
  return items.filter((item) => item.bubble.hidden === false && item.bubble.pinned === false);
}

export function getShellBallBubbleRegionState(items: ShellBallBubbleItem[]): ShellBallBubbleRegionState {
  const visibleItems = getShellBallVisibleBubbleItems(items);

  return {
    strategy: "persistent",
    hasVisibleItems: visibleItems.length > 0,
    clickThrough: visibleItems.length === 0,
  };
}

export function createShellBallWindowSnapshot(input: {
  visualState: ShellBallVisualState;
  dualFormState: ShellBallDualFormState;
  inputValue: string;
  voicePreview: ShellBallVoicePreview;
  bubbleItems?: ShellBallBubbleItem[];
  helpersVisible?: boolean;
}): ShellBallWindowSnapshot {
  const bubbleItems = cloneShellBallBubbleItems(input.bubbleItems ?? []);

  return {
    visualState: input.visualState,
    inputBarMode: getShellBallInputBarMode(input.visualState),
    inputValue: input.inputValue,
    voicePreview: input.voicePreview,
    bubbleItems,
    bubbleRegion: getShellBallBubbleRegionState(bubbleItems),
    visibility: getShellBallHelperWindowVisibility(input.visualState, input.helpersVisible),
    frontendLocal: {
      dualFormState: input.dualFormState,
    },
  };
}

export function createDefaultShellBallWindowSnapshot(): ShellBallWindowSnapshot {
  return createShellBallWindowSnapshot({
    visualState: "idle",
    dualFormState: {
      systemState: "idle",
      engagementKind: "none",
    },
    inputValue: "",
    voicePreview: null,
    bubbleItems: [],
    helpersVisible: true,
  });
}

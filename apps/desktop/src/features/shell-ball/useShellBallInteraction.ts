import { useEffect, useRef, useState } from "react";
import type { PointerEvent } from "react";
import {
  createShellBallInteractionController,
  getShellBallHoverEngagementKind,
  getShellBallInputBarMode,
  getShellBallVoicePreview,
  resolveShellBallVoiceReleaseEvent,
  SHELL_BALL_LONG_PRESS_MS,
  shouldRetainShellBallHoverInput,
  type ShellBallVoicePreview,
} from "./shellBall.interaction";
import type {
  ShellBallDualFormState,
  ShellBallEngagementKind,
  ShellBallInteractionEvent,
  ShellBallVisualState,
} from "./shellBall.types";
import { useShellBallStore } from "../../stores/shellBallStore";

type TimeoutHandle = ReturnType<typeof globalThis.setTimeout>;

type ShellBallInteractionController = ReturnType<typeof createShellBallInteractionController>;

type ShellBallDashboardOpenGesture = "single_click" | "double_click";

type ShellBallLocalInteractionEngagement = Exclude<ShellBallEngagementKind, "none" | "result">;

type ShellBallLocalInteractionContext = {
  hasRecommendation: boolean;
  activeEngagementKind: ShellBallLocalInteractionEngagement | null;
};

type ShellBallLocalInteractionHint = {
  activeEngagementKind?: ShellBallLocalInteractionEngagement | null;
  hasRecommendation?: boolean;
};

function getShellBallVisualStateProvenanceHint(
  visualState: ShellBallVisualState,
): ShellBallLocalInteractionHint | undefined {
  switch (visualState) {
    case "waiting_auth":
      return { activeEngagementKind: "file_drag" };
    case "voice_listening":
    case "voice_locked":
      return { activeEngagementKind: "voice" };
    default:
      return undefined;
  }
}

type ShellBallInteractionConsumedEvent =
  | "press_start"
  | "long_press_voice_entry"
  | "voice_flow_consumed"
  | "force_state_reset";

export function mapShellBallInteractionConsumedEventToFlag(event: ShellBallInteractionConsumedEvent) {
  switch (event) {
    case "press_start":
    case "force_state_reset":
      return false;
    case "long_press_voice_entry":
    case "voice_flow_consumed":
      return true;
  }
}

export function getShellBallDashboardOpenGesturePolicy(input: {
  gesture: ShellBallDashboardOpenGesture;
  state: ShellBallVisualState;
  interactionConsumed: boolean;
}) {
  if (input.gesture === "single_click") {
    return false;
  }

  const canOpenFromState = input.state === "idle" || input.state === "hover_input";
  return canOpenFromState && !input.interactionConsumed;
}

export function getShellBallVoicePreviewFromEvent(input: {
  startX: number | null;
  startY: number | null;
  clientX: number;
  clientY: number;
  fallbackPreview: ShellBallVoicePreview;
}) {
  if (input.startX === null || input.startY === null) {
    return input.fallbackPreview;
  }

  return getShellBallVoicePreview({
    deltaX: input.clientX - input.startX,
    deltaY: input.clientY - input.startY,
  });
}

export function shouldKeepShellBallVoicePreviewOnRegionLeave(state: ShellBallVisualState) {
  return state === "voice_listening";
}

export function getShellBallPostSubmitInputReset(inputValue: string) {
  if (inputValue.trim() === "") {
    return null;
  }

  return {
    nextInputValue: "",
    nextFocused: false,
  };
}

export function getShellBallPressCancelEvent(state: ShellBallVisualState): Extract<ShellBallInteractionEvent, "voice_cancel"> | null {
  return state === "voice_listening" ? "voice_cancel" : null;
}

export function syncShellBallInteractionController(input: {
  controller: ShellBallInteractionController;
  visualState: ShellBallVisualState;
  regionActive: boolean;
}) {
  if (input.controller.getState() === input.visualState) {
    return input.visualState;
  }

  return input.controller.forceState(input.visualState, { regionActive: input.regionActive });
}

export function deriveShellBallLocalInteractionContext(input: {
  previousContext: ShellBallLocalInteractionContext;
  previousVisualState: ShellBallVisualState;
  nextVisualState: ShellBallVisualState;
  hint?: ShellBallLocalInteractionHint;
}): ShellBallLocalInteractionContext {
  const hasRecommendation = input.hint?.hasRecommendation ?? input.previousContext.hasRecommendation;

  switch (input.nextVisualState) {
    case "idle":
      return {
        hasRecommendation: false,
        activeEngagementKind: null,
      };

    case "hover_input":
      return {
        hasRecommendation,
        activeEngagementKind: null,
      };

    case "voice_listening":
    case "voice_locked":
      return {
        hasRecommendation,
        activeEngagementKind: "voice",
      };

    case "confirming_intent":
    case "processing":
    case "waiting_auth":
      return {
        hasRecommendation,
        activeEngagementKind:
          input.hint?.activeEngagementKind ??
          input.previousContext.activeEngagementKind ??
          (input.previousVisualState === "hover_input" && hasRecommendation ? "recommendation" : null),
      };
  }
}

export function deriveShellBallEffectiveInteractionContext(input: {
  storedContext: ShellBallLocalInteractionContext;
  previousVisualState: ShellBallVisualState;
  currentVisualState: ShellBallVisualState;
  pendingHint?: ShellBallLocalInteractionHint;
}): ShellBallLocalInteractionContext {
  const effectiveHint = input.pendingHint ?? getShellBallVisualStateProvenanceHint(input.currentVisualState);

  if (input.previousVisualState === input.currentVisualState && effectiveHint === undefined) {
    return input.storedContext;
  }

  return deriveShellBallLocalInteractionContext({
    previousContext: input.storedContext,
    previousVisualState: input.previousVisualState,
    nextVisualState: input.currentVisualState,
    hint: effectiveHint,
  });
}

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

export function useShellBallInteraction() {
  const visualState = useShellBallStore((state) => state.visualState);
  const setVisualState = useShellBallStore((state) => state.setVisualState);
  const [inputValue, setInputValue] = useState("");
  const [voicePreview, setVoicePreview] = useState<ShellBallVoicePreview>(null);
  const [interactionConsumed, setInteractionConsumed] = useState(false);
  const [localInteractionContext, setLocalInteractionContext] = useState<ShellBallLocalInteractionContext>({
    hasRecommendation: false,
    activeEngagementKind: null,
  });
  const regionActiveRef = useRef(false);
  const inputFocusedRef = useRef(false);
  const pressStartXRef = useRef<number | null>(null);
  const pressStartYRef = useRef<number | null>(null);
  const voicePreviewRef = useRef<ShellBallVoicePreview>(null);
  const longPressHandleRef = useRef<TimeoutHandle | null>(null);
  const setVisualStateRef = useRef(setVisualState);
  const controllerRef = useRef<ShellBallInteractionController | null>(null);
  const previousVisualStateRef = useRef(visualState);
  const pendingInteractionHintRef = useRef<ShellBallLocalInteractionHint | null>(null);

  setVisualStateRef.current = setVisualState;

  if (controllerRef.current === null) {
    controllerRef.current = createShellBallInteractionController({
      initialState: visualState,
      schedule: (callback, ms) =>
        globalThis.setTimeout(() => {
          callback();
          setVisualStateRef.current(controllerRef.current?.getState() ?? visualState);
        }, ms),
      cancel: (handle) => {
        globalThis.clearTimeout(handle as TimeoutHandle);
      },
    });
  }

  function syncVisualState() {
    setVisualState(controllerRef.current?.getState() ?? visualState);
  }

  function clearLongPressTimer() {
    if (longPressHandleRef.current === null) {
      return;
    }

    globalThis.clearTimeout(longPressHandleRef.current);
    longPressHandleRef.current = null;
  }

  function resetInteractionConsumed() {
    setInteractionConsumed(mapShellBallInteractionConsumedEventToFlag("press_start"));
  }

  function consumeInteraction() {
    setInteractionConsumed(mapShellBallInteractionConsumedEventToFlag("voice_flow_consumed"));
  }

  function setCurrentVoicePreview(preview: ShellBallVoicePreview) {
    voicePreviewRef.current = preview;
    setVoicePreview(preview);
  }

  function getHoverRetained() {
    return shouldRetainShellBallHoverInput({
      regionActive: regionActiveRef.current,
      inputFocused: inputFocusedRef.current,
      hasDraft: inputValue.trim() !== "",
    });
  }

  function dispatch(
    event: ShellBallInteractionEvent,
    options: { regionActive?: boolean; hoverRetained?: boolean } = {},
  ) {
    controllerRef.current?.dispatch(event, {
      regionActive: options.regionActive ?? regionActiveRef.current,
      hoverRetained: options.hoverRetained ?? getHoverRetained(),
    });
    syncVisualState();
  }

  function syncHoverRetention() {
    if (regionActiveRef.current) {
      return;
    }

    if (controllerRef.current?.getState() !== "hover_input") {
      return;
    }

    dispatch("pointer_leave_region", {
      regionActive: false,
      hoverRetained: getHoverRetained(),
    });
  }

  function handlePrimaryClick() {
    if (controllerRef.current?.getState() !== "voice_locked") {
      return;
    }

    consumeInteraction();
    dispatch("primary_click_locked_voice_end");
  }

  function handleRegionEnter() {
    regionActiveRef.current = true;
    dispatch("pointer_enter_hotspot", { regionActive: true, hoverRetained: false });
  }

  function handleRegionLeave() {
    regionActiveRef.current = false;
    clearLongPressTimer();

    if (!shouldKeepShellBallVoicePreviewOnRegionLeave(controllerRef.current?.getState() ?? visualState)) {
      setCurrentVoicePreview(null);
    }

    dispatch("pointer_leave_region", {
      regionActive: false,
      hoverRetained: getHoverRetained(),
    });
  }

  function handleSubmitText() {
    const reset = getShellBallPostSubmitInputReset(inputValue);
    if (reset === null) {
      return;
    }

    pendingInteractionHintRef.current = {
      activeEngagementKind: localInteractionContext.hasRecommendation ? "recommendation" : localInteractionContext.activeEngagementKind,
    };
    dispatch("submit_text");
    setInputValue(reset.nextInputValue);
    inputFocusedRef.current = reset.nextFocused;
  }

  function handleAttachFile() {
    pendingInteractionHintRef.current = { activeEngagementKind: "file_drag" };
    dispatch("attach_file");
  }

  function handlePressStart(event: PointerEvent<HTMLButtonElement>) {
    regionActiveRef.current = true;
    // A new pointer sequence clears any prior voice-consumed flag before gesture eligibility is evaluated.
    resetInteractionConsumed();
    pressStartXRef.current = event.clientX;
    pressStartYRef.current = event.clientY;
    setCurrentVoicePreview(null);
    clearLongPressTimer();

    const currentState = controllerRef.current?.getState();
    if (currentState !== "idle" && currentState !== "hover_input") {
      return;
    }

    longPressHandleRef.current = globalThis.setTimeout(() => {
      longPressHandleRef.current = null;
      setInteractionConsumed(mapShellBallInteractionConsumedEventToFlag("long_press_voice_entry"));
      pendingInteractionHintRef.current = { activeEngagementKind: "voice" };
      dispatch("press_start");
    }, SHELL_BALL_LONG_PRESS_MS);
  }

  function handlePressMove(event: PointerEvent<HTMLButtonElement>) {
    if (pressStartXRef.current === null || pressStartYRef.current === null) {
      return;
    }

    const currentState = controllerRef.current?.getState();
    if (currentState !== "voice_listening") {
      return;
    }

    setCurrentVoicePreview(
      getShellBallVoicePreviewFromEvent({
        startX: pressStartXRef.current,
        startY: pressStartYRef.current,
        clientX: event.clientX,
        clientY: event.clientY,
        fallbackPreview: voicePreviewRef.current,
      }),
    );
  }

  function handlePressEnd(event: PointerEvent<HTMLButtonElement>) {
    clearLongPressTimer();

    if (controllerRef.current?.getState() === "voice_listening") {
      consumeInteraction();
      const finalPreview = getShellBallVoicePreviewFromEvent({
        startX: pressStartXRef.current,
        startY: pressStartYRef.current,
        clientX: event.clientX,
        clientY: event.clientY,
        fallbackPreview: voicePreviewRef.current,
      });

      dispatch(resolveShellBallVoiceReleaseEvent(finalPreview));
      pressStartXRef.current = null;
      pressStartYRef.current = null;
      setCurrentVoicePreview(null);
      return true;
    } else if (controllerRef.current?.getState() === "voice_locked") {
      consumeInteraction();
      dispatch("primary_click_locked_voice_end");
      pressStartXRef.current = null;
      pressStartYRef.current = null;
      setCurrentVoicePreview(null);
      return true;
    }

    pressStartXRef.current = null;
    pressStartYRef.current = null;
    setCurrentVoicePreview(null);
    return false;
  }

  function handlePressCancel(event: PointerEvent<HTMLButtonElement>) {
    clearLongPressTimer();

    const cancelEvent = getShellBallPressCancelEvent(controllerRef.current?.getState() ?? visualState);
    pressStartXRef.current = null;
    pressStartYRef.current = null;
    setCurrentVoicePreview(null);

    if (cancelEvent !== null) {
      consumeInteraction();
      dispatch(cancelEvent);
    }
  }

  function handleInputFocusChange(focused: boolean) {
    inputFocusedRef.current = focused;
    if (!focused) {
      syncHoverRetention();
    }
  }

  function handleForceState(state: ShellBallVisualState) {
    clearLongPressTimer();
    setInteractionConsumed(mapShellBallInteractionConsumedEventToFlag("force_state_reset"));
    pressStartXRef.current = null;
    pressStartYRef.current = null;
    setCurrentVoicePreview(null);
    pendingInteractionHintRef.current = getShellBallVisualStateProvenanceHint(state) ?? null;
    controllerRef.current?.forceState(state, { regionActive: regionActiveRef.current });
    syncVisualState();
  }

  const effectiveInteractionContext = deriveShellBallEffectiveInteractionContext({
    storedContext: localInteractionContext,
    previousVisualState: previousVisualStateRef.current,
    currentVisualState: visualState,
    pendingHint: pendingInteractionHintRef.current ?? undefined,
  });

  const dualFormState = deriveShellBallDualFormState({
    visualState,
    context: effectiveInteractionContext,
  });

  useEffect(() => {
    syncHoverRetention();
  }, [inputValue]);

  useEffect(() => {
    if (controllerRef.current === null) {
      return;
    }

    if (previousVisualStateRef.current !== visualState) {
      setLocalInteractionContext(effectiveInteractionContext);
      previousVisualStateRef.current = visualState;
      pendingInteractionHintRef.current = null;
    }

    syncShellBallInteractionController({
      controller: controllerRef.current,
      visualState,
      regionActive: regionActiveRef.current,
    });
  }, [visualState]);

  useEffect(() => {
    return () => {
      clearLongPressTimer();
      pressStartXRef.current = null;
      pressStartYRef.current = null;
      voicePreviewRef.current = null;
      controllerRef.current?.dispose();
    };
  }, []);

  return {
    visualState,
    dualFormState,
    inputValue,
    setInputValue,
    voicePreview,
    inputBarMode: getShellBallInputBarMode(visualState),
    interactionConsumed,
    shouldOpenDashboardFromDoubleClick: getShellBallDashboardOpenGesturePolicy({
      gesture: "double_click",
      state: visualState,
      interactionConsumed,
    }),
    handlePrimaryClick,
    handleRegionEnter,
    handleRegionLeave,
    handleSubmitText,
    handleAttachFile,
    handlePressStart,
    handlePressMove,
    handlePressEnd,
    handlePressCancel,
    handleInputFocusChange,
    handleForceState,
  };
}

import { useEffect, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import type { ShellBallVoicePreview } from "./shellBall.interaction";
import type { ShellBallDualFormState, ShellBallInputBarMode } from "./shellBall.types";
import { getShellBallDualFormRuntimeViewModel } from "./shellBall.runtime";
import {
  emitShellBallInputDraft,
  emitShellBallInputFocus,
  emitShellBallInputHover,
  emitShellBallPrimaryAction,
  useShellBallHelperWindowSnapshot,
} from "./useShellBallCoordinator";
import { useShellBallWindowMetrics } from "./useShellBallWindowMetrics";
import { shellBallWindowSyncEvents } from "./shellBall.windowSync";
import { ShellBallInputBar } from "./components/ShellBallInputBar";

type ShellBallInputWindowProps = {
  mode?: ShellBallInputBarMode;
  dualFormState?: ShellBallDualFormState;
  voicePreview?: ShellBallVoicePreview;
  value?: string;
  onValueChange?: (value: string) => void;
  onAttachFile?: () => void;
  onSubmit?: () => void;
  onFocusChange?: (focused: boolean) => void;
};

export function ShellBallInputWindow({
  mode,
  dualFormState,
  voicePreview,
  value,
  onValueChange,
  onAttachFile,
  onSubmit,
  onFocusChange,
}: ShellBallInputWindowProps) {
  const snapshot = useShellBallHelperWindowSnapshot({ role: "input" });
  const [draftValue, setDraftValue] = useState(value ?? snapshot.inputValue);
  const resolvedDualFormState = dualFormState ?? snapshot.frontendLocal.dualFormState;
  const [focusToken, setFocusToken] = useState(0);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (value !== undefined) {
      setDraftValue(value);
      return;
    }

    setDraftValue(snapshot.inputValue);
  }, [snapshot.inputValue, value]);

  const resolvedMode = mode ?? snapshot.inputBarMode;
  const resolvedVoicePreview = voicePreview ?? snapshot.voicePreview;
  const resolvedValue = value ?? draftValue;
  const actionSummary = getShellBallInputActionSummary(resolvedDualFormState);
  const { rootRef } = useShellBallWindowMetrics({
    clickThrough: resolvedMode === "interactive" && !isFocused,
    role: "input",
    visible: snapshot.visibility.input,
  });

  useEffect(() => {
    const currentWindow = getCurrentWindow();

    let unlisten: (() => void) | null = null;
    let unlistenFocusRequest: (() => void) | null = null;
    void currentWindow.onFocusChanged(({ payload: focused }) => {
      if (focused) {
        setIsFocused(true);
        void emitShellBallInputHover(true);
        return;
      }

      setIsFocused(false);
      void emitShellBallInputFocus(false);
      void emitShellBallInputHover(false);
    }).then((dispose) => {
      unlisten = dispose;
    });

    void currentWindow.listen(shellBallWindowSyncEvents.inputRequestFocus, () => {
      setFocusToken((current) => current + 1);
      setIsFocused(true);
      void currentWindow.setFocus();
    }).then((dispose) => {
      unlistenFocusRequest = dispose;
    });

    return () => {
      unlisten?.();
      unlistenFocusRequest?.();
    };
  }, []);

  function handleValueChange(nextValue: string) {
    if (onValueChange !== undefined) {
      onValueChange(nextValue);
      return;
    }

    setDraftValue(nextValue);
    void emitShellBallInputDraft(nextValue);
  }

  function handleAttachFile() {
    if (onAttachFile !== undefined) {
      onAttachFile();
      return;
    }

    void emitShellBallPrimaryAction("attach_file", "input");
  }

  function handleSubmit() {
    if (onSubmit !== undefined) {
      onSubmit();
      return;
    }

    void emitShellBallPrimaryAction("submit", "input");
  }

  function handleFocusChange(focused: boolean) {
    setIsFocused(focused);
    if (onFocusChange !== undefined) {
      onFocusChange(focused);
      return;
    }

    void emitShellBallInputFocus(focused);
  }

  function handleAction(action: NonNullable<typeof actionSummary>["actions"][number]) {
    void emitShellBallPrimaryAction(action.emitAction, "input");
  }

  return (
    <div
      ref={rootRef}
      className="shell-ball-window shell-ball-window--input"
      onPointerEnter={() => {
        void emitShellBallInputHover(true);
      }}
      onPointerLeave={() => {
        void emitShellBallInputHover(false);
      }}
    >
      {actionSummary === null ? null : (
        <div className="shell-ball-input-window__actions" aria-label="Shell-ball next actions">
          {actionSummary.actions.map((action) => (
            <button
              key={action.id}
              type="button"
              className="shell-ball-input-window__action"
              data-action-id={action.id}
              data-action-intent={action.intent}
              onClick={() => {
                handleAction(action);
              }}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
      <ShellBallInputBar
        focusToken={focusToken}
        mode={resolvedMode}
        voicePreview={resolvedVoicePreview}
        value={resolvedValue}
        onValueChange={handleValueChange}
        onAttachFile={handleAttachFile}
        onSubmit={handleSubmit}
        onFocusChange={handleFocusChange}
      />
    </div>
  );
}

function getShellBallInputActionSummary(state: ShellBallDualFormState) {
  if (
    (state.systemState === "awakenable" && state.engagementKind === "text_selection") ||
    (state.systemState === "waiting_confirm" && state.waitingConfirmReason === "authorization") ||
    (state.systemState === "completed" && state.engagementKind === "result") ||
    state.systemState === "abnormal"
  ) {
    return getShellBallDualFormRuntimeViewModel(state);
  }

  return null;
}

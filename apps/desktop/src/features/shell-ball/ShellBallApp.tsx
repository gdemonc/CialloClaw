/**
 * Shell-ball app renders the merged floating mascot window together with its
 * inline bubble/input/voice affordances, drag/drop handling, and dashboard
 * transitions.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useEventListener } from "ahooks";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { ShellBallSurface, shouldAcceptShellBallTextDrop } from "./ShellBallSurface";
import { ShellBallAttachmentTray } from "./components/ShellBallAttachmentTray";
import { ShellBallBubbleZone } from "./components/ShellBallBubbleZone";
import { ShellBallInputBar } from "./components/ShellBallInputBar";
import { ShellBallVoiceHints } from "./components/ShellBallVoiceHints";
import type { ShellBallSelectionSnapshot } from "./selection/selection.types";
import { useShellBallInteraction } from "./useShellBallInteraction";
import { getShellBallMotionConfig } from "./shellBall.motion";
import type { ShellBallVisualState } from "./shellBall.types";
import { useShellBallCoordinator } from "./useShellBallCoordinator";
import {
  getShellBallVisibleBubbleItems,
  shellBallWindowSyncEvents,
  type ShellBallClipboardSnapshotPayload,
  type ShellBallSelectionSnapshotPayload,
} from "./shellBall.windowSync";
import type { ShellBallDashboardTransitionRequest } from "../../platform/dashboardWindowTransition";
import { shellBallDashboardTransitionEvents } from "../../platform/dashboardWindowTransition";
import {
  createShellBallLogicalPosition,
  hideShellBallWindow,
  shellBallWindowLabels,
  showShellBallWindow,
} from "../../platform/shellBallWindowController";
import { openOrFocusDesktopWindow } from "../../platform/windowController";
import { startShellBallDragging } from "../../platform/shellBallWindow";

type ShellBallAppProps = {
  isDev?: boolean;
};

type ShellBallDashboardTransitionPhase = "idle" | "opening" | "hidden" | "closing";

const SHELL_BALL_DASHBOARD_TRANSITION_DURATION_MS = 260;
const SHELL_BALL_SELECTION_PROMPT_CLEAR_DELAY_MS = 240;
const SHELL_BALL_CLIPBOARD_PROMPT_WINDOW_MS = 10_000;
const SHELL_BALL_STATIC_WINDOW_FRAME = Object.freeze({ width: 800, height: 800 });

type ShellBallClipboardPrompt = {
  text: string;
  expiresAt: number;
};

async function pickShellBallFiles(): Promise<string[]> {
  const result = await invoke<string[]>("pick_shell_ball_files");
  return Array.isArray(result) ? result : [];
}

/**
 * Determines whether the file-drop overlay should be visible for the current
 * floating ball state.
 *
 * @param input File-drop visibility inputs from the ball window.
 * @returns Whether the overlay should be rendered.
 */
export function shouldShowShellBallFileDropOverlay(input: {
  fileDropActive: boolean;
}) {
  return input.fileDropActive;
}

/**
 * Decides when the shell-ball should arm its text drop target without fighting
 * with file drop or voice-only states.
 *
 * @param input Drag and state metadata from the shell-ball window.
 * @returns Whether text drag affordances should be active.
 */
export function shouldArmShellBallTextDropTarget(input: {
  fileDropActive: boolean;
  textDragActive: boolean;
  visualState: ShellBallVisualState;
}) {
  if (input.fileDropActive) {
    return false;
  }

  if (input.visualState === "voice_listening" || input.visualState === "voice_locked") {
    return false;
  }

  return input.textDragActive;
}

function waitForAnimationFrame() {
  return new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => resolve());
  });
}

/**
 * Controls the red text-selection marker that appears above the floating ball.
 *
 * @param input Selection availability plus the current shell-ball state.
 * @returns Whether the marker should be shown.
 */
export function shouldShowShellBallSelectionIndicator(input: {
  selection: ShellBallSelectionSnapshot | null;
  visualState: ShellBallVisualState;
}) {
  return input.selection !== null && (input.visualState === "idle" || input.visualState === "hover_input");
}

/**
 * Determines whether a clipboard prompt is still eligible for click-to-submit
 * handling.
 *
 * @param prompt Current clipboard prompt state.
 * @param now Current timestamp in milliseconds.
 * @returns Whether the clipboard prompt should trigger a backend submit.
 */
export function isShellBallClipboardPromptActive(
  prompt: ShellBallClipboardPrompt | null,
  now = Date.now(),
) {
  return prompt !== null && prompt.expiresAt > now;
}

async function resolveShellBallDashboardTransitionFrame(windowFrame: { width: number; height: number } | null) {
  if (windowFrame !== null) {
    return windowFrame;
  }

  const currentWindow = getCurrentWindow();
  const outerSize = await currentWindow.outerSize();
  const scaleFactor = await currentWindow.scaleFactor();
  const logicalSize = outerSize.toLogical(scaleFactor);

  return {
    width: logicalSize.width,
    height: logicalSize.height,
  };
}

export function ShellBallApp({ isDev = false }: ShellBallAppProps) {
  void isDev;
  const {
    visualState,
    inputValue,
    pendingFiles,
    finalizedSpeechPayload,
    voicePreview,
    voiceHintMode,
    voiceHoldProgress,
    regionActive,
    inputFocused,
    handlePrimaryClick,
    shouldOpenDashboardFromDoubleClick,
    handleRegionEnter,
    handleRegionLeave,
    handlePressStart,
    handlePressMove,
    handlePressEnd,
    handlePressCancel,
    handleSubmitText,
    handleAttachFile,
    handleDroppedFiles: handleAppendPendingFiles,
    handleDroppedText,
    handleRemovePendingFile,
    handleInputHoverChange,
    handleInputFocusChange,
    handleInputFocusRequest,
    setInputValue,
    acknowledgeFinalizedSpeechPayload,
  } = useShellBallInteraction();
  const motionConfig = getShellBallMotionConfig(visualState);
  const [dashboardTransitionPhase, setDashboardTransitionPhase] = useState<ShellBallDashboardTransitionPhase>("idle");
  const [fileDropActive, setFileDropActive] = useState(false);
  const [inputFocusToken, setInputFocusToken] = useState(0);
  const [textDragActive, setTextDragActive] = useState(false);
  const [selectionPrompt, setSelectionPrompt] = useState<ShellBallSelectionSnapshot | null>(null);
  const [clipboardPrompt, setClipboardPrompt] = useState<ShellBallClipboardPrompt | null>(null);
  const mascotRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const dashboardTransitionPhaseRef = useRef<ShellBallDashboardTransitionPhase>("idle");
  const clipboardPromptClearTimeoutRef = useRef<number | null>(null);
  const selectionPromptClearTimeoutRef = useRef<number | null>(null);
  const previousVisualStateRef = useRef<ShellBallVisualState>(visualState);
  const transitionQueueRef = useRef(Promise.resolve());
  const dragDropHandlersRef = useRef<{
    handleDroppedFiles: (paths: string[]) => Promise<void> | void;
  }>({
    handleDroppedFiles: () => undefined,
  });
  const shellBallWindowTarget = typeof window === "undefined" ? undefined : window;
  const {
    handleClipboardPrompt: handleCoordinatorClipboardPrompt,
    handleDroppedFiles: handleCoordinatorDroppedFiles,
    handleSelectedTextPrompt: handleCoordinatorSelectedTextPrompt,
    handlePrimaryAction: handleCoordinatorPrimaryAction,
    handleBubbleAction: handleCoordinatorBubbleAction,
    handleBubbleHoverChange: handleCoordinatorBubbleHoverChange,
    handleInputHoverChange: handleCoordinatorInputHoverChange,
    handleInputFocusChange: handleCoordinatorInputFocusChange,
    handleRegionEnter: handleCoordinatorRegionEnter,
    handleRegionLeave: handleCoordinatorRegionLeave,
    snapshot,
  } = useShellBallCoordinator({
    getBallClientRect: () => mascotRef.current?.getBoundingClientRect() ?? null,
    visualState,
    helperWindowsVisible: dashboardTransitionPhase === "idle",
    regionActive,
    inputValue,
    inputFocused,
    pendingFiles,
    finalizedSpeechPayload,
    voicePreview,
    voiceHintMode,
    setInputValue,
    onAppendPendingFiles: handleAppendPendingFiles,
    onRemovePendingFile: handleRemovePendingFile,
    onFinalizedSpeechHandled: acknowledgeFinalizedSpeechPayload,
    onRegionEnter: handleRegionEnter,
    onRegionLeave: handleRegionLeave,
    onInputHoverChange: handleInputHoverChange,
    onInputFocusChange: handleInputFocusChange,
    onSubmitText: handleSubmitText,
    onAttachFile: handleAttachFile,
    onPrimaryClick: handlePrimaryClick,
  });
  const windowFrame = SHELL_BALL_STATIC_WINDOW_FRAME;
  const visibleBubbleItems = getShellBallVisibleBubbleItems(snapshot.bubbleItems);
  dragDropHandlersRef.current = {
    handleDroppedFiles: handleCoordinatorDroppedFiles,
  };

  const focusInlineInputField = useCallback((syncInteraction = true) => {
    if (syncInteraction) {
      handleInputFocusRequest();
    }

    setInputFocusToken((current) => current + 1);
  }, [handleInputFocusRequest]);

  const handleInlineAttachFile = useCallback(() => {
    void (async () => {
      try {
        const selectedPaths = await pickShellBallFiles();
        if (selectedPaths.length === 0) {
          return;
        }

        await handleCoordinatorDroppedFiles(selectedPaths);
        focusInlineInputField();
      } catch (error) {
        console.warn("shell-ball file picker failed", error);
        await handleCoordinatorPrimaryAction("attach_file");
      }
    })();
  }, [focusInlineInputField, handleCoordinatorDroppedFiles, handleCoordinatorPrimaryAction]);

  useEffect(() => {
    const wasVoiceActive =
      previousVisualStateRef.current === "voice_listening" || previousVisualStateRef.current === "voice_locked";
    const isVoiceActive = visualState === "voice_listening" || visualState === "voice_locked";

    // Voice gestures should operate against a stationary orb once capture starts.
    if (!wasVoiceActive && isVoiceActive) {
      return;
    }

    previousVisualStateRef.current = visualState;
  }, [visualState]);

  useEffect(() => {
    const currentWindow = getCurrentWindow();

    if (currentWindow.label !== shellBallWindowLabels.ball) {
      return;
    }

    let disposed = false;
    let cleanup: (() => void) | null = null;

    function applyDashboardTransitionPhase(nextPhase: ShellBallDashboardTransitionPhase) {
      dashboardTransitionPhaseRef.current = nextPhase;
      setDashboardTransitionPhase(nextPhase);
    }

    async function runForwardTransition() {
      if (dashboardTransitionPhaseRef.current !== "idle") {
        return;
      }

      await resolveShellBallDashboardTransitionFrame(windowFrame);
      applyDashboardTransitionPhase("opening");
      await waitForAnimationFrame();
      applyDashboardTransitionPhase("hidden");
      await hideShellBallWindow("ball");
    }

    async function runReverseTransition(requestId?: string) {
      if (dashboardTransitionPhaseRef.current === "idle") {
        if (requestId !== undefined) {
          await currentWindow.emitTo("dashboard", shellBallDashboardTransitionEvents.complete, {
            direction: "close",
            requestId,
          });
        }

        return;
      }

      await resolveShellBallDashboardTransitionFrame(windowFrame);
      applyDashboardTransitionPhase("hidden");
      await showShellBallWindow("ball");
      await waitForAnimationFrame();
      await waitForAnimationFrame();
      applyDashboardTransitionPhase("closing");
      applyDashboardTransitionPhase("idle");

      if (requestId !== undefined) {
        await currentWindow.emitTo("dashboard", shellBallDashboardTransitionEvents.complete, {
          direction: "close",
          requestId,
        });
      }
    }

    void currentWindow
      .listen<ShellBallDashboardTransitionRequest>(shellBallDashboardTransitionEvents.request, ({ payload }) => {
        transitionQueueRef.current = transitionQueueRef.current
          .catch((): void => undefined)
          .then(async () => {
            if (disposed) {
              return;
            }

            if (payload.direction === "open") {
              await runForwardTransition();
              return;
            }

            await runReverseTransition(payload.requestId);
          });
      })
      .then((unlisten) => {
        if (disposed) {
          unlisten();
          return;
        }

        cleanup = unlisten;
      });

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, [windowFrame]);

  useEffect(() => {
    const currentWindow = getCurrentWindow();

    if (currentWindow.label !== shellBallWindowLabels.ball) {
      return;
    }

    let cleanup: (() => void) | null = null;
    let disposed = false;

    void currentWindow.onDragDropEvent((event) => {
      switch (event.payload.type) {
        case "enter":
        case "over":
          setFileDropActive(true);
          return;
        case "leave":
          setFileDropActive(false);
          return;
        case "drop":
          setFileDropActive(false);
          if (event.payload.paths.length === 0) {
            return;
          }

          void dragDropHandlersRef.current.handleDroppedFiles(event.payload.paths);
          return;
      }
    }).then((unlisten) => {
      if (disposed) {
        unlisten();
        return;
      }

      cleanup = unlisten;
    });

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, []);

  function handleDoubleClick() {
    if (!shouldOpenDashboardFromDoubleClick) {
      return;
    }

    void openOrFocusDesktopWindow("dashboard");
  }

  const handleSurfaceTextDrop = useCallback((text: string) => {
    handleDroppedText(text);
    window.requestAnimationFrame(() => {
      focusInlineInputField(false);
    });
  }, [focusInlineInputField, handleDroppedText]);

  const clearTextDragState = useCallback(() => {
    setTextDragActive(false);
  }, []);

  const handleWindowTextDrag = useCallback((event: DragEvent) => {
    if (!shouldAcceptShellBallTextDrop(event.dataTransfer)) {
      clearTextDragState();
      return;
    }

    if (!shouldArmShellBallTextDropTarget({
      fileDropActive,
      textDragActive: true,
      visualState,
    })) {
      clearTextDragState();
      return;
    }

    setTextDragActive(true);
  }, [clearTextDragState, fileDropActive, visualState]);

  useEventListener("dragenter", handleWindowTextDrag, {
    target: shellBallWindowTarget,
    enable: shellBallWindowTarget !== undefined,
  });
  useEventListener("dragover", handleWindowTextDrag, {
    target: shellBallWindowTarget,
    enable: shellBallWindowTarget !== undefined,
  });
  useEventListener("dragleave", clearTextDragState, {
    target: shellBallWindowTarget,
    enable: shellBallWindowTarget !== undefined,
  });
  useEventListener("drop", clearTextDragState, {
    target: shellBallWindowTarget,
    enable: shellBallWindowTarget !== undefined,
  });

  useEffect(() => {
    if (!fileDropActive && visualState !== "voice_listening" && visualState !== "voice_locked") {
      return;
    }

    setTextDragActive(false);
  }, [fileDropActive, visualState]);

  useEffect(() => {
    if (visualState !== "idle" && visualState !== "hover_input") {
      if (selectionPromptClearTimeoutRef.current !== null) {
        window.clearTimeout(selectionPromptClearTimeoutRef.current);
        selectionPromptClearTimeoutRef.current = null;
      }
      setSelectionPrompt(null);
    }
  }, [visualState]);

  useEffect(() => {
    if (clipboardPrompt === null) {
      if (clipboardPromptClearTimeoutRef.current !== null) {
        window.clearTimeout(clipboardPromptClearTimeoutRef.current);
        clipboardPromptClearTimeoutRef.current = null;
      }
      return;
    }

    const remainingMs = clipboardPrompt.expiresAt - Date.now();
    if (remainingMs <= 0) {
      setClipboardPrompt(null);
      return;
    }

    clipboardPromptClearTimeoutRef.current = window.setTimeout(() => {
      clipboardPromptClearTimeoutRef.current = null;
      setClipboardPrompt(null);
    }, remainingMs);

    return () => {
      if (clipboardPromptClearTimeoutRef.current !== null) {
        window.clearTimeout(clipboardPromptClearTimeoutRef.current);
        clipboardPromptClearTimeoutRef.current = null;
      }
    };
  }, [clipboardPrompt]);

  useEffect(() => {
    const currentWindow = getCurrentWindow();

    if (currentWindow.label !== shellBallWindowLabels.ball) {
      return;
    }

    let cleanup: (() => void) | null = null;
    let disposed = false;

    void currentWindow
      .listen<ShellBallSelectionSnapshotPayload>(shellBallWindowSyncEvents.selectionSnapshot, ({ payload }) => {
        if (payload.snapshot !== null) {
          if (selectionPromptClearTimeoutRef.current !== null) {
            window.clearTimeout(selectionPromptClearTimeoutRef.current);
            selectionPromptClearTimeoutRef.current = null;
          }

          setSelectionPrompt(payload.snapshot);
          return;
        }

        if (selectionPromptClearTimeoutRef.current !== null) {
          window.clearTimeout(selectionPromptClearTimeoutRef.current);
        }

        selectionPromptClearTimeoutRef.current = window.setTimeout(() => {
          selectionPromptClearTimeoutRef.current = null;
          setSelectionPrompt(null);
        }, SHELL_BALL_SELECTION_PROMPT_CLEAR_DELAY_MS);
      })
      .then((unlisten) => {
        if (disposed) {
          unlisten();
          return;
        }

        cleanup = unlisten;
      });

    return () => {
      disposed = true;
      if (selectionPromptClearTimeoutRef.current !== null) {
        window.clearTimeout(selectionPromptClearTimeoutRef.current);
        selectionPromptClearTimeoutRef.current = null;
      }
      cleanup?.();
    };
  }, []);

  useEffect(() => {
    const currentWindow = getCurrentWindow();

    if (currentWindow.label !== shellBallWindowLabels.ball) {
      return;
    }

    let cleanup: (() => void) | null = null;
    let disposed = false;

    void currentWindow
      .listen<ShellBallClipboardSnapshotPayload>(shellBallWindowSyncEvents.clipboardSnapshot, ({ payload }) => {
        if (payload.text.trim() === "") {
          setClipboardPrompt(null);
          return;
        }

        setClipboardPrompt({
          text: payload.text,
          expiresAt: Date.now() + SHELL_BALL_CLIPBOARD_PROMPT_WINDOW_MS,
        });
      })
      .then((unlisten) => {
        if (disposed) {
          unlisten();
          return;
        }

        cleanup = unlisten;
      });

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, []);

  const handleMascotPrimaryAction = useCallback(() => {
    if (selectionPrompt !== null) {
      if (selectionPromptClearTimeoutRef.current !== null) {
        window.clearTimeout(selectionPromptClearTimeoutRef.current);
        selectionPromptClearTimeoutRef.current = null;
      }

      setSelectionPrompt(null);
      focusInlineInputField();
      handleCoordinatorSelectedTextPrompt(selectionPrompt.text);
      return;
    }

    if (clipboardPrompt !== null) {
      if (!isShellBallClipboardPromptActive(clipboardPrompt)) {
        setClipboardPrompt(null);
        return;
      }

      setClipboardPrompt(null);
      void handleCoordinatorClipboardPrompt(clipboardPrompt.text);
      return;
    }

    handlePrimaryClick();
  }, [clipboardPrompt, focusInlineInputField, handleCoordinatorClipboardPrompt, handleCoordinatorSelectedTextPrompt, handlePrimaryClick, selectionPrompt]);

  return (
    <ShellBallSurface
      containerRef={rootRef}
      dashboardTransitionPhase={dashboardTransitionPhase}
      mascotRef={mascotRef}
      fileDropActive={shouldShowShellBallFileDropOverlay({
        fileDropActive,
      })}
      overlayContent={snapshot.visibility.voice ? <div className="shell-ball-voice-window"><ShellBallVoiceHints hintMode={snapshot.voiceHintMode} voicePreview={snapshot.voicePreview} /></div> : null}
      topContent={snapshot.visibility.bubble && visibleBubbleItems.length > 0 ? (
        <div
          className="shell-ball-window shell-ball-window--bubble"
          data-shell-ball-interactive="true"
          data-visibility-phase={snapshot.bubbleRegion.visibilityPhase}
          onPointerEnter={() => {
            handleCoordinatorBubbleHoverChange(true);
          }}
          onPointerLeave={() => {
            handleCoordinatorBubbleHoverChange(false);
          }}
        >
          <ShellBallBubbleZone
            visualState={snapshot.visualState}
            bubbleItems={visibleBubbleItems}
            onDeleteBubble={(bubbleId) => {
              handleCoordinatorBubbleAction({ action: "delete", bubbleId, source: "bubble" });
            }}
            onPinBubble={(bubbleId) => {
              handleCoordinatorBubbleAction({ action: "pin", bubbleId, source: "bubble" });
            }}
          />
        </div>
      ) : null}
      bottomContent={snapshot.visibility.input ? (
        <div
          className="shell-ball-window shell-ball-window--input"
          data-shell-ball-input-window="true"
          data-shell-ball-interactive="true"
          onPointerEnter={() => {
            handleCoordinatorInputHoverChange(true);
          }}
          onPointerLeave={() => {
            handleCoordinatorInputHoverChange(false);
          }}
        >
          <ShellBallAttachmentTray paths={pendingFiles} onRemove={handleRemovePendingFile} />
          <ShellBallInputBar
            focusToken={inputFocusToken}
            mode={snapshot.inputBarMode}
            voicePreview={snapshot.voicePreview}
            value={inputValue}
            hasPendingFiles={pendingFiles.length > 0}
            onValueChange={setInputValue}
            onAttachFile={handleInlineAttachFile}
            onSubmit={() => {
              void handleCoordinatorPrimaryAction("submit");
            }}
            onFocusChange={handleCoordinatorInputFocusChange}
          />
        </div>
      ) : null}
      textDropActive={shouldArmShellBallTextDropTarget({
        fileDropActive,
        textDragActive,
        visualState,
      })}
      visualState={visualState}
      selectionIndicatorVisible={shouldShowShellBallSelectionIndicator({
        selection: selectionPrompt,
        visualState,
      })}
      voicePreview={voicePreview}
      voiceHoldProgress={voiceHoldProgress}
      motionConfig={motionConfig}
      onDragStart={() => {
        void startShellBallDragging();
      }}
      onDragMove={() => {}}
      onDragEnd={() => {}}
      onDragCancel={() => {}}
      onPrimaryClick={handleMascotPrimaryAction}
      onDoubleClick={handleDoubleClick}
      onRegionEnter={handleCoordinatorRegionEnter}
      onRegionLeave={handleCoordinatorRegionLeave}
      onTextDrop={handleSurfaceTextDrop}
      inputFocused={inputFocused}
      onInputProxyClick={() => {
        focusInlineInputField();
      }}
      onPressStart={handlePressStart}
      onPressMove={handlePressMove}
      onPressEnd={handlePressEnd}
      onPressCancel={handlePressCancel}
    />
  );
}

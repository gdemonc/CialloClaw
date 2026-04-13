import type { ShellBallDualFormState, ShellBallVisualState } from "./shellBall.types";
import { getShellBallDualFormRuntimeViewModel } from "./shellBall.runtime";
import { getShellBallVisibleBubbleItems } from "./shellBall.windowSync";
import { emitShellBallBubbleAction, useShellBallHelperWindowSnapshot } from "./useShellBallCoordinator";
import { useShellBallWindowMetrics } from "./useShellBallWindowMetrics";
import { ShellBallBubbleZone } from "./components/ShellBallBubbleZone";

type ShellBallBubbleWindowProps = {
  visualState?: ShellBallVisualState;
  dualFormState?: ShellBallDualFormState;
};

function shouldShowBubbleSummary(state: ShellBallDualFormState) {
  return (
    (state.systemState === "awakenable" && state.engagementKind === "text_selection") ||
    (state.systemState === "processing" && state.engagementKind === "file_parsing") ||
    (state.systemState === "waiting_confirm" && state.waitingConfirmReason === "authorization") ||
    (state.systemState === "completed" && state.engagementKind === "result") ||
    state.systemState === "abnormal"
  );
}

export function ShellBallBubbleWindow({ visualState, dualFormState }: ShellBallBubbleWindowProps) {
  const snapshot = useShellBallHelperWindowSnapshot({ role: "bubble" });
  const resolvedVisualState = visualState ?? snapshot.visualState;
  const resolvedDualFormState = dualFormState ?? snapshot.frontendLocal.dualFormState;
  const visibleBubbleItems = getShellBallVisibleBubbleItems(snapshot.bubbleItems);
  const { rootRef } = useShellBallWindowMetrics({
    role: "bubble",
    visible: snapshot.visibility.bubble,
    clickThrough: snapshot.bubbleRegion.clickThrough,
  });
  const summary = shouldShowBubbleSummary(resolvedDualFormState)
    ? getShellBallDualFormRuntimeViewModel(resolvedDualFormState)
    : null;

  return (
    <div
      ref={rootRef}
      className="shell-ball-window shell-ball-window--bubble"
      aria-label="Shell-ball bubble window"
      data-visibility-phase={snapshot.bubbleRegion.visibilityPhase}
    >
      {summary === null ? null : (
        <section className="shell-ball-bubble-window__summary" aria-live="polite">
          <p className="shell-ball-bubble-window__summary-title">{summary.bubbleTitle}</p>
          <p className="shell-ball-bubble-window__summary-text">{summary.bubbleText}</p>
        </section>
      )}
      <ShellBallBubbleZone
        visualState={resolvedVisualState}
        bubbleItems={visibleBubbleItems}
        onDeleteBubble={(bubbleId) => {
          void emitShellBallBubbleAction("delete", bubbleId);
        }}
        onPinBubble={(bubbleId) => {
          void emitShellBallBubbleAction("pin", bubbleId);
        }}
      />
    </div>
  );
}

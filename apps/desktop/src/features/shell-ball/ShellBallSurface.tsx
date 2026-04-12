import type { PointerEvent, ReactNode, RefObject } from "react";
import type { ShellBallVoicePreview } from "./shellBall.interaction";
import type { ShellBallDualFormState, ShellBallMotionConfig, ShellBallVisualState } from "./shellBall.types";
import { getShellBallRuntimeBallLabel } from "./shellBall.runtime";
import { ShellBallMascot } from "./components/ShellBallMascot";

type ShellBallSurfaceProps = {
  children?: ReactNode;
  containerRef?: RefObject<HTMLDivElement>;
  dashboardTransitionPhase?: "idle" | "opening" | "hidden" | "closing";
  visualState: ShellBallVisualState;
  dualFormState: ShellBallDualFormState;
  voicePreview: ShellBallVoicePreview;
  motionConfig: ShellBallMotionConfig;
  onDragStart: () => void;
  onPrimaryClick: () => void;
  onDoubleClick: () => void;
  onRegionEnter: () => void;
  onRegionLeave: () => void;
  onPressStart: (event: PointerEvent<HTMLButtonElement>) => void;
  onPressMove: (event: PointerEvent<HTMLButtonElement>) => void;
  onPressEnd: (event: PointerEvent<HTMLButtonElement>) => boolean;
  onPressCancel: (event: PointerEvent<HTMLButtonElement>) => void;
};

export function ShellBallSurface({
  children,
  containerRef,
  dashboardTransitionPhase = "idle",
  visualState,
  dualFormState,
  voicePreview,
  motionConfig,
  onDragStart,
  onPrimaryClick,
  onDoubleClick,
  onRegionEnter,
  onRegionLeave,
  onPressStart,
  onPressMove,
  onPressEnd,
  onPressCancel,
}: ShellBallSurfaceProps) {
  return (
    <div
      ref={containerRef}
      className="shell-ball-surface"
      data-dashboard-transition-phase={dashboardTransitionPhase}
      data-system-state={dualFormState.systemState}
      data-engagement-kind={dualFormState.engagementKind}
      aria-label="Shell-ball floating surface"
    >
      <div className="shell-ball-surface__core">
        <div className="shell-ball-surface__interaction-shell">
          <div
            className="shell-ball-surface__interaction-zone"
            data-shell-ball-zone="interaction"
            onPointerEnter={onRegionEnter}
            onPointerLeave={onRegionLeave}
          >
            <div className="shell-ball-surface__body">
              <div className="shell-ball-surface__state-chip" aria-live="polite">
                {getShellBallRuntimeBallLabel(dualFormState)}
              </div>
              <div className="shell-ball-surface__mascot-shell">
                <ShellBallMascot
                  visualState={visualState}
                  dualFormState={dualFormState}
                  voicePreview={voicePreview}
                  motionConfig={motionConfig}
                  onPrimaryClick={onPrimaryClick}
                  onDoubleClick={onDoubleClick}
                  onHotspotDragStart={onDragStart}
                  onPressStart={onPressStart}
                  onPressMove={onPressMove}
                  onPressEnd={onPressEnd}
                  onPressCancel={onPressCancel}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}

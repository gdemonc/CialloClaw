import type { ShellBallVisualState } from "./shellBall.types";
import { ShellBallBubbleZone } from "./components/ShellBallBubbleZone";

type ShellBallBubbleWindowProps = {
  visualState: ShellBallVisualState;
};

export function ShellBallBubbleWindow({ visualState }: ShellBallBubbleWindowProps) {
  return (
    <div className="shell-ball-window shell-ball-window--bubble" aria-label="Shell-ball bubble window">
      <ShellBallBubbleZone visualState={visualState} />
    </div>
  );
}

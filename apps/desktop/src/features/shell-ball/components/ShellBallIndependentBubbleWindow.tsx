import type { ShellBallBubbleItem } from "../shellBall.bubble";
import { ShellBallBubbleMessage } from "./ShellBallBubbleMessage";

type ShellBallIndependentBubbleWindowProps = {
  item: ShellBallBubbleItem;
  onClose: (bubbleId: string) => void;
  onDelete?: (bubbleId: string) => void;
  onDragStart?: () => void;
};

/**
 * Renders a single bubble inside the dedicated popup window entry.
 */
export function ShellBallIndependentBubbleWindow({
  item,
  onClose,
  onDelete,
  onDragStart,
}: ShellBallIndependentBubbleWindowProps) {
  return (
    <div className="shell-ball-independent-bubble-window">
      <div className="shell-ball-independent-bubble-window__shell">
        <ShellBallBubbleMessage
          item={item}
          onPin={onClose}
          onDelete={onDelete}
          pinAction="unpin"
          pinLabel="Close"
          pinAriaLabel="Close bubble window"
          messageClassName="shell-ball-bubble-message--pinned"
          extraControls={onDragStart ? (
            <button
              type="button"
              className="shell-ball-bubble-message__drag-handle"
              aria-label="Drag pinned bubble"
              onPointerDown={() => {
                onDragStart();
              }}
            >
              Drag
            </button>
          ) : null}
        />
      </div>
    </div>
  );
}

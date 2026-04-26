import { useCallback, useEffect, useState } from "react";
import type { ShellBallBubbleItem } from "../shellBall.bubble";
import { ShellBallBubbleMessage } from "./ShellBallBubbleMessage";

type ShellBallBubbleListProps = {
  bubbleItems?: ShellBallBubbleItem[];
  onActivateBubble?: (bubbleId: string) => void;
  onDeleteBubble?: (bubbleId: string) => void;
  onPinBubble?: (bubbleId: string) => void;
  onAllowApprovalBubble?: (bubbleId: string) => void;
  onDenyApprovalBubble?: (bubbleId: string) => void;
};

/**
 * Renders the bubble feed and keeps the currently activated bubble in local
 * view state only. The feed content still comes from the coordinator snapshot,
 * while the active marker exists purely to drive desktop-side popup UX.
 */
export function ShellBallBubbleList({
  bubbleItems = [],
  onActivateBubble,
  onDeleteBubble,
  onPinBubble,
  onAllowApprovalBubble,
  onDenyApprovalBubble,
}: ShellBallBubbleListProps) {
  const [activeBubbleId, setActiveBubbleId] = useState<string | null>(null);

  useEffect(() => {
    if (activeBubbleId === null) {
      return;
    }

    const activeBubbleStillVisible = bubbleItems.some((item) => item.bubble.bubble_id === activeBubbleId && !item.bubble.hidden);

    if (!activeBubbleStillVisible) {
      setActiveBubbleId(null);
    }
  }, [activeBubbleId, bubbleItems]);

  const handleActivateBubble = useCallback((bubbleId: string) => {
    setActiveBubbleId(bubbleId);
    onActivateBubble?.(bubbleId);
  }, [onActivateBubble]);

  return (
    <>
      <div className="shell-ball-bubble-zone__spacer" aria-hidden="true" />
      {bubbleItems.map((item) => {
        const bubbleId = item.bubble.bubble_id;
        const active = bubbleId === activeBubbleId;

        return (
          <div
            key={bubbleId}
            className="shell-ball-bubble-zone__message-entry"
            data-active={active ? "true" : "false"}
            data-freshness={item.desktop.freshnessHint ?? "stale"}
            data-motion={item.desktop.motionHint ?? "settle"}
          >
            <ShellBallBubbleMessage
              item={item}
              active={active}
              onActivate={handleActivateBubble}
              onDelete={onDeleteBubble}
              onPin={onPinBubble}
              onAllowApproval={onAllowApprovalBubble}
              onDenyApproval={onDenyApprovalBubble}
            />
          </div>
        );
      })}
      <div className="shell-ball-bubble-zone__bottom-anchor" aria-hidden="true" />
    </>
  );
}

import { useEffect, useRef } from "react";
import type { ShellBallBubbleMessage } from "../shellBall.bubble";
import type { ShellBallVisualState } from "../shellBall.types";
import { ShellBallBubbleMessage as ShellBallBubbleMessageView } from "./ShellBallBubbleMessage";

type ShellBallBubbleZoneProps = {
  visualState: ShellBallVisualState;
  bubbleMessages?: ShellBallBubbleMessage[];
};

export function ShellBallBubbleZone({ visualState, bubbleMessages = [] }: ShellBallBubbleZoneProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (scrollElement === null) {
      return;
    }

    scrollElement.scrollTop = scrollElement.scrollHeight;
  }, [bubbleMessages]);

  return (
    <section className="shell-ball-bubble-zone" data-state={visualState}>
      <div ref={scrollRef} className="shell-ball-bubble-zone__scroll">
        {bubbleMessages.map((message) => (
          <div
            key={message.id}
            className="shell-ball-bubble-zone__message-entry"
            data-freshness={message.freshnessHint ?? "stale"}
            data-motion={message.motionHint ?? "settle"}
          >
            <ShellBallBubbleMessageView message={message} />
          </div>
        ))}
        <div className="shell-ball-bubble-zone__bottom-anchor" aria-hidden="true" />
      </div>
    </section>
  );
}

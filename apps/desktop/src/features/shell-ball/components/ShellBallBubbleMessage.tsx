import type { ReactNode } from "react";
import type { ShellBallBubbleItem } from "../shellBall.bubble";
import { ShellBallMarkdown } from "./ShellBallMarkdown";

type ShellBallBubbleMessageProps = {
  item: ShellBallBubbleItem;
  active?: boolean;
  onActivate?: (bubbleId: string) => void;
  onDelete?: (bubbleId: string) => void;
  onPin?: (bubbleId: string) => void;
  onAllowApproval?: (bubbleId: string) => void;
  onDenyApproval?: (bubbleId: string) => void;
  pinAction?: "pin" | "unpin";
  pinLabel?: string;
  pinAriaLabel?: string;
  messageClassName?: string;
  extraControls?: ReactNode;
};

/**
 * Renders a single shell-ball bubble message with optional action controls.
 */
export function ShellBallBubbleMessage({
  item,
  active = false,
  onActivate,
  onDelete,
  onPin,
  onAllowApproval,
  onDenyApproval,
  pinAction = "pin",
  pinLabel,
  pinAriaLabel,
  messageClassName,
  extraControls,
}: ShellBallBubbleMessageProps) {
  const bubbleId = item.bubble.bubble_id;
  const bubbleText = item.bubble.text;
  const showMarkdown = item.role === "agent" && item.bubble.type !== "intent_confirm";
  const showLoadingState = item.desktop.presentationHint === "loading";
  const inlineApproval = item.role === "agent" ? item.desktop.inlineApproval : undefined;
  const inlineApprovalBusy = inlineApproval?.status === "submitting";
  const shouldShowInlineApprovalActions =
    inlineApproval !== undefined && onAllowApproval !== undefined && onDenyApproval !== undefined;
  const shouldShowBubbleControls = !shouldShowInlineApprovalActions;

  const resolvedPinLabel = pinLabel ?? (pinAction === "unpin" ? "Unpin" : "Pin");
  const resolvedPinAriaLabel = pinAriaLabel ?? (pinAction === "unpin" ? "Unpin bubble" : "Pin bubble");
  const allowApprovalLabel = inlineApprovalBusy && inlineApproval?.pendingDecision === "allow_once" ? "Allowing..." : "Allow";
  const denyApprovalLabel = inlineApprovalBusy && inlineApproval?.pendingDecision === "deny_once" ? "Denying..." : "Deny";
  const bubbleActivatable = onActivate !== undefined;

  function handleActivateBubble() {
    onActivate?.(bubbleId);
  }

  return (
    <div
      className={`shell-ball-bubble-zone__message-row shell-ball-bubble-zone__message-row--${item.role}`}
      data-active={active ? "true" : "false"}
      data-role={item.role}
    >
      <div
        className={`shell-ball-bubble-message shell-ball-bubble-message--${item.role}${messageClassName ? ` ${messageClassName}` : ""}`}
        data-active={active ? "true" : "false"}
        data-bubble-activatable={bubbleActivatable ? "true" : "false"}
        data-message-id={bubbleId}
        tabIndex={bubbleActivatable ? 0 : undefined}
        onClick={bubbleActivatable ? handleActivateBubble : undefined}
        onKeyDown={bubbleActivatable ? (event) => {
          if (event.key !== "Enter" && event.key !== " ") {
            return;
          }

          event.preventDefault();
          handleActivateBubble();
        } : undefined}
      >
        {shouldShowBubbleControls && onPin ? (
          <button
            type="button"
            className="shell-ball-bubble-message__control shell-ball-bubble-message__pin-control"
            data-bubble-action={pinAction}
            data-bubble-id={bubbleId}
            aria-label={resolvedPinAriaLabel}
            onClick={(event) => {
              event.stopPropagation();
              onPin(bubbleId);
            }}
          >
            {resolvedPinLabel}
          </button>
        ) : null}
        {shouldShowBubbleControls && onDelete ? (
          <button
            type="button"
            className="shell-ball-bubble-message__control shell-ball-bubble-message__delete-control"
            data-bubble-action="delete"
            data-bubble-id={bubbleId}
            aria-label="Delete bubble"
            onClick={(event) => {
              event.stopPropagation();
              onDelete(bubbleId);
            }}
          >
            Delete
          </button>
        ) : null}
        {shouldShowBubbleControls ? extraControls : null}
        {showLoadingState ? (
          <div className="shell-ball-bubble-message__loading" aria-live="polite" aria-label={bubbleText || "Agent is thinking"}>
            <span className="shell-ball-bubble-message__loading-dots" aria-hidden="true">
              <span className="shell-ball-bubble-message__loading-dot" />
              <span className="shell-ball-bubble-message__loading-dot" />
              <span className="shell-ball-bubble-message__loading-dot" />
            </span>
            {bubbleText.trim() !== "" ? <span className="shell-ball-bubble-message__loading-label">{bubbleText}</span> : null}
          </div>
        ) : showMarkdown ? (
          <ShellBallMarkdown text={bubbleText} />
        ) : (
          <p className="shell-ball-bubble-message__text">{bubbleText}</p>
        )}
        {shouldShowInlineApprovalActions ? (
          <div className="shell-ball-bubble-message__approval-actions">
            <button
              type="button"
              className="shell-ball-bubble-message__approval-action shell-ball-bubble-message__approval-action--deny"
              data-bubble-action="deny_approval"
              data-bubble-id={bubbleId}
              aria-label="Deny approval"
              disabled={inlineApprovalBusy}
              onClick={(event) => {
                event.stopPropagation();
                onDenyApproval?.(bubbleId);
              }}
            >
              {denyApprovalLabel}
            </button>
            <button
              type="button"
              className="shell-ball-bubble-message__approval-action shell-ball-bubble-message__approval-action--allow"
              data-bubble-action="allow_approval"
              data-bubble-id={bubbleId}
              aria-label="Allow approval"
              disabled={inlineApprovalBusy}
              onClick={(event) => {
                event.stopPropagation();
                onAllowApproval?.(bubbleId);
              }}
            >
              {allowApprovalLabel}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

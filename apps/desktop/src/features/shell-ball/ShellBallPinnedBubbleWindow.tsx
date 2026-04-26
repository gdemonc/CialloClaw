import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  getShellBallCurrentWindow,
  getShellBallPinnedBubbleIdFromLabel,
  startShellBallWindowDragging,
} from "../../platform/shellBallWindowController";
import { ShellBallIndependentBubbleWindow } from "./components/ShellBallIndependentBubbleWindow";
import {
  emitShellBallBubbleAction,
  emitShellBallPinnedWindowDetached,
  useShellBallPinnedBubbleSnapshot,
} from "./useShellBallCoordinator";

/**
 * Renders the dedicated pinned bubble helper window that stays near the
 * shell-ball until the user detaches it by dragging.
 */
export function ShellBallPinnedBubbleWindow() {
  const windowLabel = getShellBallCurrentWindow().label;
  const bubbleId = getShellBallPinnedBubbleIdFromLabel(windowLabel);
  const snapshot = useShellBallPinnedBubbleSnapshot();
  // This popup selection is local desktop UI state only. The coordinator still
  // owns the formal bubble timeline and snapshot payloads.
  const [activeBubbleId, setActiveBubbleId] = useState<string | null>(bubbleId);
  const [dismissedBubbleId, setDismissedBubbleId] = useState<string | null>(null);
  const [followsShellBallGeometry, setFollowsShellBallGeometry] = useState(true);
  const [portalHost, setPortalHost] = useState<HTMLElement | null>(null);
  const pinnedItem = useMemo(
    () => {
      if (activeBubbleId === null || activeBubbleId === dismissedBubbleId) {
        return undefined;
      }

      return snapshot.bubbleItems.find((item) => item.bubble.bubble_id === activeBubbleId && item.bubble.pinned);
    },
    [activeBubbleId, dismissedBubbleId, snapshot.bubbleItems],
  );

  useEffect(() => {
    if (bubbleId === null || bubbleId === dismissedBubbleId) {
      return;
    }

    setActiveBubbleId(bubbleId);
  }, [bubbleId, dismissedBubbleId]);

  useEffect(() => {
    if (dismissedBubbleId === null) {
      return;
    }

    const dismissedBubbleStillPinned = snapshot.bubbleItems.some(
      (item) => item.bubble.bubble_id === dismissedBubbleId && item.bubble.pinned,
    );

    if (!dismissedBubbleStillPinned) {
      setDismissedBubbleId(null);
    }
  }, [dismissedBubbleId, snapshot.bubbleItems]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    // The dedicated popup window still uses a portal so the independent bubble
    // can escape the root mount box and own its popup lifecycle cleanly.
    const nextPortalHost = document.createElement("div");
    nextPortalHost.className = "shell-ball-independent-bubble-window-portal";
    document.body.appendChild(nextPortalHost);
    setPortalHost(nextPortalHost);

    return () => {
      nextPortalHost.remove();
    };
  }, []);

  if (bubbleId === null || pinnedItem === undefined) {
    return <div className="shell-ball-window shell-ball-window--bubble" aria-label="Shell-ball pinned bubble window" />;
  }

  const pinnedBubbleId = pinnedItem.bubble.bubble_id;

  function handleDetachDrag() {
    if (followsShellBallGeometry) {
      setFollowsShellBallGeometry(false);
      void emitShellBallPinnedWindowDetached(pinnedBubbleId);
    }

    void startShellBallWindowDragging();
  }

  function handleCloseBubble(nextBubbleId: string) {
    setDismissedBubbleId(nextBubbleId);
    setActiveBubbleId(null);
    void emitShellBallBubbleAction("unpin", nextBubbleId, "pinned_window");
  }

  function handleDeleteBubble(nextBubbleId: string) {
    setDismissedBubbleId(nextBubbleId);
    setActiveBubbleId(null);
    void emitShellBallBubbleAction("delete", nextBubbleId, "pinned_window");
  }

  const independentWindow = (
    <div className="shell-ball-window shell-ball-window--bubble shell-ball-window--bubble-pinned" aria-label="Shell-ball pinned bubble window">
      <ShellBallIndependentBubbleWindow
        item={pinnedItem}
        onClose={handleCloseBubble}
        onDelete={handleDeleteBubble}
        onDragStart={handleDetachDrag}
      />
    </div>
  );

  return portalHost === null ? independentWindow : createPortal(independentWindow, portalHost);
}

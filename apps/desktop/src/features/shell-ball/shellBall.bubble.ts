export type ShellBallBubbleMessageRole = "user" | "agent";

export type ShellBallBubbleMessageFreshnessHint = "fresh" | "stale";

export type ShellBallBubbleMessageMotionHint = "settle";

export type ShellBallBubbleMessage = {
  id: string;
  role: ShellBallBubbleMessageRole;
  text: string;
  createdAt: string;
  freshnessHint?: ShellBallBubbleMessageFreshnessHint;
  motionHint?: ShellBallBubbleMessageMotionHint;
};

export function cloneShellBallBubbleMessages(messages: ShellBallBubbleMessage[]): ShellBallBubbleMessage[] {
  return [...messages];
}

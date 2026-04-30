import type { AgentTaskDetailGetResult, Task } from "@cialloclaw/protocol";
import { ArrowUpRight, Pause, Play, RotateCcw, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getTaskPrimaryActions } from "../taskPage.mapper";

type TaskActionBarProps = {
  detail: AgentTaskDetailGetResult | null;
  onAction: (action: "pause" | "resume" | "cancel" | "restart" | "open-safety") => void;
  task: Task;
};

const actionIcons = {
  cancel: XCircle,
  "open-safety": ArrowUpRight,
  pause: Pause,
  restart: RotateCcw,
  resume: Play,
} as const;

export function TaskActionBar({ detail, onAction, task }: TaskActionBarProps) {
  const actions = getTaskPrimaryActions(task, detail);

  return (
    <div className="task-detail-actions">
      {actions.map((action) => {
        const Icon = actionIcons[action.action];

        return (
          <Tooltip key={action.label}>
            <TooltipTrigger render={<Button className="task-detail-actions__button" onClick={() => onAction(action.action)} variant="ghost" />}>
              <Icon className="h-4 w-4" />
              {action.label}
            </TooltipTrigger>
            <TooltipContent className="rounded-full bg-slate-900/90 px-3 py-1.5 text-[0.72rem] text-white">{action.tooltip}</TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}

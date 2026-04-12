import { deriveShellBallDualFormState } from "./useShellBallInteraction";
import type { ShellBallPrimaryAction } from "./shellBall.windowSync";
import type { ShellBallDualFormState, ShellBallVisualState } from "./shellBall.types";

export type ShellBallDualFormRuntimeAction = {
  id:
    | "confirm_intent"
    | "authorization_allow"
    | "authorization_reject"
    | "authorization_details"
    | "authorization_modify"
    | "result_continue"
    | "abnormal_retry"
    | "abnormal_modify";
  label: string;
  intent: "confirm" | "allow" | "reject" | "details" | "modify" | "next_step" | "retry";
  emitAction: ShellBallPrimaryAction;
};

export type ShellBallDualFormRuntimeViewModel = {
  ballLabel: string;
  bubbleTitle: string;
  bubbleText: string;
  actions: readonly ShellBallDualFormRuntimeAction[];
};

export function getShellBallDualFormRuntimeViewModel(state: ShellBallDualFormState): ShellBallDualFormRuntimeViewModel {
  if (state.systemState === "awakenable" && state.engagementKind === "text_selection") {
    return {
      ballLabel: "文本可操作提示",
      bubbleTitle: "已识别当前选中文本",
      bubbleText: "可以直接解释、翻译或总结这段内容。",
      actions: [
        { id: "confirm_intent", label: "确认操作", intent: "confirm", emitAction: "confirm_intent" },
        { id: "authorization_modify", label: "修改请求", intent: "modify", emitAction: "authorization_modify" },
      ],
    };
  }

  if (state.systemState === "processing" && state.engagementKind === "file_parsing") {
    return {
      ballLabel: "文件解析中",
      bubbleTitle: "正在解析文件内容",
      bubbleText: "先完成结构识别，再进入后续处理。",
      actions: [],
    };
  }

  if (state.systemState === "waiting_confirm" && state.waitingConfirmReason === "authorization") {
    return {
      ballLabel: "等待授权",
      bubbleTitle: "此操作需要你的授权",
      bubbleText: "已识别潜在影响范围，请先确认是否继续。",
      actions: [
        { id: "authorization_allow", label: "允许本次", intent: "allow", emitAction: "authorization_allow" },
        { id: "authorization_reject", label: "拒绝", intent: "reject", emitAction: "authorization_reject" },
        { id: "authorization_details", label: "查看详情", intent: "details", emitAction: "authorization_details" },
        { id: "authorization_modify", label: "修改请求", intent: "modify", emitAction: "authorization_modify" },
      ],
    };
  }

  if (state.systemState === "completed" && state.engagementKind === "result") {
    return {
      ballLabel: "结果已就绪",
      bubbleTitle: "轻量结果已准备好",
      bubbleText: "你可以直接查看结果，或继续推进下一步。",
      actions: [{ id: "result_continue", label: "继续下一步", intent: "next_step", emitAction: "result_continue" }],
    };
  }

  if (state.systemState === "abnormal") {
    return {
      ballLabel: "处理异常",
      bubbleTitle: "当前对象处理失败",
      bubbleText: "可以调整请求后重试，或回到上一步重新确认。",
      actions: [
        { id: "abnormal_retry", label: "重试", intent: "retry", emitAction: "abnormal_retry" },
        { id: "abnormal_modify", label: "修改请求", intent: "modify", emitAction: "abnormal_modify" },
      ],
    };
  }

  return {
    ballLabel: "近场承接中",
    bubbleTitle: "当前状态已同步",
    bubbleText: "悬浮球将根据本地双层形态继续承接。",
    actions: [],
  };
}

export function getShellBallRuntimeBallLabel(state: ShellBallDualFormState) {
  return getShellBallDualFormRuntimeViewModel(state).ballLabel;
}

export function getShellBallMascotFallbackDualFormState(visualState: ShellBallVisualState): ShellBallDualFormState {
  return deriveShellBallDualFormState({ visualState });
}

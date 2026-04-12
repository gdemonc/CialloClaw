import type { ShellBallDemoViewModel, ShellBallDualFormState, ShellBallVisualState } from "./shellBall.types";

export const shellBallDemoFixtures = {
  idle: {
    badgeTone: "status",
    badgeLabel: "待机",
    title: "小胖啾正在桌面待命",
    subtitle: "轻量承接入口已就绪",
    helperText: "悬停后可进入输入承接态",
    panelMode: "hidden",
    showRiskBlock: false,
    showVoiceHint: false,
  },
  hover_input: {
    badgeTone: "status",
    badgeLabel: "悬停输入",
    title: "把想法轻轻交给小胖啾",
    subtitle: "近场承接面板已展开",
    helperText: "可继续进入意图确认或语音输入",
    panelMode: "peek",
    showRiskBlock: false,
    showVoiceHint: false,
  },
  confirming_intent: {
    badgeTone: "intent_confirm",
    badgeLabel: "确认意图",
    title: "准备整理当前请求并生成执行重点",
    subtitle: "请确认这是不是你现在想做的事",
    helperText: "确认后将进入处理流程",
    panelMode: "full",
    showRiskBlock: false,
    showVoiceHint: false,
  },
  processing: {
    badgeTone: "processing",
    badgeLabel: "处理中",
    title: "正在整理内容并提炼重点",
    subtitle: "小胖啾正在推进当前任务",
    helperText: "处理完成后会返回短结果或正式交付",
    panelMode: "compact",
    showRiskBlock: false,
    showVoiceHint: false,
  },
  waiting_auth: {
    badgeTone: "waiting_auth",
    badgeLabel: "等待授权",
    title: "此操作需要进一步确认",
    subtitle: "检测到潜在影响范围，正在等待授权",
    helperText: "确认后才会继续执行后续动作",
    panelMode: "full",
    showRiskBlock: true,
    riskTitle: "潜在影响范围",
    riskText: "本次操作可能修改当前工作区内容，需要你明确允许后继续。",
    showVoiceHint: false,
  },
  voice_listening: {
    badgeTone: "status",
    badgeLabel: "语音收听",
    title: "我在认真听你说",
    subtitle: "当前处于轻量收音状态",
    helperText: "继续说话，或切换到持续收音",
    panelMode: "peek",
    showRiskBlock: false,
    showVoiceHint: true,
    voiceHintText: "正在收听，请自然说出你的请求。",
  },
  voice_locked: {
    badgeTone: "processing",
    badgeLabel: "持续收音",
    title: "持续收音已锁定",
    subtitle: "语音输入会保持开启直到结束",
    helperText: "说完后可主动结束本次语音输入",
    panelMode: "compact",
    showRiskBlock: false,
    showVoiceHint: true,
    voiceHintText: "持续收音中，结束前不会自动退出。",
  },
} satisfies Record<ShellBallVisualState, ShellBallDemoViewModel>;

export function getShellBallDemoViewModel(visualState: ShellBallVisualState) {
  return shellBallDemoFixtures[visualState];
}

export type ShellBallDualFormDemoViewModel = {
  ballLabel: string;
  bubbleTitle: string;
  bubbleText: string;
  actionLabels: string[];
};

export function getShellBallDualFormDemoViewModel(state: ShellBallDualFormState): ShellBallDualFormDemoViewModel {
  if (state.systemState === "awakenable" && state.engagementKind === "text_selection") {
    return {
      ballLabel: "文本可操作提示",
      bubbleTitle: "已识别当前选中文本",
      bubbleText: "可以直接解释、翻译或总结这段内容。",
      actionLabels: ["确认操作", "修改请求"],
    };
  }

  if (state.systemState === "processing" && state.engagementKind === "file_parsing") {
    return {
      ballLabel: "文件解析中",
      bubbleTitle: "正在解析文件内容",
      bubbleText: "先完成结构识别，再进入后续处理。",
      actionLabels: ["处理中"],
    };
  }

  if (state.systemState === "waiting_confirm" && state.waitingConfirmReason === "authorization") {
    return {
      ballLabel: "等待授权",
      bubbleTitle: "此操作需要你的授权",
      bubbleText: "已识别潜在影响范围，请先确认是否继续。",
      actionLabels: ["授权继续", "修改请求"],
    };
  }

  if (state.systemState === "completed" && state.engagementKind === "result") {
    return {
      ballLabel: "结果已就绪",
      bubbleTitle: "轻量结果已准备好",
      bubbleText: "你可以直接查看结果，或继续推进下一步。",
      actionLabels: ["继续下一步"],
    };
  }

  if (state.systemState === "abnormal") {
    return {
      ballLabel: "处理异常",
      bubbleTitle: "当前对象处理失败",
      bubbleText: "可以调整请求后重试，或回到上一步重新确认。",
      actionLabels: ["重试", "修改请求"],
    };
  }

  return {
    ballLabel: "近场承接中",
    bubbleTitle: "当前状态已同步",
    bubbleText: "悬浮球将根据本地双层形态继续承接。",
    actionLabels: ["继续"],
  };
}

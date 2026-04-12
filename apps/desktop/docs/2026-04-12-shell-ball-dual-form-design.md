# Shell-Ball 双层形态设计

## 1. 文档定位

本文档用于补充 `shell-ball` 在桌面前端中的其他形态设计，重点解决以下问题：

- 现有 `shell-ball` 只有单层 `visualState`，难以同时表达“系统当前阶段”和“当前主要承接对象”。
- 产品交互草案要求悬浮球形态拆为“系统状态形态 + 交互承接形态”，但当前前端尚未形成稳定模型。
- 后续需要把前端本地形态与后端 `task`、`approval_request`、`delivery_result` 等正式对象接上，因此当前设计必须预留稳定映射位。

本文档只定义前端形态模型与映射原则，不新增正式协议字段，不新增 JSON-RPC 方法，不替代协议真源。

## 2. 依据的真源与参考

### 2.1 项目真源

- `docs/CialloClaw_开发统一规范_v18.md`
- `docs/CialloClaw_协议设计文档_v4.md`
- `docs/CialloClaw_数据设计文档_v6.md`
- `docs/CialloClaw_模块详细设计文档_v5.md`
- `docs/CialloClaw_分工安排和优先级划分_v12.md`
- `docs/原子功能.md`

### 2.2 产品交互参考

- `D:\Desktop\claw\产品交互设计\产品交互设计文档总草案.md`

### 2.3 当前前端实现参考

- `apps/desktop/src/features/shell-ball/shellBall.types.ts`
- `apps/desktop/src/features/shell-ball/shellBall.interaction.ts`
- `apps/desktop/src/features/shell-ball/useShellBallInteraction.ts`
- `apps/desktop/src/features/shell-ball/shellBall.windowSync.ts`
- `apps/desktop/src/features/shell-ball/ShellBallSurface.tsx`

## 3. 设计边界

### 3.1 明确要做的事

- 重新定义前端 `shell-ball` 的双层形态模型。
- 为现有单层 `visualState` 提供兼容映射。
- 明确球体、上方气泡、下方轻量对话框三者的职责边界。
- 为未来与后端正式对象连接预留前端映射位。

### 3.2 明确不做的事

- 不直接修改协议真源。
- 不新增正式 `task` / `approval_request` / `delivery_result` 对象字段。
- 不把前端局部状态伪装成正式业务状态。
- 不让 `run` 替代 `task` 成为悬浮球对外主对象。

## 4. 当前实现与问题

当前前端采用单层 `ShellBallVisualState`：

- `idle`
- `hover_input`
- `confirming_intent`
- `processing`
- `waiting_auth`
- `voice_listening`
- `voice_locked`

该模型足够支撑早期交互演示，但已经出现以下问题：

1. `hover_input` 同时承担“悬停接近”“轻量输入”“推荐问题出现”三层语义，主语义不稳定。
2. `waiting_auth` 语义很明确是“等待授权”，但如果未来还要表达“等待后续动作”“等待交付选择”，当前命名无法扩展。
3. `voice_listening`、`voice_locked` 把“输入类型”与“系统主阶段”绑死在一起，后续不利于和其他输入场景保持一致。
4. 文本选中、文本拖拽、文件拖拽、文件解析、结果返回、异常恢复等场景，目前缺少清晰的统一落点。
5. 若未来由后端推送 `approval_request`、`delivery_result`、错误码与任务状态，当前单层状态机很难稳定映射。

## 5. 双层形态总模型

`shell-ball` 统一采用三层语义：

1. `系统主状态`：表达系统当前所处阶段。
2. `承接对象/内容`：表达当前主要承接的输入类型或结果内容。
3. `附加子阶段`：表达某一类承接对象的局部细分过程。

其中第 1 层始终是主语义，第 2 层是上下文，第 3 层仅在需要时出现。

## 6. 系统主状态

### 6.1 定义

- `idle`
- `awakenable`
- `capturing`
- `intent_confirming`
- `processing`
- `waiting_confirm`
- `completed`
- `abnormal`

### 6.2 含义说明

#### `idle`

默认待机形态。系统可用，但没有正在推进中的任务，也没有需要用户立即处理的事项。

#### `awakenable`

可唤起形态。用户已接近悬浮球、悬停于附近，或系统判断当前处于可继续发起协作的活跃状态。

#### `capturing`

承接中形态。系统已经开始接收输入或任务对象，但尚未进入执行前确认或处理阶段。

#### `intent_confirming`

意图确认中形态。系统已识别到任务对象，但重点仍然是确认“用户想做什么”，而不是立即执行。

#### `processing`

处理中形态。系统已正式接收任务，正在解析上下文、理解需求、执行处理或等待轻量过渡完成。

#### `waiting_confirm`

流程推进中的等待确认形态。系统已走到一个需要用户决定下一步的节点，但不再是最初的意图识别阶段。

#### `completed`

完成形态。系统已完成当前任务，并且已有轻量结果或明确的下一步可见反馈。

#### `abnormal`

异常形态。输入不足、对象不支持、解析失败、执行失败、环境不可用或流程中断时统一进入该形态。

## 7. `waiting_confirm` 的原因字段

为避免把所有等待都混成一类，`waiting_confirm` 必须同时带 `reason`：

- `authorization`
- `follow_up`
- `delivery_choice`

约束如下：

- `intent_confirming` 专门用于执行前确认“你想做什么”。
- `waiting_confirm(reason=authorization)` 专门用于等待授权。
- `waiting_confirm(reason=follow_up)` 用于结果已生成，但需要用户决定下一步是否继续。
- `waiting_confirm(reason=delivery_choice)` 用于结果需要选择交付出口，例如写入文档、打开结果页、打开文件夹等。

这意味着：

- `waiting_auth -> waiting_confirm(reason=authorization) + <当前承接对象>`
- 不能直接把 `intent_confirming` 与 `waiting_confirm` 合并成一个状态。

## 8. 承接对象 / 内容

承接层只表达“当前主要承接的对象或内容”，不再把 `hover` 当作承接形态。

统一定义为：

- `none`
- `recommendation`
- `text_selection`
- `text_drag`
- `file_drag`
- `file_parsing`
- `voice`
- `result`

说明：

- `hover` 只是一种触发条件或进入路径，不再与 `recommendation` 抢主语义。
- 当用户悬停但系统没有推荐内容时，承接对象是 `none`。
- 当用户悬停且系统已给出推荐问题时，承接对象是 `recommendation`。

## 9. 附加子阶段

### 9.1 语音子阶段

`voice` 需要保留 `stage`：

- `listening`
- `locked`

因此映射为：

- `voice_listening -> capturing + voice(stage=listening)`
- `voice_locked -> capturing + voice(stage=locked)`

### 9.2 文件过渡子阶段

文件场景建议显式保留解析过渡：

- `processing + file_parsing`

必要时后续可以继续扩成更细的文件阶段，但当前阶段不提前展开。

## 10. 现有状态到新模型的映射

- `idle -> idle + none`
- `hover_input -> awakenable + none` 或 `awakenable + recommendation`
- `confirming_intent -> intent_confirming + <当前承接对象>`
- `processing -> processing + <当前承接对象>`
- 文件解析过渡 -> `processing + file_parsing`
- `waiting_auth -> waiting_confirm(reason=authorization) + <当前承接对象>`
- `voice_listening -> capturing + voice(stage=listening)`
- `voice_locked -> capturing + voice(stage=locked)`

## 11. P0 先补齐的形态

- `idle + none`
- `awakenable + none`
- `awakenable + recommendation`
- `awakenable + text_selection`
- `capturing + voice(stage=listening|locked)`
- `capturing + file_drag`
- `intent_confirming + <recommendation | text_selection | file_drag | voice>`
- `processing + <当前承接对象>`
- `processing + file_parsing`
- `waiting_confirm(reason=authorization) + <当前承接对象>`
- `completed + result`
- `abnormal + <当前承接对象>`

这些状态共同构成从近场触发、对象承接、意图确认、处理、授权、结果返回到异常恢复的最小闭环。

## 12. P1 保留设计位的形态

- `capturing + text_drag`
- `waiting_confirm(reason=follow_up) + result`
- `waiting_confirm(reason=delivery_choice) + result`
- `abnormal` 的细分原因
- 静态模式 / 活跃停留 / 提醒等级 / 提醒频率

这些能力先作为策略或后续增强项保留，不阻塞 P0 主链路。

## 13. 球体 / 气泡 / 下方对话框的职责分工

### 13.1 球体

球体只表达主状态和弱承接线索，不承载长文本，不承载复杂动作。

职责：

- 表达当前是待机、可唤起、承接中、确认中、处理中、完成还是异常
- 对语音、文件、文本等承接对象给出弱提示

### 13.2 上方气泡

气泡负责说明、判断、短结果、风险摘要与下一步建议。

职责：

- 状态反馈
- 意图判断
- 风险解释
- 简短结果
- 下一步建议

### 13.3 下方轻量对话框

下方对话框负责动作，不负责长期结果。

职责：

- 确认
- 修改意图
- 补充一句输入
- 上传附件
- 触发继续、重试、写入文档、查看详情等下一步动作

### 13.4 等待授权如何表达

等待授权不能只放在气泡里，而应拆成三层联动：

- 球体：进入 `waiting_confirm`
- 气泡：说明为什么需要授权、潜在影响范围是什么
- 下方对话框：给出 `允许 / 拒绝 / 查看详情 / 修改后再执行`

若风险等级较高，悬浮球附近只承担轻量承接，正式授权仍需落到后端的 `approval_request` 主链路与任务详情承接中。

## 14. 合法组合约束

### 14.1 合法组合

- `idle` 只配 `none`
- `awakenable` 配 `none | recommendation | text_selection`
- `capturing` 配 `voice | text_drag | file_drag`
- `intent_confirming` 配 `recommendation | text_selection | text_drag | file_drag | voice`
- `processing` 配 `recommendation | text_selection | text_drag | file_drag | voice | file_parsing`
- `waiting_confirm(reason=authorization)` 配当前执行对象
- `waiting_confirm(reason=follow_up | delivery_choice)` 主要配 `result`
- `completed` 只配 `result`
- `abnormal` 配当前上下文对象；系统级不可用允许 `abnormal + none`

### 14.2 禁止组合

- `idle + recommendation | text_selection | voice | result`
- `awakenable + voice | file_parsing | result`
- `capturing + recommendation | result`
- `intent_confirming + file_parsing`
- `processing + none`
- `completed + none | voice | text_selection | file_drag`
- `waiting_confirm(reason=delivery_choice) + voice | text_selection`
- `waiting_confirm(reason=authorization) + result` 作为默认组合不成立

## 15. 切换原则

- `idle + none -> awakenable + none`：用户接近、悬停或处于轻量可承接状态时触发。
- `idle + none -> awakenable + text_selection`：当前存在明确选中文本时触发。
- `awakenable + none -> awakenable + recommendation`：推荐内容已生成时触发。
- `idle | awakenable -> capturing + voice(stage=listening)`：长按开始收音。
- `capturing + voice(stage=listening) -> capturing + voice(stage=locked)`：上滑锁定。
- `capturing + voice -> idle + none`：取消或释放后未形成有效任务时回落。
- `awakenable + recommendation | text_selection -> intent_confirming + <当前承接对象>`：用户确认开始协作。
- `capturing + file_drag -> processing + file_parsing -> intent_confirming + file_drag`：文件先解析再确认。
- `intent_confirming + <对象> -> processing + <对象>`：用户确认执行。
- `processing + <对象> -> waiting_confirm(reason=authorization) + <对象>`：流程中遇到授权节点。
- `processing + <对象> -> completed + result`：轻量结果可直接承接。
- `completed + result -> waiting_confirm(reason=follow_up | delivery_choice) + result`：流程仍需用户决定下一步。
- `任何主状态 -> abnormal + <上下文对象>`：出现异常统一进入异常形态。

## 16. 与后端连接的预留原则

### 16.1 正式主对象仍然是 `task`

悬浮球前端最终需要围绕正式 `task` 承接，而不是围绕前端自造临时状态长期运行。

### 16.2 后端事件只通过稳定边界进入前端

前端未来接收后端信号时，必须走 JSON-RPC / 订阅事件边界，不直接读取数据库、worker 或模型层。

### 16.3 推荐的后端映射方向

前端双层形态应预留以下映射位：

- `agent.task.start` / `agent.task.confirm` 返回的 `task.status=confirming_intent`：映射到 `intent_confirming`
- `task.updated` 返回的 `task.status=processing`：映射到 `processing`
- `approval.pending` 返回的 `approval_request`，或 `task.updated` 返回的 `task.status=waiting_auth`：映射到 `waiting_confirm(reason=authorization)`
- `delivery.ready` 或方法返回中的 `delivery_result`：映射到 `completed + result`
- 正式错误返回、统一错误码、已登记失败路径：映射到 `abnormal`

### 16.4 承接对象的派生优先级

当前协议面没有专门为 `shell-ball` 双层形态提供独立字段，因此承接对象必须从现有真源派生，不能擅自新增未登记字段。

推荐优先级如下：

1. 当前仍保存在前端内存中的本地触发上下文，例如悬停输入、文本选中、文件拖拽、语音唤起。
2. 已返回或已推送的正式 `task.source_type`。
3. 已存在的授权对象或交付对象，例如活跃的 `approval_request`、`delivery_result`。
4. 若仍无法判断，则回落到 `none`。

明确禁止：

- 为了表达 `shell-ball` 形态，额外往 `task.updated`、`approval.pending`、`delivery.ready` 中塞入未登记的 UI 状态字段。
- 让前端私有的承接对象反向冒充正式协议字段。

### 16.5 前端本地形态与正式对象的关系

前端双层形态是 ViewModel，不是正式协议对象。

它服务于：

- 球体表现
- 气泡承接
- 下方对话框动作
- helper window 同步

它不替代：

- `task.status`
- `approval_request`
- `delivery_result`
- 正式错误码与审计链路

后端对象进入前端后，必须先经过“正式对象 -> 前端本地派生层”的转换，再落到 `shell-ball` 双层形态；双层形态本身不能成为新的协议真源。

## 17. 对实现的约束

### 17.1 建议落点

- `apps/desktop/src/features/shell-ball/shellBall.types.ts`
- `apps/desktop/src/features/shell-ball/shellBall.interaction.ts`
- `apps/desktop/src/features/shell-ball/useShellBallInteraction.ts`
- `apps/desktop/src/features/shell-ball/shellBall.windowSync.ts`
- `apps/desktop/src/features/shell-ball/shellBall.demo.ts`
- `apps/desktop/src/features/shell-ball/ShellBallSurface.tsx`
- `apps/desktop/src/features/shell-ball/ShellBallBubbleWindow.tsx`
- `apps/desktop/src/features/shell-ball/ShellBallInputWindow.tsx`

### 17.2 不应直接做的事

- 不把所有新增语义继续塞回单一 `visualState`
- 不让 `hover` 和 `recommendation` 同时竞争主承接语义
- 不把授权等待和执行前意图确认混为一个状态
- 不在前端长期保留与正式对象冲突的“伪状态真源”

## 18. 一句话结论

`shell-ball` 后续应采用“系统主状态 + 承接对象/内容 + 必要子阶段”的双层形态模型：球体表达主阶段，气泡表达说明与短结果，下方对话框表达动作；并通过前端 ViewModel 映射，预留与后端 `task / approval_request / delivery_result` 主链路的稳定连接位。

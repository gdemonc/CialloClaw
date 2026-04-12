# Shell-Ball Dual-Form State Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将桌面端 `shell-ball` 从单层 `visualState` 扩展为“系统主状态 + 承接对象/内容 + 必要子阶段”的双层形态模型，并为未来对接后端 `task / approval_request / delivery_result` 预留稳定映射位。

**Architecture:** 保留现有前端交互控制器作为事件驱动入口，在前端本地增加一个派生形态层，而不是把所有语义继续塞进单一 `visualState`。新模型先服务球体、气泡、下方输入框与 helper window 的 UI 映射，同时明确未来由 JSON-RPC / 订阅事件接入后端正式对象的映射方向。

**Tech Stack:** React, TypeScript, Tauri desktop frontend, shell-ball contract tests, existing helper-window snapshot flow.

---

## File Map

- Modify: `apps/desktop/src/features/shell-ball/shellBall.types.ts`
  - 定义双层形态类型、`waiting_confirm.reason`、`voice.stage` 等前端本地类型
- Modify: `apps/desktop/src/features/shell-ball/shellBall.interaction.ts`
  - 保留事件驱动主流程，并把现有单层状态映射成更稳定的派生形态输入
- Modify: `apps/desktop/src/features/shell-ball/useShellBallInteraction.ts`
  - 输出双层形态 ViewModel，统一供球体、bubble、input 使用
- Modify: `apps/desktop/src/features/shell-ball/shellBall.windowSync.ts`
  - 让 helper snapshot 可携带双层形态信息，但不引入正式协议字段
- Modify: `apps/desktop/src/features/shell-ball/shellBall.demo.ts`
  - 补充新形态的 demo fixture 与展示文案
- Modify: `apps/desktop/src/features/shell-ball/ShellBallSurface.tsx`
  - 将球体主视觉与系统主状态映射对齐
- Modify: `apps/desktop/src/features/shell-ball/ShellBallBubbleWindow.tsx`
  - 将气泡承接与 `waiting_confirm / completed / abnormal` 的表达对齐
- Modify: `apps/desktop/src/features/shell-ball/ShellBallInputWindow.tsx`
  - 将下方输入框的确认、修改、授权、下一步动作表达对齐
- Test: `apps/desktop/src/features/shell-ball/shellBall.contract.test.ts`
  - 通过 TDD 固定合法组合、映射规则与 helper window 承接规则
- Docs: `apps/desktop/docs/2026-04-12-shell-ball-dual-form-design.md`

## Implementation Rules

- 双层形态是前端 ViewModel，不是正式对象。
- 任何后端连接预留，都必须通过前端映射层表达，不直接伪造协议字段。
- `task` 仍是未来对外正式主对象，不能让 `run` 或局部 UI 状态替代。
- 未经用户明确要求，不创建 git commit。

### Task 1: 定义双层形态类型与组合约束

**Files:**
- Modify: `apps/desktop/src/features/shell-ball/shellBall.types.ts`
- Test: `apps/desktop/src/features/shell-ball/shellBall.contract.test.ts`

- [ ] **Step 1: Write the failing tests**

为以下内容补 contract tests：

- 新的系统主状态类型存在
- 承接对象/内容类型存在
- `waiting_confirm.reason` 类型存在
- `voice.stage` 类型存在
- 合法组合与禁止组合规则可被测试引用

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm --dir apps/desktop test:shell-ball
```

Expected: 新增测试因类型、约束或辅助函数尚不存在而失败。

- [ ] **Step 3: Write minimal implementation**

在 `shellBall.types.ts` 中增加：

- `ShellBallSystemState`
- `ShellBallEngagementKind`
- `ShellBallWaitingConfirmReason`
- `ShellBallVoiceStage`
- 必要的前端本地组合约束辅助类型或纯函数

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
pnpm --dir apps/desktop test:shell-ball
```

Expected: 新增双层形态 contract tests 通过，其他 shell-ball tests 保持绿色。

### Task 2: 构建单层状态到双层形态的派生映射

**Files:**
- Modify: `apps/desktop/src/features/shell-ball/shellBall.interaction.ts`
- Modify: `apps/desktop/src/features/shell-ball/useShellBallInteraction.ts`
- Test: `apps/desktop/src/features/shell-ball/shellBall.contract.test.ts`

- [ ] **Step 1: Write the failing tests**

为以下映射补 failing tests：

- `idle -> idle + none`
- `hover_input -> awakenable + none | recommendation`
- `confirming_intent -> intent_confirming + <当前承接对象>`
- `waiting_auth -> waiting_confirm(reason=authorization) + <当前承接对象>`
- `voice_listening / voice_locked -> capturing + voice(stage=...)`

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm --dir apps/desktop test:shell-ball
```

Expected: 新增映射测试失败，因为 `useShellBallInteraction.ts` 还未输出双层形态 ViewModel。

- [ ] **Step 3: Write minimal implementation**

在不破坏现有事件流的前提下：

- 让 `shellBall.interaction.ts` 继续管理事件与基础状态推进
- 让 `useShellBallInteraction.ts` 增加双层形态派生输出
- 保留现有 `visualState` 兼容位，避免一次性打散 UI

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
pnpm --dir apps/desktop test:shell-ball
```

Expected: 新增派生映射测试通过，旧状态机行为不回归。

### Task 3: 让 helper snapshot 感知双层形态

**Files:**
- Modify: `apps/desktop/src/features/shell-ball/shellBall.windowSync.ts`
- Modify: `apps/desktop/src/features/shell-ball/useShellBallCoordinator.ts`
- Test: `apps/desktop/src/features/shell-ball/shellBall.contract.test.ts`

- [ ] **Step 1: Write the failing tests**

为 helper snapshot 补 tests，验证：

- snapshot 可携带双层形态
- bubble window / input window 能拿到同一份派生形态信息
- 新字段明确属于前端本地 snapshot，而不是协议对象

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm --dir apps/desktop test:shell-ball
```

Expected: helper snapshot 尚未包含这些本地形态信息，测试失败。

- [ ] **Step 3: Write minimal implementation**

在 `shellBall.windowSync.ts` 中扩展 snapshot 类型和构造逻辑，只增加前端本地字段，并在 `useShellBallCoordinator.ts` 中同步发出。

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
pnpm --dir apps/desktop test:shell-ball
```

Expected: helper snapshot tests 通过，原有 bubble/input helper 行为保持兼容。

### Task 4: 落地 P0 形态的 UI 映射

**Files:**
- Modify: `apps/desktop/src/features/shell-ball/shellBall.demo.ts`
- Modify: `apps/desktop/src/features/shell-ball/ShellBallSurface.tsx`
- Modify: `apps/desktop/src/features/shell-ball/ShellBallBubbleWindow.tsx`
- Modify: `apps/desktop/src/features/shell-ball/ShellBallInputWindow.tsx`
- Test: `apps/desktop/src/features/shell-ball/shellBall.contract.test.ts`

- [ ] **Step 1: Write the failing tests**

为以下 UI 行为补 tests：

- `awakenable + text_selection` 能呈现可操作提示态
- `processing + file_parsing` 能呈现文件解析中过渡
- `waiting_confirm(reason=authorization)` 的气泡说明与下方动作区职责分离
- `completed + result` 能表达轻量结果已就绪
- `abnormal + <对象>` 能表达异常说明与恢复动作入口

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm --dir apps/desktop test:shell-ball
```

Expected: 现有 UI 仍只认单层状态，新增映射测试失败。

- [ ] **Step 3: Write minimal implementation**

只补 P0 场景，不提前实现 P1：

- 更新 demo fixtures
- 调整球体主视觉映射
- 调整气泡的说明/结果/授权摘要表达
- 调整下方对话框的确认/授权/下一步动作入口

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
pnpm --dir apps/desktop test:shell-ball
```

Expected: P0 形态 UI tests 通过，现有 helper window 结构保持成立。

### Task 5: 预留与后端正式对象的连接位

**Files:**
- Modify: `apps/desktop/src/features/shell-ball/useShellBallInteraction.ts`
- Modify: `apps/desktop/src/features/shell-ball/shellBall.windowSync.ts`
- Test: `apps/desktop/src/features/shell-ball/shellBall.contract.test.ts`
- Docs: `apps/desktop/docs/2026-04-12-shell-ball-dual-form-design.md`

- [ ] **Step 1: Write the failing tests**

补 tests 验证：

- 双层形态始终由前端本地派生层计算，而不是由后端对象直接“覆盖”为新的真源
- `approval_request` 风格的后端待授权节点可映射到 `waiting_confirm(reason=authorization)`
- `delivery_result` 风格的结果摘要可映射到 `completed + result`
- 错误码类失败可映射到 `abnormal`
- 承接对象优先从本地交互上下文派生，其次才回落到 `task.source_type`、授权对象或交付对象

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm --dir apps/desktop test:shell-ball
```

Expected: 当前实现尚无明确后端连接预留位，测试失败。

- [ ] **Step 3: Write minimal implementation**

增加一个前端本地“正式对象 -> 本地 ViewModel”派生层，但必须满足：

- 不新增协议字段
- 不直接依赖数据库或 worker
- 只为未来 JSON-RPC / 订阅事件接入预留前端绑定点
- 明确使用现有真源：`agent.task.start`、`agent.task.confirm`、`task.updated`、`approval.pending`、`delivery.ready`、`agent.security.respond`
- 绝不把双层形态反向当作新的后端真源

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
pnpm --dir apps/desktop test:shell-ball
```

Expected: 后端映射预留 tests 通过，且不会把前端局部状态误当正式对象。

### Task 6: 最终验证

**Files:**
- Modify: none expected unless final fixes are needed

- [ ] **Step 1: Run shell-ball contract tests**

Run:

```bash
pnpm --dir apps/desktop test:shell-ball
```

Expected: PASS.

- [ ] **Step 2: Run desktop typecheck**

Run:

```bash
pnpm --dir apps/desktop typecheck
```

Expected: PASS.

- [ ] **Step 3: Re-read the design doc and confirm implementation stayed within boundary**

Checklist:

- 是否仍以 `task` 作为未来正式对外主对象
- 是否没有新增 JSON-RPC 方法与正式字段
- 是否把授权、结果、异常都留在前端映射层而非伪协议层
- 是否明确以本地交互上下文 + 已登记正式对象派生承接对象，而不是新增协议字段
- 是否保持球体 / 气泡 / 下方对话框职责清晰

- [ ] **Step 4: Only commit if the user explicitly asks for commits**

如果用户后续要求提交，再按其指定的提交格式执行；在此之前保持工作区未提交状态。

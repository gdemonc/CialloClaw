package runengine

import (
	"testing"
	"time"
)

func TestEngineTaskLifecycle(t *testing.T) {
	engine := NewEngine()
	fixedTime := time.Date(2026, 4, 8, 10, 0, 0, 0, time.UTC)
	engine.now = func() time.Time { return fixedTime }

	task := engine.CreateTask(CreateTaskInput{
		SessionID:   "sess_test",
		Title:       "整理测试任务",
		SourceType:  "selected_text",
		Status:      "confirming_intent",
		Intent:      map[string]any{"name": "summarize", "arguments": map[string]any{"style": "key_points"}},
		CurrentStep: "intent_confirmation",
		RiskLevel:   "green",
		Timeline: []TaskStepRecord{{
			Name:          "intent_confirmation",
			Status:        "pending",
			OrderIndex:    1,
			InputSummary:  "识别到文本对象",
			OutputSummary: "等待用户确认",
		}},
	})

	if task.TaskID == "" || task.RunID == "" {
		t.Fatal("expected task and run identifiers to be generated")
	}

	bubble := map[string]any{"task_id": task.TaskID, "type": "intent_confirm", "text": "请确认意图"}
	if _, ok := engine.SetPresentation(task.TaskID, bubble, nil, nil); !ok {
		t.Fatal("expected initial presentation to be stored")
	}

	confirmed, ok := engine.ConfirmTask(task.TaskID, map[string]any{"name": "rewrite", "arguments": map[string]any{"tone": "professional"}}, map[string]any{"task_id": task.TaskID, "type": "status", "text": "开始处理"})
	if !ok {
		t.Fatal("expected task confirmation to succeed")
	}
	if confirmed.Status != "processing" {
		t.Fatalf("expected processing status after confirmation, got %s", confirmed.Status)
	}
	if len(confirmed.Timeline) != 2 {
		t.Fatalf("expected timeline to append a generate step, got %d steps", len(confirmed.Timeline))
	}

	deliveryResult := map[string]any{"type": "workspace_document", "title": "测试结果", "payload": map[string]any{"path": "D:/CialloClawWorkspace/result.md", "task_id": task.TaskID}}
	artifacts := []map[string]any{{"artifact_id": "art_test", "task_id": task.TaskID, "artifact_type": "generated_doc"}}
	completed, ok := engine.CompleteTask(task.TaskID, deliveryResult, map[string]any{"task_id": task.TaskID, "type": "result", "text": "完成"}, artifacts)
	if !ok {
		t.Fatal("expected task completion to succeed")
	}
	if completed.Status != "completed" {
		t.Fatalf("expected completed status, got %s", completed.Status)
	}
	if completed.FinishedAt == nil {
		t.Fatal("expected finished_at to be set on completion")
	}

	finishedTasks, total := engine.ListTasks("finished", 10, 0)
	if total != 1 || len(finishedTasks) != 1 {
		t.Fatalf("expected completed task to appear in finished list, total=%d len=%d", total, len(finishedTasks))
	}
}

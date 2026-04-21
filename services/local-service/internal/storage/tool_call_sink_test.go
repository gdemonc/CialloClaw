package storage

import (
	"context"
	"path/filepath"
	"testing"

	"github.com/cialloclaw/cialloclaw/services/local-service/internal/tools"
)

func TestToolCallStoresListAndDecodeRecords(t *testing.T) {
	record := tools.ToolCallRecord{
		ToolCallID: "tool_call_001",
		RunID:      "run_001",
		TaskID:     "task_001",
		StepID:     "step_001",
		ToolName:   "read_file",
		Status:     tools.ToolCallStatusSucceeded,
		Input:      map[string]any{"path": "README.md"},
		Output:     map[string]any{"ok": true},
		DurationMS: 42,
	}

	inMemory := newInMemoryToolCallStore()
	if err := inMemory.SaveToolCall(context.Background(), record); err != nil {
		t.Fatalf("in-memory SaveToolCall returned error: %v", err)
	}
	items, total, err := inMemory.ListToolCalls(context.Background(), "task_001", "run_001", 10, 0)
	if err != nil || total != 1 || len(items) != 1 || items[0].ToolName != "read_file" {
		t.Fatalf("in-memory ListToolCalls returned total=%d items=%+v err=%v", total, items, err)
	}

	sqliteStore, err := NewSQLiteToolCallStore(filepath.Join(t.TempDir(), "tool-calls.db"))
	if err != nil {
		t.Fatalf("NewSQLiteToolCallStore returned error: %v", err)
	}
	defer func() { _ = sqliteStore.Close() }()
	if err := sqliteStore.SaveToolCall(context.Background(), record); err != nil {
		t.Fatalf("sqlite SaveToolCall returned error: %v", err)
	}
	items, total, err = sqliteStore.ListToolCalls(context.Background(), "task_001", "run_001", 10, 0)
	if err != nil || total != 1 || len(items) != 1 {
		t.Fatalf("sqlite ListToolCalls returned total=%d items=%+v err=%v", total, items, err)
	}
	if items[0].Status != tools.ToolCallStatusSucceeded || items[0].Input["path"] != "README.md" {
		t.Fatalf("expected decoded tool call record, got %+v", items[0])
	}
	if normalizeToolCallStatus(tools.ToolCallStatusTimeout) != "failed" {
		t.Fatalf("expected timeout status to normalize as failed")
	}
	if denormalizeToolCallStatus("unknown") != tools.ToolCallStatusStarted {
		t.Fatalf("expected unknown status to denormalize to started")
	}
	if paged, total, err := sqliteStore.ListToolCalls(context.Background(), "task_001", "run_001", 1, 5); err != nil || total != 1 || len(paged) != 0 {
		t.Fatalf("expected paged tool-call query overflow to return empty slice, total=%d items=%+v err=%v", total, paged, err)
	}
}

package storage

import (
	"context"
	"database/sql"
	"errors"
	"path/filepath"
	"testing"
)

func TestInMemoryLoopRuntimeStoreSupportsStructuredQueries(t *testing.T) {
	store := newInMemoryLoopRuntimeStore()
	if err := store.SaveRun(context.Background(), RunRecord{RunID: "run_mem_001", TaskID: "task_mem_001", SessionID: "sess_mem_001", Status: "running", IntentName: "summarize", StartedAt: "2026-04-21T10:00:00Z", UpdatedAt: "2026-04-21T10:00:01Z"}); err != nil {
		t.Fatalf("SaveRun returned error: %v", err)
	}
	if err := store.SaveSteps(context.Background(), []StepRecord{{StepID: "step_mem_001", RunID: "run_mem_001", TaskID: "task_mem_001", Name: "plan", Status: "completed", OrderIndex: 1}}); err != nil {
		t.Fatalf("SaveSteps returned error: %v", err)
	}
	if err := store.SaveEvents(context.Background(), []EventRecord{{EventID: "evt_mem_001", RunID: "run_mem_001", TaskID: "task_mem_001", Type: "loop.completed", CreatedAt: "2026-04-21T10:00:03Z"}}); err != nil {
		t.Fatalf("SaveEvents returned error: %v", err)
	}
	if err := store.SaveDeliveryResult(context.Background(), DeliveryResultRecord{DeliveryResultID: "delivery_mem_001", TaskID: "task_mem_001", Type: "bubble", Title: "result", CreatedAt: "2026-04-21T10:00:05Z"}); err != nil {
		t.Fatalf("SaveDeliveryResult returned error: %v", err)
	}
	if err := store.ReplaceTaskCitations(context.Background(), "task_mem_001", []CitationRecord{{CitationID: "cit_mem_002", TaskID: "task_mem_001", OrderIndex: 2}, {CitationID: "cit_mem_001", TaskID: "task_mem_001", OrderIndex: 1}}); err != nil {
		t.Fatalf("ReplaceTaskCitations returned error: %v", err)
	}

	runRecord, err := store.GetRun(context.Background(), "run_mem_001")
	if err != nil || runRecord.TaskID != "task_mem_001" {
		t.Fatalf("GetRun returned record=%+v err=%v", runRecord, err)
	}
	deliveryResults, total, err := store.ListDeliveryResults(context.Background(), "task_mem_001", 10, 0)
	if err != nil || total != 1 || len(deliveryResults) != 1 {
		t.Fatalf("ListDeliveryResults returned total=%d items=%+v err=%v", total, deliveryResults, err)
	}
	latestDelivery, ok, err := store.GetLatestDeliveryResult(context.Background(), "task_mem_001")
	if err != nil || !ok || latestDelivery.DeliveryResultID != "delivery_mem_001" {
		t.Fatalf("GetLatestDeliveryResult returned record=%+v ok=%v err=%v", latestDelivery, ok, err)
	}
	citations, err := store.ListTaskCitations(context.Background(), "task_mem_001")
	if err != nil || len(citations) != 2 || citations[0].CitationID != "cit_mem_001" {
		t.Fatalf("ListTaskCitations returned %+v err=%v", citations, err)
	}
	events, total, err := store.ListEvents(context.Background(), "task_mem_001", "run_mem_001", "loop.completed", "", "", 10, 0)
	if err != nil || total != 1 || len(events) != 1 {
		t.Fatalf("ListEvents returned total=%d items=%+v err=%v", total, events, err)
	}
	if _, err := store.GetRun(context.Background(), "missing"); !errors.Is(err, sql.ErrNoRows) {
		t.Fatalf("expected missing run lookup to return sql.ErrNoRows, got %v", err)
	}
}

func TestSQLiteLoopRuntimeStoreStructuredQueries(t *testing.T) {
	store, err := NewSQLiteLoopRuntimeStore(filepath.Join(t.TempDir(), "loop-runtime-queries.db"))
	if err != nil {
		t.Fatalf("NewSQLiteLoopRuntimeStore returned error: %v", err)
	}
	defer func() { _ = store.Close() }()
	if err := store.SaveRun(context.Background(), RunRecord{RunID: "run_sql_001", TaskID: "task_sql_001", SessionID: "sess_sql_001", Status: "completed", IntentName: "summarize", StartedAt: "2026-04-21T10:00:00Z", UpdatedAt: "2026-04-21T10:00:01Z", FinishedAt: "2026-04-21T10:00:02Z", StopReason: "completed"}); err != nil {
		t.Fatalf("SaveRun returned error: %v", err)
	}
	if err := store.SaveDeliveryResult(context.Background(), DeliveryResultRecord{DeliveryResultID: "delivery_sql_001", TaskID: "task_sql_001", Type: "workspace_document", Title: "result", PayloadJSON: `{"task_id":"task_sql_001"}`, PreviewText: "preview", CreatedAt: "2026-04-21T10:00:03Z"}); err != nil {
		t.Fatalf("SaveDeliveryResult returned error: %v", err)
	}
	if err := store.ReplaceTaskCitations(context.Background(), "task_sql_001", []CitationRecord{{CitationID: "cit_sql_001", TaskID: "task_sql_001", OrderIndex: 0}}); err != nil {
		t.Fatalf("ReplaceTaskCitations returned error: %v", err)
	}
	if err := store.SaveEvents(context.Background(), []EventRecord{{EventID: "evt_sql_001", RunID: "run_sql_001", TaskID: "task_sql_001", Type: "loop.completed", CreatedAt: "2026-04-21T10:00:04Z"}, {EventID: "evt_sql_002", RunID: "run_sql_001", TaskID: "task_sql_001", Type: "loop.started", CreatedAt: "2026-04-21T10:00:02Z"}}); err != nil {
		t.Fatalf("SaveEvents returned error: %v", err)
	}

	runRecord, err := store.GetRun(context.Background(), "run_sql_001")
	if err != nil || runRecord.StopReason != "completed" {
		t.Fatalf("GetRun returned record=%+v err=%v", runRecord, err)
	}
	deliveryResults, total, err := store.ListDeliveryResults(context.Background(), "task_sql_001", 10, 0)
	if err != nil || total != 1 || len(deliveryResults) != 1 || deliveryResults[0].PreviewText != "preview" {
		t.Fatalf("ListDeliveryResults returned total=%d items=%+v err=%v", total, deliveryResults, err)
	}
	if emptyPage, total, err := store.ListDeliveryResults(context.Background(), "task_sql_001", 1, 9); err != nil || total != 1 || len(emptyPage) != 0 {
		t.Fatalf("expected empty paged delivery result slice, total=%d items=%+v err=%v", total, emptyPage, err)
	}
	latestDelivery, ok, err := store.GetLatestDeliveryResult(context.Background(), "task_sql_001")
	if err != nil || !ok || latestDelivery.DeliveryResultID != "delivery_sql_001" {
		t.Fatalf("GetLatestDeliveryResult returned record=%+v ok=%v err=%v", latestDelivery, ok, err)
	}
	if latestDelivery, ok, err := store.GetLatestDeliveryResult(context.Background(), "missing_task"); err != nil || ok || latestDelivery.DeliveryResultID != "" {
		t.Fatalf("expected missing task latest delivery query to return no record, record=%+v ok=%v err=%v", latestDelivery, ok, err)
	}
	citations, err := store.ListTaskCitations(context.Background(), "task_sql_001")
	if err != nil || len(citations) != 1 || citations[0].CitationID != "cit_sql_001" {
		t.Fatalf("ListTaskCitations returned %+v err=%v", citations, err)
	}
	if err := store.ReplaceTaskCitations(context.Background(), "task_sql_001", []CitationRecord{{CitationID: "cit_sql_002", TaskID: "task_sql_001", OrderIndex: 1}, {CitationID: "cit_sql_003", TaskID: "task_sql_001", OrderIndex: 0}}); err != nil {
		t.Fatalf("ReplaceTaskCitations second pass returned error: %v", err)
	}
	citations, err = store.ListTaskCitations(context.Background(), "task_sql_001")
	if err != nil || len(citations) != 2 || citations[0].CitationID != "cit_sql_003" || citations[1].CitationID != "cit_sql_002" {
		t.Fatalf("expected replaced citations to be sorted and old rows removed, got %+v err=%v", citations, err)
	}
	events, total, err := store.ListEvents(context.Background(), "task_sql_001", "run_sql_001", "loop.completed", "", "", 10, 0)
	if err != nil || total != 1 || len(events) != 1 || events[0].EventID != "evt_sql_001" {
		t.Fatalf("ListEvents returned total=%d items=%+v err=%v", total, events, err)
	}
	if emptyEvents, total, err := store.ListEvents(context.Background(), "task_sql_001", "run_sql_001", "loop.completed", "2026-04-21T10:00:05Z", "", 10, 0); err != nil || total != 0 || len(emptyEvents) != 0 {
		t.Fatalf("expected filtered ListEvents to return empty slice, total=%d items=%+v err=%v", total, emptyEvents, err)
	}
	if emptyCitations, err := store.ListTaskCitations(context.Background(), "missing_task"); err != nil || len(emptyCitations) != 0 {
		t.Fatalf("expected missing task citations to return empty slice, citations=%+v err=%v", emptyCitations, err)
	}
	if err := store.initialize(context.Background()); err != nil {
		t.Fatalf("expected repeated initialize to tolerate duplicate columns, got %v", err)
	}
	if !isSQLiteDuplicateColumnError(errors.New("duplicate column name: attempt_index")) || isSQLiteDuplicateColumnError(nil) || isSQLiteDuplicateColumnError(errors.New("other failure")) {
		t.Fatal("unexpected duplicate-column detection result")
	}
	if nullableRuntimeString("") != nil || nullableRuntimeString("  ") != nil || nullableRuntimeString("value") != "value" {
		t.Fatal("expected nullableRuntimeString to drop blank values and preserve non-blank strings")
	}
}

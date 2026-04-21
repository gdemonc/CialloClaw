package storage

import (
	"context"
	"database/sql"
	"errors"
	"path/filepath"
	"testing"
)

func TestSessionStoresSupportCRUDAndPaging(t *testing.T) {
	inMemory := newInMemorySessionStore()
	if err := inMemory.WriteSession(context.Background(), SessionRecord{SessionID: "sess_mem_001", Title: "Session A", Status: "active", CreatedAt: "2026-04-21T10:00:00Z", UpdatedAt: "2026-04-21T10:01:00Z"}); err != nil {
		t.Fatalf("in-memory WriteSession returned error: %v", err)
	}
	if err := inMemory.WriteSession(context.Background(), SessionRecord{SessionID: "sess_mem_002", Title: "Session B", Status: "idle", CreatedAt: "2026-04-21T10:00:00Z", UpdatedAt: "2026-04-21T10:02:00Z"}); err != nil {
		t.Fatalf("in-memory WriteSession returned error: %v", err)
	}
	items, total, err := inMemory.ListSessions(context.Background(), 1, 0)
	if err != nil || total != 2 || len(items) != 1 || items[0].SessionID != "sess_mem_002" {
		t.Fatalf("in-memory ListSessions returned total=%d items=%+v err=%v", total, items, err)
	}
	if _, err := inMemory.GetSession(context.Background(), "missing"); !errors.Is(err, sql.ErrNoRows) {
		t.Fatalf("expected missing in-memory session to return sql.ErrNoRows, got %v", err)
	}
	if err := inMemory.DeleteSession(context.Background(), "sess_mem_001"); err != nil {
		t.Fatalf("in-memory DeleteSession returned error: %v", err)
	}

	sqliteStore, err := NewSQLiteSessionStore(filepath.Join(t.TempDir(), "sessions.db"))
	if err != nil {
		t.Fatalf("NewSQLiteSessionStore returned error: %v", err)
	}
	defer func() { _ = sqliteStore.Close() }()
	if err := sqliteStore.WriteSession(context.Background(), SessionRecord{SessionID: "sess_sql_001", Title: "Session SQL", Status: "active", CreatedAt: "2026-04-21T10:00:00Z", UpdatedAt: "2026-04-21T10:03:00Z"}); err != nil {
		t.Fatalf("sqlite WriteSession returned error: %v", err)
	}
	items, total, err = sqliteStore.ListSessions(context.Background(), 10, 0)
	if err != nil || total != 1 || len(items) != 1 {
		t.Fatalf("sqlite ListSessions returned total=%d items=%+v err=%v", total, items, err)
	}
	record, err := sqliteStore.GetSession(context.Background(), "sess_sql_001")
	if err != nil || record.Title != "Session SQL" {
		t.Fatalf("sqlite GetSession returned record=%+v err=%v", record, err)
	}
	if err := sqliteStore.DeleteSession(context.Background(), "sess_sql_001"); err != nil {
		t.Fatalf("sqlite DeleteSession returned error: %v", err)
	}
	items, total, err = sqliteStore.ListSessions(context.Background(), 10, 0)
	if err != nil || total != 0 || len(items) != 0 {
		t.Fatalf("sqlite ListSessions after delete returned total=%d items=%+v err=%v", total, items, err)
	}
	if paged := pageSessions([]SessionRecord{{SessionID: "one"}, {SessionID: "two"}}, 1, 1); len(paged) != 1 || paged[0].SessionID != "two" {
		t.Fatalf("pageSessions returned %+v", paged)
	}
	if paged := pageSessions([]SessionRecord{{SessionID: "one"}}, 10, 9); len(paged) != 0 {
		t.Fatalf("expected pageSessions overflow to return empty slice, got %+v", paged)
	}
}

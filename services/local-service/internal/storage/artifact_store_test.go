package storage

import (
	"context"
	"testing"
)

func TestInMemoryArtifactStoreReplacesDuplicateArtifactIDs(t *testing.T) {
	store := newInMemoryArtifactStore()
	err := store.SaveArtifacts(context.Background(), []ArtifactRecord{{
		ArtifactID:          "art_001",
		TaskID:              "task_001",
		ArtifactType:        "generated_doc",
		Title:               "first.md",
		Path:                "workspace/first.md",
		MimeType:            "text/markdown",
		DeliveryType:        "workspace_document",
		DeliveryPayloadJSON: `{"path":"workspace/first.md","task_id":"task_001"}`,
		CreatedAt:           "2026-04-14T10:00:00Z",
	}})
	if err != nil {
		t.Fatalf("initial save failed: %v", err)
	}
	err = store.SaveArtifacts(context.Background(), []ArtifactRecord{{
		ArtifactID:          "art_001",
		TaskID:              "task_001",
		ArtifactType:        "generated_doc",
		Title:               "updated.md",
		Path:                "workspace/updated.md",
		MimeType:            "text/markdown",
		DeliveryType:        "workspace_document",
		DeliveryPayloadJSON: `{"path":"workspace/updated.md","task_id":"task_001"}`,
		CreatedAt:           "2026-04-14T10:01:00Z",
	}})
	if err != nil {
		t.Fatalf("replacement save failed: %v", err)
	}
	items, total, err := store.ListArtifacts(context.Background(), "task_001", 20, 0)
	if err != nil {
		t.Fatalf("list artifacts failed: %v", err)
	}
	if total != 1 || len(items) != 1 {
		t.Fatalf("expected one replaced artifact, got total=%d items=%+v", total, items)
	}
	if items[0].Title != "updated.md" || items[0].Path != "workspace/updated.md" {
		t.Fatalf("expected replacement artifact payload, got %+v", items[0])
	}
}

func TestValidateArtifactRecordRejectsInvalidPayloadJSON(t *testing.T) {
	err := validateArtifactRecord(ArtifactRecord{
		ArtifactID:          "art_invalid",
		TaskID:              "task_001",
		ArtifactType:        "generated_doc",
		Title:               "invalid.md",
		Path:                "workspace/invalid.md",
		MimeType:            "text/markdown",
		DeliveryType:        "workspace_document",
		DeliveryPayloadJSON: `{"path":`,
		CreatedAt:           "2026-04-14T10:00:00Z",
	})
	if err == nil {
		t.Fatal("expected invalid payload json to be rejected")
	}
}

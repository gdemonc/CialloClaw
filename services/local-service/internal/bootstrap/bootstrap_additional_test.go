package bootstrap

import (
	"context"
	"path/filepath"
	"testing"
	"time"

	"github.com/cialloclaw/cialloclaw/services/local-service/internal/config"
	"github.com/cialloclaw/cialloclaw/services/local-service/internal/platform"
	"github.com/cialloclaw/cialloclaw/services/local-service/internal/plugin"
	"github.com/cialloclaw/cialloclaw/services/local-service/internal/storage"
)

func TestPersistPluginManifestsHandlesNilAndSuccessPaths(t *testing.T) {
	if err := persistPluginManifests(context.Background(), nil, nil); err != nil {
		t.Fatalf("expected nil dependencies to be ignored, got %v", err)
	}
	service := storage.NewService(platform.NewLocalStorageAdapter(filepath.Join(t.TempDir(), "plugin-manifests.db")))
	defer func() { _ = service.Close() }()
	if err := persistPluginManifests(context.Background(), service, plugin.NewService()); err != nil {
		t.Fatalf("persistPluginManifests returned error: %v", err)
	}
	items, total, err := service.PluginManifestStore().ListPluginManifests(context.Background(), 10, 0)
	if err != nil || total == 0 || len(items) == 0 {
		t.Fatalf("expected plugin manifests to be persisted, total=%d len=%d err=%v", total, len(items), err)
	}
}

func TestAppStartAndCloseHandleLifecycle(t *testing.T) {
	baseDir := t.TempDir()
	app, err := New(config.Config{
		RPC: config.RPCConfig{
			Transport:        "named_pipe",
			NamedPipeName:    `\\.\pipe\cialloclaw-bootstrap-start-test`,
			DebugHTTPAddress: ":0",
		},
		WorkspaceRoot: filepath.Join(baseDir, "workspace"),
		DatabasePath:  filepath.Join(baseDir, "data", "local.db"),
		Model: config.ModelConfig{
			Provider:             "openai_responses",
			ModelID:              "gpt-5.4",
			Endpoint:             "https://api.openai.com/v1/responses",
			SingleTaskLimit:      10.0,
			DailyLimit:           50.0,
			BudgetAutoDowngrade:  true,
			MaxToolIterations:    4,
			ContextCompressChars: 2400,
			ContextKeepRecent:    4,
		},
	})
	if err != nil {
		t.Fatalf("New returned error: %v", err)
	}
	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	if err := app.Start(ctx); err != nil {
		t.Fatalf("Start returned error for canceled context: %v", err)
	}
	if err := app.Close(); err != nil {
		t.Fatalf("Close returned error: %v", err)
	}
	if err := (&App{}).Close(); err != nil {
		t.Fatalf("Close on empty app returned error: %v", err)
	}
	// Give the debug HTTP server shutdown path a brief chance to settle before the
	// next test reuses the process resources.
	time.Sleep(10 * time.Millisecond)
}

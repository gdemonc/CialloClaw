package config

import (
	"path/filepath"
	"testing"
)

func TestLoadUsesExplicitDataAndSeedDirectories(t *testing.T) {
	dataDir := filepath.Join(t.TempDir(), "desktop-data")
	seedDir := filepath.Join(t.TempDir(), "seed")
	cfg := Load(LoadOptions{DataDir: dataDir, SeedDir: seedDir})

	if cfg.DataDir != filepath.Clean(dataDir) {
		t.Fatalf("expected data dir %q, got %q", filepath.Clean(dataDir), cfg.DataDir)
	}
	if cfg.SeedDir != filepath.Clean(seedDir) {
		t.Fatalf("expected seed dir %q, got %q", filepath.Clean(seedDir), cfg.SeedDir)
	}
	if cfg.WorkspaceRoot != filepath.Join(filepath.Clean(dataDir), "workspace") {
		t.Fatalf("expected workspace root to derive from data dir, got %q", cfg.WorkspaceRoot)
	}
	if cfg.DatabasePath != filepath.Join(filepath.Clean(dataDir), "data", "cialloclaw.db") {
		t.Fatalf("expected database path to derive from data dir, got %q", cfg.DatabasePath)
	}
}

func TestLoadDefaultPathsDoNotUseRepoRelativeDirectories(t *testing.T) {
	cfg := Load(LoadOptions{})

	if cfg.DataDir == "" {
		t.Fatal("expected a default data dir to be resolved")
	}
	if cfg.WorkspaceRoot == "workspace" {
		t.Fatalf("expected workspace root to avoid repo-relative default, got %q", cfg.WorkspaceRoot)
	}
	if cfg.DatabasePath == filepath.Join("data", "cialloclaw.db") {
		t.Fatalf("expected database path to avoid repo-relative default, got %q", cfg.DatabasePath)
	}
}

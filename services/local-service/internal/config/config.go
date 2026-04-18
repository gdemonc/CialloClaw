package config

import (
	"os"
	"path/filepath"
	"strings"
)

// ModelConfig describes the local service model configuration snapshot.
type ModelConfig struct {
	Provider             string
	ModelID              string
	Endpoint             string
	SingleTaskLimit      float64
	DailyLimit           float64
	BudgetAutoDowngrade  bool
	MaxToolIterations    int
	PlannerRetryBudget   int
	ToolRetryBudget      int
	ContextCompressChars int
	ContextKeepRecent    int
}

// RPCConfig describes the stable local transport endpoints.
type RPCConfig struct {
	Transport        string
	NamedPipeName    string
	DebugHTTPAddress string
}

// LoadOptions captures runtime path overrides provided by the desktop shell.
type LoadOptions struct {
	DataDir string
	SeedDir string
}

// Config describes the runtime configuration consumed by bootstrap.
type Config struct {
	RPC           RPCConfig
	DataDir       string
	SeedDir       string
	WorkspaceRoot string
	DatabasePath  string
	Model         ModelConfig
}

// Load resolves runtime paths and returns the full local service configuration.
func Load(options LoadOptions) Config {
	dataDir := resolveDataDir(options.DataDir)
	seedDir := resolveOptionalPath(options.SeedDir)
	workspaceRoot := filepath.Join(dataDir, "workspace")
	databasePath := filepath.Join(dataDir, "data", "cialloclaw.db")

	return Config{
		RPC: RPCConfig{
			Transport:        "named_pipe",
			NamedPipeName:    `\\.\pipe\cialloclaw-rpc`,
			DebugHTTPAddress: ":4317",
		},
		DataDir:       dataDir,
		SeedDir:       seedDir,
		WorkspaceRoot: workspaceRoot,
		DatabasePath:  databasePath,
		Model: ModelConfig{
			Provider:             "openai_responses",
			ModelID:              "gpt-5.4",
			Endpoint:             "https://api.openai.com/v1/responses",
			SingleTaskLimit:      10.0,
			DailyLimit:           50.0,
			BudgetAutoDowngrade:  true,
			MaxToolIterations:    4,
			PlannerRetryBudget:   1,
			ToolRetryBudget:      1,
			ContextCompressChars: 2400,
			ContextKeepRecent:    4,
		},
	}
}

func resolveDataDir(raw string) string {
	if resolved := resolveOptionalPath(raw); resolved != "" {
		return resolved
	}

	if userConfigDir, err := os.UserConfigDir(); err == nil && strings.TrimSpace(userConfigDir) != "" {
		return filepath.Clean(filepath.Join(userConfigDir, "CialloClaw"))
	}

	return filepath.Clean(filepath.Join(os.TempDir(), "CialloClaw"))
}

func resolveOptionalPath(raw string) string {
	trimmed := strings.TrimSpace(raw)
	if trimmed == "" {
		return ""
	}
	return filepath.Clean(trimmed)
}

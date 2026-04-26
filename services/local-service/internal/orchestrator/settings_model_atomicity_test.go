package orchestrator

import (
	"context"
	"errors"
	"reflect"
	"strings"
	"testing"
	"time"

	"github.com/cialloclaw/cialloclaw/services/local-service/internal/model"
	"github.com/cialloclaw/cialloclaw/services/local-service/internal/storage"
)

func TestSettingsUpdateDoesNotPersistModelSettingsWhenReloadFails(t *testing.T) {
	service, _ := newTestServiceWithExecution(t, "settings atomicity")
	if service.storage == nil {
		t.Fatal("expected storage service to be wired")
	}
	before := service.runEngine.Settings()
	beforeRuntime := service.currentModel().RuntimeConfig()
	beforeModels := modelSettingsSection(before)

	err := service.persistModelSecret("openai", "existing-secret")
	if err != nil {
		t.Fatalf("seed secret failed: %v", err)
	}

	_, err = service.SettingsUpdate(map[string]any{
		"models": map[string]any{
			"provider": "openai",
			"base_url": "http://%zz",
			"model":    "gpt-4.1-mini",
			"api_key":  "new-secret",
		},
	})
	if err == nil || !strings.Contains(err.Error(), "parse openai responses endpoint") {
		t.Fatalf("expected invalid endpoint reload failure, got %v", err)
	}
	after := service.runEngine.Settings()
	if !reflect.DeepEqual(after, before) {
		t.Fatalf("expected settings snapshot to remain unchanged after failed reload, before=%+v after=%+v", before, after)
	}
	afterModels := modelSettingsSection(after)
	if !reflect.DeepEqual(afterModels, beforeModels) {
		t.Fatalf("expected model settings to remain unchanged, before=%+v after=%+v", beforeModels, afterModels)
	}
	stored, err := service.storage.SecretStore().GetSecret(context.Background(), "model", model.OpenAIResponsesProvider+"_api_key")
	if err != nil {
		t.Fatalf("expected original secret to be restored, got %v", err)
	}
	if stored.Value != "existing-secret" {
		t.Fatalf("expected secret rollback after failed reload, got %+v", stored)
	}
	if service.currentModel() == nil || service.currentModel().RuntimeConfig() != beforeRuntime {
		t.Fatalf("expected runtime model to remain unchanged after failed reload, got %+v", service.currentModel())
	}
}

func TestSettingsUpdateRollsBackModelSwapWhenSettingsPersistenceFails(t *testing.T) {
	service, _ := newTestServiceWithExecution(t, "settings persistence failure")
	if service.storage == nil {
		t.Fatal("expected storage service to be wired")
	}
	previousModel := service.currentModel()
	if previousModel == nil {
		t.Fatal("expected runtime model to be wired")
	}
	if err := service.runEngine.WithSettingsStore(failingSettingsStore{}); err != nil {
		t.Fatalf("wire failing settings store: %v", err)
	}

	_, err := service.SettingsUpdate(map[string]any{
		"models": map[string]any{
			"provider": "anthropic",
			"base_url": "https://example.invalid/v1/messages",
			"model":    "claude-3-7-sonnet",
		},
	})
	if err == nil || err.Error() != "settings snapshot write failed" {
		t.Fatalf("expected settings store failure, got %v", err)
	}
	if service.currentModel() != previousModel {
		t.Fatalf("expected runtime model swap to roll back on persistence failure, got %+v want %+v", service.currentModel(), previousModel)
	}
}

type failingSettingsStore struct{}

func (failingSettingsStore) SaveSettingsSnapshot(context.Context, map[string]any) error {
	return errors.New("settings snapshot write failed")
}

func (failingSettingsStore) LoadSettingsSnapshot(context.Context) (map[string]any, error) {
	return nil, nil
}

func TestRollbackModelSecretMutationsRestoresPreviousState(t *testing.T) {
	service, _ := newTestServiceWithExecution(t, "secret rollback")
	if service.storage == nil {
		t.Fatal("expected storage service to be wired")
	}
	rollback := modelSecretRollback{
		provider: model.OpenAIResponsesProvider,
		record: storage.SecretRecord{
			Namespace: "model",
			Key:       model.OpenAIResponsesProvider + "_api_key",
			Value:     "old-secret",
			UpdatedAt: time.Now().UTC().Format(time.RFC3339),
		},
		existed: true,
	}
	if err := service.persistModelSecret("openai", "new-secret"); err != nil {
		t.Fatalf("seed secret mutation failed: %v", err)
	}
	service.rollbackModelSecretMutations([]modelSecretRollback{rollback})
	stored, err := service.storage.SecretStore().GetSecret(context.Background(), "model", model.OpenAIResponsesProvider+"_api_key")
	if err != nil {
		t.Fatalf("expected restored secret, got %v", err)
	}
	if stored.Value != "old-secret" {
		t.Fatalf("expected previous secret to be restored, got %+v", stored)
	}
}

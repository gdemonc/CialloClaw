package storage

import (
	"context"
	"testing"
)

func TestServiceCurrentExecutionAssetsAndPluginResolution(t *testing.T) {
	service := NewService(nil)
	if err := service.EnsureBuiltinExecutionAssets(context.Background()); err != nil {
		t.Fatalf("ensure builtin execution assets: %v", err)
	}
	if err := service.PluginManifestStore().WritePluginManifest(context.Background(), PluginManifestRecord{
		PluginID:         "ocr",
		Name:             "OCR Worker",
		Version:          "builtin-v1",
		Entry:            "builtin://plugin/ocr",
		Source:           "builtin",
		Summary:          "OCR runtime manifest",
		CapabilitiesJSON: `["ocr_image","ocr_pdf"]`,
		PermissionsJSON:  `["artifact_read"]`,
		RuntimeNamesJSON: `["ocr_worker"]`,
	}); err != nil {
		t.Fatalf("write plugin manifest: %v", err)
	}

	refs, err := service.CurrentExecutionAssets(context.Background())
	if err != nil {
		t.Fatalf("current execution assets: %v", err)
	}
	if len(refs) != 3 {
		t.Fatalf("expected built-in skill/blueprint/prompt refs, got %+v", refs)
	}

	pluginRefs, err := service.PluginAssetsForCapabilities(context.Background(), []string{"ocr_image"})
	if err != nil {
		t.Fatalf("plugin assets for capabilities: %v", err)
	}
	if len(pluginRefs) != 1 || pluginRefs[0].AssetKind != ExtensionAssetKindPluginManifest || pluginRefs[0].AssetID != "ocr" {
		t.Fatalf("expected OCR plugin manifest ref, got %+v", pluginRefs)
	}
}

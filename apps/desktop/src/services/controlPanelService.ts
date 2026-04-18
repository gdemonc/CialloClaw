import type {
  AgentSecuritySummaryGetResult,
  AgentTaskInspectorConfigGetResult,
  AgentTaskInspectorRunResult,
  ApplyMode,
  RequestMeta,
  SettingsSnapshot,
} from "@cialloclaw/protocol";
import {
  getSecuritySummary,
  getSettings,
  getTaskInspectorConfig,
  runTaskInspector,
  updateSettings,
  updateTaskInspectorConfig,
} from "@/rpc/methods";
import { loadSettings, saveSettings, type DesktopSettings } from "@/services/settingsService";

export type ControlPanelSource = "rpc" | "local";

export type ControlPanelData = {
  settings: SettingsSnapshot["settings"];
  inspector: AgentTaskInspectorConfigGetResult;
  securitySummary: AgentSecuritySummaryGetResult["summary"];
  providerApiKeyInput: string;
  source: ControlPanelSource;
};

export type ControlPanelSaveResult = {
  applyMode: ApplyMode;
  needRestart: boolean;
  updatedKeys: string[];
  effectiveSettings: Partial<SettingsSnapshot["settings"]>;
  effectiveInspector: AgentTaskInspectorConfigGetResult;
  source: ControlPanelSource;
};

function projectInspectorToTaskAutomation(
  settings: SettingsSnapshot["settings"],
  inspector: AgentTaskInspectorConfigGetResult,
): SettingsSnapshot["settings"] {
  return {
    ...settings,
    task_automation: {
      ...settings.task_automation,
      task_sources: inspector.task_sources,
      inspection_interval: inspector.inspection_interval,
      inspect_on_file_change: inspector.inspect_on_file_change,
      inspect_on_startup: inspector.inspect_on_startup,
      remind_before_deadline: inspector.remind_before_deadline,
      remind_when_stale: inspector.remind_when_stale,
    },
  };
}

function normalizeSettingsSnapshot(settings: SettingsSnapshot["settings"]): SettingsSnapshot["settings"] {
  return {
    ...settings,
    data_log: {
      ...settings.data_log,
      provider_api_key_configured: settings.data_log.provider_api_key_configured ?? false,
    },
  };
}

function buildSettingsWithProviderApiKeyConfigured(
  settings: SettingsSnapshot["settings"],
  providerApiKeyConfigured: boolean,
): SettingsSnapshot["settings"] {
  return {
    ...settings,
    data_log: {
      ...settings.data_log,
      provider_api_key_configured: providerApiKeyConfigured,
    },
  };
}

function buildDataLogUpdatePayload(input: ControlPanelData) {
  const apiKey = input.providerApiKeyInput.trim();

  return {
    provider: input.settings.data_log.provider,
    budget_auto_downgrade: input.settings.data_log.budget_auto_downgrade,
    ...(apiKey === "" ? {} : { api_key: apiKey }),
  };
}

function createRequestMeta(): RequestMeta {
  return {
    trace_id: `trace_control_panel_${Date.now()}`,
    client_time: new Date().toISOString(),
  };
}

function buildLocalSecuritySummary(settings: DesktopSettings): AgentSecuritySummaryGetResult["summary"] {
  return {
    security_status: "normal",
    pending_authorizations: 0,
    latest_restore_point: null,
    token_cost_summary: {
      current_task_tokens: 0,
      current_task_cost: 0,
      today_tokens: 0,
      today_cost: 0,
      single_task_limit: 0,
      daily_limit: 0,
      budget_auto_downgrade: settings.settings.data_log.budget_auto_downgrade,
    },
  };
}

function buildLocalInspector(settings: DesktopSettings): AgentTaskInspectorConfigGetResult {
  return {
    task_sources: settings.settings.task_automation.task_sources,
    inspection_interval: settings.settings.task_automation.inspection_interval,
    inspect_on_file_change: settings.settings.task_automation.inspect_on_file_change,
    inspect_on_startup: settings.settings.task_automation.inspect_on_startup,
    remind_before_deadline: settings.settings.task_automation.remind_before_deadline,
    remind_when_stale: settings.settings.task_automation.remind_when_stale,
  };
}

function getInitialControlPanelData(): ControlPanelData {
  const settings = loadSettings();
  const inspector = buildLocalInspector(settings);
  const normalizedSettings = normalizeSettingsSnapshot(projectInspectorToTaskAutomation(settings.settings, inspector));
  return {
    settings: normalizedSettings,
    inspector,
    providerApiKeyInput: "",
    securitySummary: buildLocalSecuritySummary(settings),
    source: "local",
  };
}

export async function loadControlPanelData(): Promise<ControlPanelData> {
  try {
    const requestMeta = createRequestMeta();
    const [settingsResult, inspectorResult, securityResult] = await Promise.all([
      getSettings({ request_meta: requestMeta, scope: "all" }),
      getTaskInspectorConfig({ request_meta: createRequestMeta() }),
      getSecuritySummary({ request_meta: createRequestMeta() }),
    ]);

    return {
      settings: normalizeSettingsSnapshot(projectInspectorToTaskAutomation(settingsResult.settings, inspectorResult)),
      inspector: inspectorResult,
      providerApiKeyInput: "",
      securitySummary: securityResult.summary,
      source: "rpc",
    };
  } catch (error) {
    console.warn("Control panel RPC unavailable, using local settings fallback.", error);
    return getInitialControlPanelData();
  }
}

export async function saveControlPanelData(data: ControlPanelData): Promise<ControlPanelSaveResult> {
  if (data.source === "local") {
    const nextSettingsSnapshot = buildSettingsWithProviderApiKeyConfigured(
      projectInspectorToTaskAutomation(data.settings, data.inspector),
      data.settings.data_log.provider_api_key_configured,
    );
    const nextDesktopSettings: DesktopSettings = {
      settings: nextSettingsSnapshot,
    };
    saveSettings(nextDesktopSettings);
    return {
      applyMode: "immediate",
      needRestart: false,
      updatedKeys: ["general", "floating_ball", "memory", "task_automation", "data_log"],
      effectiveSettings: nextDesktopSettings.settings,
      effectiveInspector: data.inspector,
      source: "local",
    };
  }

  try {
    const [settingsResult, inspectorResult] = await Promise.all([
      updateSettings({
        request_meta: createRequestMeta(),
        general: data.settings.general,
        floating_ball: data.settings.floating_ball,
        memory: data.settings.memory,
        data_log: buildDataLogUpdatePayload(data),
      }),
      updateTaskInspectorConfig({
        request_meta: createRequestMeta(),
        task_sources: data.inspector.task_sources,
        inspection_interval: data.inspector.inspection_interval,
        inspect_on_file_change: data.inspector.inspect_on_file_change,
        inspect_on_startup: data.inspector.inspect_on_startup,
        remind_before_deadline: data.inspector.remind_before_deadline,
        remind_when_stale: data.inspector.remind_when_stale,
      }),
    ]);

    const effectiveSettings = normalizeSettingsSnapshot(
      projectInspectorToTaskAutomation(
        settingsResult.effective_settings as SettingsSnapshot["settings"],
        inspectorResult.effective_config,
      ),
    );

    return {
      applyMode: settingsResult.apply_mode,
      needRestart: settingsResult.need_restart,
      updatedKeys: settingsResult.updated_keys,
      effectiveSettings,
      effectiveInspector: inspectorResult.effective_config,
      source: "rpc",
    };
  } catch (error) {
    console.warn("control panel save failed, keeping local snapshot only.", error);
    const nextSettingsSnapshot = buildSettingsWithProviderApiKeyConfigured(
      projectInspectorToTaskAutomation(data.settings, data.inspector),
      data.settings.data_log.provider_api_key_configured,
    );
    const nextDesktopSettings: DesktopSettings = {
      settings: nextSettingsSnapshot,
    };
    saveSettings(nextDesktopSettings);
    return {
      applyMode: "immediate",
      needRestart: false,
      updatedKeys: ["general", "floating_ball", "memory", "task_automation", "data_log"],
      effectiveSettings: nextDesktopSettings.settings,
      effectiveInspector: data.inspector,
      source: "local",
    };
  }
}

export async function runControlPanelInspection(data: ControlPanelData): Promise<AgentTaskInspectorRunResult> {
  if (data.source === "local") {
    throw new Error("当前仅有本地设置快照，无法执行正式巡检。请先连接本地服务。");
  }

  try {
    return await runTaskInspector({
      request_meta: createRequestMeta(),
      reason: "control_panel_manual_run",
      target_sources: data.inspector.task_sources,
    });
  } catch (error) {
    throw error;
  }
}

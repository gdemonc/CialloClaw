import type { MirrorReference } from "@cialloclaw/protocol";
import { loadStoredValue, removeStoredValue, saveStoredValue } from "../../../platform/storage";
import type { MirrorProfileItemView } from "./mirrorViewModel";

export type MirrorProfileDraftMode = "edited" | "hidden" | "deleted";

export type MirrorProfileDraftRecord = {
  item_id: string;
  mode: MirrorProfileDraftMode;
  draft_value: string | null;
  updated_at: string;
};

export type MirrorMemoryDraftRecord = {
  memory_id: string;
  hidden: boolean;
  updated_at: string;
};

export type MirrorGovernanceDraftSnapshot = {
  version: 1;
  profile_drafts: Record<string, MirrorProfileDraftRecord>;
  memory_drafts: Record<string, MirrorMemoryDraftRecord>;
};

export type MirrorGovernedProfileItem = MirrorProfileItemView & {
  draft_mode: MirrorProfileDraftMode | null;
  display_value: string;
  original_value: string;
  draft_updated_at: string | null;
};

export type MirrorGovernedMemoryReference = MirrorReference & {
  hidden_locally: boolean;
  draft_updated_at: string | null;
};

const MIRROR_GOVERNANCE_DRAFT_STORAGE_KEY = "cialloclaw.mirror.governance.drafts";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function isMirrorProfileDraftMode(value: unknown): value is MirrorProfileDraftMode {
  return value === "edited" || value === "hidden" || value === "deleted";
}

function isMirrorProfileDraftRecord(value: unknown): value is MirrorProfileDraftRecord {
  return (
    isRecord(value) &&
    typeof value.item_id === "string" &&
    isMirrorProfileDraftMode(value.mode) &&
    (typeof value.draft_value === "string" || value.draft_value === null) &&
    typeof value.updated_at === "string"
  );
}

function isMirrorMemoryDraftRecord(value: unknown): value is MirrorMemoryDraftRecord {
  return (
    isRecord(value) &&
    typeof value.memory_id === "string" &&
    typeof value.hidden === "boolean" &&
    typeof value.updated_at === "string"
  );
}

export function getEmptyMirrorGovernanceDraftSnapshot(): MirrorGovernanceDraftSnapshot {
  return {
    version: 1,
    profile_drafts: {},
    memory_drafts: {},
  };
}

export function loadMirrorGovernanceDraftSnapshot() {
  try {
    const storedValue = loadStoredValue<unknown>(MIRROR_GOVERNANCE_DRAFT_STORAGE_KEY);

    if (!isRecord(storedValue) || storedValue.version !== 1) {
      return getEmptyMirrorGovernanceDraftSnapshot();
    }

    const profileDraftEntries = Object.entries(storedValue.profile_drafts ?? {}).filter((entry): entry is [string, MirrorProfileDraftRecord] =>
      isMirrorProfileDraftRecord(entry[1]),
    );
    const memoryDraftEntries = Object.entries(storedValue.memory_drafts ?? {}).filter((entry): entry is [string, MirrorMemoryDraftRecord] =>
      isMirrorMemoryDraftRecord(entry[1]),
    );

    return {
      version: 1,
      profile_drafts: Object.fromEntries(profileDraftEntries),
      memory_drafts: Object.fromEntries(memoryDraftEntries),
    } satisfies MirrorGovernanceDraftSnapshot;
  } catch {
    return getEmptyMirrorGovernanceDraftSnapshot();
  }
}

export function saveMirrorGovernanceDraftSnapshot(snapshot: MirrorGovernanceDraftSnapshot) {
  if (!Object.keys(snapshot.profile_drafts).length && !Object.keys(snapshot.memory_drafts).length) {
    removeStoredValue(MIRROR_GOVERNANCE_DRAFT_STORAGE_KEY);
    return;
  }

  saveStoredValue(MIRROR_GOVERNANCE_DRAFT_STORAGE_KEY, snapshot);
}

export function upsertMirrorProfileDraft(
  snapshot: MirrorGovernanceDraftSnapshot,
  itemId: string,
  mode: MirrorProfileDraftMode,
  draftValue: string | null = null,
) {
  return {
    ...snapshot,
    profile_drafts: {
      ...snapshot.profile_drafts,
      [itemId]: {
        item_id: itemId,
        mode,
        draft_value: draftValue,
        updated_at: new Date().toISOString(),
      },
    },
  } satisfies MirrorGovernanceDraftSnapshot;
}

export function clearMirrorProfileDraft(snapshot: MirrorGovernanceDraftSnapshot, itemId: string) {
  if (!snapshot.profile_drafts[itemId]) {
    return snapshot;
  }

  const nextProfileDrafts = { ...snapshot.profile_drafts };
  delete nextProfileDrafts[itemId];

  return {
    ...snapshot,
    profile_drafts: nextProfileDrafts,
  } satisfies MirrorGovernanceDraftSnapshot;
}

export function setMirrorMemoryHidden(snapshot: MirrorGovernanceDraftSnapshot, memoryId: string, hidden: boolean) {
  const nextMemoryDrafts = { ...snapshot.memory_drafts };

  if (!hidden) {
    delete nextMemoryDrafts[memoryId];
  } else {
    nextMemoryDrafts[memoryId] = {
      memory_id: memoryId,
      hidden: true,
      updated_at: new Date().toISOString(),
    };
  }

  return {
    ...snapshot,
    memory_drafts: nextMemoryDrafts,
  } satisfies MirrorGovernanceDraftSnapshot;
}

export function applyMirrorProfileDrafts(items: MirrorProfileItemView[], snapshot: MirrorGovernanceDraftSnapshot) {
  const governedItems = items.map((item) => {
    const draft = snapshot.profile_drafts[item.id] ?? null;
    const displayValue =
      draft?.mode === "edited" && typeof draft.draft_value === "string" && draft.draft_value.trim().length > 0
        ? draft.draft_value.trim()
        : item.value;

    return {
      ...item,
      draft_mode: draft?.mode ?? null,
      display_value: displayValue,
      original_value: item.value,
      draft_updated_at: draft?.updated_at ?? null,
    } satisfies MirrorGovernedProfileItem;
  });

  return {
    active_items: governedItems.filter((item) => item.draft_mode !== "hidden" && item.draft_mode !== "deleted"),
    drafted_items: governedItems.filter((item) => item.draft_mode !== null),
  };
}

export function applyMirrorMemoryDrafts(references: MirrorReference[], snapshot: MirrorGovernanceDraftSnapshot) {
  const governedReferences = references.map((reference) => {
    const draft = snapshot.memory_drafts[reference.memory_id] ?? null;

    return {
      ...reference,
      hidden_locally: draft?.hidden ?? false,
      draft_updated_at: draft?.updated_at ?? null,
    } satisfies MirrorGovernedMemoryReference;
  });

  return {
    visible_references: governedReferences.filter((reference) => !reference.hidden_locally),
    hidden_references: governedReferences.filter((reference) => reference.hidden_locally),
  };
}

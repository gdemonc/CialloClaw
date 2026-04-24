import { invoke } from "@tauri-apps/api/core";

export type DesktopSourceNoteDocument = {
  content: string;
  file_name: string;
  modified_at_ms: number | null;
  path: string;
  source_root: string;
  title: string;
};

export type DesktopSourceNoteSnapshot = {
  default_source_root: string | null;
  notes: DesktopSourceNoteDocument[];
  source_roots: string[];
};

/**
 * Reports whether the current renderer is attached to the desktop Tauri host.
 */
export function canUseDesktopSourceNotes() {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

/**
 * Loads markdown note files from the configured task-source directories.
 *
 * @param sources Configured task-source directories from the inspector settings.
 */
export async function loadDesktopSourceNotes(sources: string[]) {
  return invoke<DesktopSourceNoteSnapshot>("desktop_load_source_notes", { sources });
}

/**
 * Creates one markdown note under the first configured task-source directory.
 *
 * @param sources Configured task-source directories from the inspector settings.
 * @param content Markdown content to write into the new note file.
 */
export async function createDesktopSourceNote(sources: string[], content: string) {
  return invoke<DesktopSourceNoteDocument>("desktop_create_source_note", { content, sources });
}

/**
 * Saves markdown content back into an existing task-source note file.
 *
 * @param sources Configured task-source directories from the inspector settings.
 * @param path Existing markdown note file path.
 * @param content Latest markdown content from the note editor.
 */
export async function saveDesktopSourceNote(sources: string[], path: string, content: string) {
  return invoke<DesktopSourceNoteDocument>("desktop_save_source_note", { content, path, sources });
}

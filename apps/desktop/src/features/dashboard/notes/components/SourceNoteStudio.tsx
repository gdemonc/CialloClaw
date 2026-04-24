import { FilePlus2, FolderTree, RefreshCcw, Save, ScanSearch, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/utils/cn";
import type { SourceNoteDocument } from "../notePage.types";

type SourceNoteStudioProps = {
  activePath: string | null;
  availabilityMessage: string | null;
  draftContent: string;
  isCreating: boolean;
  isDirty: boolean;
  isInspecting: boolean;
  isLoading: boolean;
  isSaving: boolean;
  notes: SourceNoteDocument[];
  onChange: (value: string) => void;
  onClose?: () => void;
  onCreate: () => void;
  onInspect: () => void;
  onReload: () => void;
  onSave: () => void;
  onSelect: (path: string) => void;
  selectedNote: SourceNoteDocument | null;
  sourceRoots: string[];
  syncMessage: string | null;
};

function formatModifiedAt(value: number | null) {
  if (!value) {
    return "未记录修改时间";
  }

  return new Date(value).toLocaleString("zh-CN", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
  });
}

/**
 * Renders the markdown source-note editor used by the notes dashboard modal.
 *
 * @param props Source-note state, actions, and current selection.
 * @returns The source-note editor layout.
 */
export function SourceNoteStudio({
  activePath,
  availabilityMessage,
  draftContent,
  isCreating,
  isDirty,
  isInspecting,
  isLoading,
  isSaving,
  notes,
  onChange,
  onClose,
  onCreate,
  onInspect,
  onReload,
  onSave,
  onSelect,
  selectedNote,
  sourceRoots,
  syncMessage,
}: SourceNoteStudioProps) {
  const canEdit = availabilityMessage === null && sourceRoots.length > 0;
  const saveDisabled = !canEdit || isSaving || draftContent.trim() === "" || (!isDirty && !isCreating);
  const editorTitle = isCreating ? "新便签草稿" : selectedNote?.title ?? "选择左侧 markdown 便签";
  const editorMeta = isCreating
    ? (sourceRoots[0] ? `新文件将保存到 ${sourceRoots[0]}` : "请先配置任务来源目录")
    : selectedNote
      ? `${selectedNote.fileName} · ${formatModifiedAt(selectedNote.modifiedAtMs)}`
      : "当前还没有选中 markdown 便签";

  return (
    <section className="note-source-studio">
      <div className="note-source-studio__header">
        <div className="note-source-studio__heading">
          <p className="note-preview-page__eyebrow">Markdown Sources</p>
          <div className="note-source-studio__title-row">
            <FolderTree className="note-source-studio__title-icon" />
            <div>
              <h2>任务来源便签</h2>
              <p>在这里新建和编辑任务来源 markdown。保存后会立即触发一次巡检，让下方事项列表和源文件保持同步。</p>
            </div>
          </div>
        </div>

        <div className="note-source-studio__actions">
          <Button className="note-source-studio__button" disabled={!canEdit || isSaving} onClick={onCreate} type="button" variant="ghost">
            <FilePlus2 className="h-4 w-4" />
            新建便签
          </Button>
          <Button className="note-source-studio__button" disabled={!canEdit || isInspecting || isSaving} onClick={onInspect} type="button" variant="ghost">
            <ScanSearch className="h-4 w-4" />
            {isInspecting ? "巡检中..." : "立即巡检"}
          </Button>
          <Button className="note-source-studio__button" disabled={!canEdit || isLoading || isSaving} onClick={onReload} type="button" variant="ghost">
            <RefreshCcw className="h-4 w-4" />
            刷新源文件
          </Button>
          <Button className="note-source-studio__button note-source-studio__button--primary" disabled={saveDisabled} onClick={onSave} type="button">
            <Save className="h-4 w-4" />
            {isSaving ? "保存中..." : "保存 markdown"}
          </Button>
          {onClose ? (
            <Button className="note-source-studio__button" onClick={onClose} type="button" variant="ghost">
              <X className="h-4 w-4" />
              关闭
            </Button>
          ) : null}
        </div>
      </div>

      <div className="note-source-studio__status-bar">
        <span className="note-source-studio__status-copy">{availabilityMessage ?? syncMessage ?? `已连接 ${sourceRoots.length} 个任务来源目录`}</span>
        {isDirty ? <span className="note-source-studio__dirty-pill">未保存</span> : null}
      </div>

      <div className="note-source-studio__body">
        <aside className="note-source-studio__list">
          <div className="note-source-studio__list-header">
            <strong>源文件</strong>
            <span>{notes.length}</span>
          </div>

          {notes.length > 0 ? (
            <div className="note-source-studio__list-items">
              {notes.map((note) => (
                <button
                  key={note.path}
                  className={cn("note-source-studio__list-item", note.path === activePath && "is-active")}
                  disabled={!canEdit}
                  onClick={() => onSelect(note.path)}
                  type="button"
                >
                  <div className="note-source-studio__list-item-copy">
                    <strong>{note.title}</strong>
                    <span>{note.fileName}</span>
                    <span>{formatModifiedAt(note.modifiedAtMs)}</span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="note-source-studio__empty">
              {canEdit
                ? (isLoading ? "正在扫描 markdown 源文件..." : "当前任务来源目录下还没有 markdown 便签。")
                : "当前环境还不能编辑任务来源 markdown。"}
            </div>
          )}
        </aside>

        <div className="note-source-studio__editor">
          <div className="note-source-studio__editor-head">
            <div>
              <strong>{editorTitle}</strong>
              <p>{editorMeta}</p>
            </div>
          </div>

          <Textarea
            className="note-source-studio__textarea"
            disabled={!canEdit}
            onChange={(event) => onChange(event.target.value)}
            placeholder={"# 新便签\n\n- [ ] 在这里写第一条待办\n"}
            value={draftContent}
          />
        </div>
      </div>
    </section>
  );
}

import type { ShellBallVoicePreview } from "./shellBall.interaction";
import type { ShellBallInputBarMode } from "./shellBall.types";
import { ShellBallInputBar } from "./components/ShellBallInputBar";

type ShellBallInputWindowProps = {
  mode: ShellBallInputBarMode;
  voicePreview: ShellBallVoicePreview;
  value: string;
  onValueChange: (value: string) => void;
  onAttachFile: () => void;
  onSubmit: () => void;
  onFocusChange: (focused: boolean) => void;
};

export function ShellBallInputWindow({
  mode,
  voicePreview,
  value,
  onValueChange,
  onAttachFile,
  onSubmit,
  onFocusChange,
}: ShellBallInputWindowProps) {
  return (
    <div className="shell-ball-window shell-ball-window--input" aria-label="Shell-ball input window">
      <ShellBallInputBar
        mode={mode}
        voicePreview={voicePreview}
        value={value}
        onValueChange={onValueChange}
        onAttachFile={onAttachFile}
        onSubmit={onSubmit}
        onFocusChange={onFocusChange}
      />
    </div>
  );
}

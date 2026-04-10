import { ShellBallDevLayer } from "./ShellBallDevLayer";
import { shouldShowShellBallDemoSwitcher } from "./shellBall.dev";
import { ShellBallSurface } from "./ShellBallSurface";
import { useShellBallInteraction } from "./useShellBallInteraction";
import { getShellBallMotionConfig } from "./shellBall.motion";

type ShellBallAppProps = {
  isDev?: boolean;
};

export function ShellBallApp({ isDev = false }: ShellBallAppProps) {
  const {
    visualState,
    voicePreview,
    handlePrimaryClick,
    handleRegionEnter,
    handleRegionLeave,
    handlePressStart,
    handlePressMove,
    handlePressEnd,
    handleForceState,
  } = useShellBallInteraction();
  const motionConfig = getShellBallMotionConfig(visualState);
  const showDemoSwitcher = shouldShowShellBallDemoSwitcher(isDev);

  return (
    <ShellBallSurface
      visualState={visualState}
      voicePreview={voicePreview}
      motionConfig={motionConfig}
      onPrimaryClick={handlePrimaryClick}
      onRegionEnter={handleRegionEnter}
      onRegionLeave={handleRegionLeave}
      onPressStart={handlePressStart}
      onPressMove={handlePressMove}
      onPressEnd={handlePressEnd}
    >
      {showDemoSwitcher ? (
        <ShellBallDevLayer value={visualState} onChange={handleForceState} />
      ) : null}
    </ShellBallSurface>
  );
}

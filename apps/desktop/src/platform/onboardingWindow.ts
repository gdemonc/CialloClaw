import { invoke } from "@tauri-apps/api/core";

export type OnboardingInteractiveRect = {
  height: number;
  width: number;
  x: number;
  y: number;
};

/**
 * Updates the native hit-test map for the onboarding overlay window so only the
 * visible guide card consumes pointer input and the rest of the overlay stays
 * click-through.
 *
 * @param regions Interactive rectangles relative to the onboarding window.
 */
export async function setOnboardingInteractiveRegions(regions: OnboardingInteractiveRect[]) {
  await invoke("onboarding_set_interactive_regions", {
    regions,
  });
}

/**
 * Clears native onboarding hit-testing state before the dedicated overlay
 * window is destroyed so replay sessions always boot from a clean cursor map.
 */
export async function resetOnboardingNativeTracking() {
  await invoke("onboarding_reset_native_tracking");
}

import ReactDOM from "react-dom/client";
import { AppProviders } from "@/features/shared/AppProviders";
import { ShellBallOnboardingWindowApp } from "@/features/onboarding/ShellBallOnboardingWindowApp";

const rootElement = document.getElementById("root")!;

document.documentElement.dataset.appWindow = "shell-ball-onboarding";
document.body.dataset.appWindow = "shell-ball-onboarding";
rootElement.dataset.appWindow = "shell-ball-onboarding";

ReactDOM.createRoot(rootElement).render(
  <AppProviders>
    <ShellBallOnboardingWindowApp />
  </AppProviders>,
);

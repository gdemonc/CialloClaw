import { Theme } from "@radix-ui/themes";
import "@radix-ui/themes/styles.css";
import ReactDOM from "react-dom/client";
import { OnboardingWindow } from "@/features/onboarding/OnboardingWindow";
import { AppProviders } from "@/features/shared/AppProviders";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <Theme appearance="light" panelBackground="solid" accentColor="orange" grayColor="sand" radius="large">
    <AppProviders>
      <OnboardingWindow />
    </AppProviders>
  </Theme>,
);

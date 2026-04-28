import type { NavigateFunction } from "react-router-dom";
import { resolveDashboardRoutePath } from "./dashboardRouteTargets";

export type DashboardResultPageRouteState = {
  taskId: string | null;
  title: string | null;
  url: string;
};

type DashboardResultPageLocationInput = {
  search: string;
  state: unknown;
};

function readDashboardResultPageSearch(search: string): DashboardResultPageRouteState | null {
  const params = new URLSearchParams(search);
  const url = (params.get("url") ?? "").trim();
  const taskId = (params.get("task_id") ?? "").trim() || null;
  const title = (params.get("title") ?? "").trim() || null;

  if (!url) {
    return null;
  }

  return {
    taskId,
    title,
    url,
  };
}

function buildDashboardResultPageSearch(input: DashboardResultPageRouteState) {
  const params = new URLSearchParams();
  params.set("url", input.url);

  if (input.taskId) {
    params.set("task_id", input.taskId);
  }

  if (input.title?.trim()) {
    params.set("title", input.title.trim());
  }

  return params.toString();
}

/**
 * Builds the router state used by dashboard result-page views so task- and
 * note-driven result openings can converge on one renderer entry.
 *
 * @param input Result page location and optional task metadata.
 * @returns Router state understood by the dashboard result-page route.
 */
export function buildDashboardResultPageRouteState(input: DashboardResultPageRouteState): DashboardResultPageRouteState {
  return {
    taskId: input.taskId,
    title: input.title,
    url: input.url,
  };
}

/**
 * Reads dashboard result-page router state from an unknown location payload so
 * unrelated route state does not accidentally drive the result-page view.
 *
 * @param value Unknown router state supplied by another dashboard module.
 * @returns Normalized result-page state or null when the payload does not match.
 */
export function readDashboardResultPageRouteState(value: unknown): DashboardResultPageRouteState | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const url = typeof (value as { url?: unknown }).url === "string"
    ? (value as { url: string }).url.trim()
    : "";
  const taskId = typeof (value as { taskId?: unknown }).taskId === "string"
    ? (value as { taskId: string }).taskId
    : null;
  const title = typeof (value as { title?: unknown }).title === "string"
    ? (value as { title: string }).title
    : null;

  if (!url) {
    return null;
  }

  return {
    taskId,
    title,
    url,
  };
}

/**
 * Resolves dashboard result-page input from both router search params and route
 * state so refreshes keep the formal delivery address recoverable.
 *
 * @param input The current location search string and route state payload.
 * @returns The recoverable result-page route payload or null when missing.
 */
export function readDashboardResultPageLocation(input: DashboardResultPageLocationInput): DashboardResultPageRouteState | null {
  const searchState = readDashboardResultPageSearch(input.search);
  const routedState = readDashboardResultPageRouteState(input.state);

  if (!searchState) {
    return routedState;
  }

  return {
    taskId: searchState.taskId ?? routedState?.taskId ?? null,
    title: searchState.title ?? routedState?.title ?? null,
    url: searchState.url,
  };
}

/**
 * Navigates inside the dashboard to the dedicated result-page shell while
 * preserving the originating task context when available.
 *
 * @param navigate React Router navigate function from the current dashboard view.
 * @param input Result page location and optional task metadata.
 */
export function navigateToDashboardResultPage(
  navigate: NavigateFunction,
  input: DashboardResultPageRouteState,
) {
  const search = buildDashboardResultPageSearch(input);
  navigate(`${resolveDashboardRoutePath("result")}?${search}`, {
    state: buildDashboardResultPageRouteState(input),
  });
}

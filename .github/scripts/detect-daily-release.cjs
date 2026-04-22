/**
 * Resolves whether the main branch moved during the configured release window.
 *
 * @param {{
 *   core: import("@actions/core"),
 *   context: import("@actions/github").context,
 *   github: import("@actions/github").GitHub
 * }} input
 */
module.exports = async function detectDailyRelease({ core, context, github }) {
  const owner = context.repo.owner;
  const repo = context.repo.repo;
  const startUtc = process.env.START_UTC;
  const endUtc = process.env.END_UTC;

  if (!startUtc || !endUtc) {
    core.setFailed("Daily release detection requires both START_UTC and END_UTC.");
    return;
  }

  const startEpoch = Date.parse(startUtc);
  const endEpoch = Date.parse(endUtc);
  if (Number.isNaN(startEpoch) || Number.isNaN(endEpoch) || startEpoch >= endEpoch) {
    core.setFailed(`Invalid release window boundaries: ${startUtc} -> ${endUtc}`);
    return;
  }

  /**
   * Returns the latest main-branch commit that existed at or before the cutoff.
   *
   * @param {string} cutoffUtc
   */
  const listLatestCommitAtOrBefore = async (cutoffUtc) => {
    const { data } = await github.rest.repos.listCommits({
      owner,
      repo,
      sha: "main",
      until: cutoffUtc,
      per_page: 1,
    });

    return data[0] ?? null;
  };

  const startSnapshot = await listLatestCommitAtOrBefore(startUtc);
  const endSnapshot = await listLatestCommitAtOrBefore(endUtc);

  if (!endSnapshot) {
    core.setFailed(`No main branch commit was found at or before ${endUtc}.`);
    return;
  }

  const releaseSha = endSnapshot.sha;
  let commitCount = 0;
  let compareUrl = "";

  if (!startSnapshot) {
    const historyUntilEnd = await github.paginate(github.rest.repos.listCommits, {
      owner,
      repo,
      sha: "main",
      until: endUtc,
      per_page: 100,
    });

    commitCount = historyUntilEnd.length;
    compareUrl = `${context.serverUrl}/${owner}/${repo}/commits/${releaseSha}`;
  } else if (startSnapshot.sha !== endSnapshot.sha) {
    const compare = await github.rest.repos.compareCommitsWithBasehead({
      owner,
      repo,
      basehead: `${startSnapshot.sha}...${endSnapshot.sha}`,
    });

    commitCount = compare.data.ahead_by;
    compareUrl = compare.data.html_url;
  }

  const shouldRelease = commitCount > 0;

  core.info(`Release window: ${startUtc} -> ${endUtc}`);
  core.info(`Window start snapshot: ${startSnapshot?.sha ?? "none"}`);
  core.info(`Window end snapshot: ${endSnapshot.sha}`);
  core.info(`Commits on main introduced in the release window: ${commitCount}`);
  core.info(`Release candidate SHA: ${releaseSha}`);

  core.setOutput("commit_count", String(commitCount));
  core.setOutput("compare_url", compareUrl);
  core.setOutput("release_sha", releaseSha);
  core.setOutput("should_release", shouldRelease ? "true" : "false");
};

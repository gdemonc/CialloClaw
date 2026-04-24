/* global process, console */
import { spawnSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const currentDirectory = dirname(fileURLToPath(import.meta.url));

function run(command, args, options) {
  const result = spawnSync(command, args, {
    stdio: "pipe",
    encoding: "utf8",
    ...options,
  });

  if (result.status === 0) {
    return result;
  }

  const stderr = result.stderr?.trim();
  const stdout = result.stdout?.trim();
  const details = stderr || stdout || `exit code ${result.status ?? "unknown"}`;
  throw new Error(`${command} ${args.join(" ")} failed: ${details}`);
}

function resolveRustTargetTriple(repoRoot) {
  const result = run("rustc", ["-vV"], { cwd: repoRoot });
  const hostLine = result.stdout
    .split(/\r?\n/)
    .find((line) => line.startsWith("host: "));

  if (!hostLine) {
    throw new Error("Failed to determine Rust target triple from `rustc -vV`.");
  }

  return hostLine.slice("host: ".length).trim();
}

export function buildLocalServiceSidecar() {
  const repoRoot = resolve(currentDirectory, "..", "..", "..", "..");
  const srcTauriRoot = resolve(currentDirectory, "..");
  const targetTriple = resolveRustTargetTriple(repoRoot);
  const sidecarDirectory = resolve(srcTauriRoot, "binaries");
  const sidecarFileName = `local-service-${targetTriple}${targetTriple.includes("windows") ? ".exe" : ""}`;
  const sidecarPath = resolve(sidecarDirectory, sidecarFileName);

  mkdirSync(sidecarDirectory, { recursive: true });
  run("go", ["build", "-trimpath", "-o", sidecarPath, "./services/local-service/cmd/server"], {
    cwd: repoRoot,
  });

  return sidecarPath;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const sidecarPath = buildLocalServiceSidecar();
  console.log(`Built local-service sidecar at ${sidecarPath}`);
}

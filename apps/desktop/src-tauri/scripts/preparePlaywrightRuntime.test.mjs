import assert from "node:assert/strict";
import { lstatSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import test from "node:test";
import { resolve } from "node:path";
import { tmpdir } from "node:os";

import { copyPackagedRuntimeTree } from "./preparePlaywrightRuntime.mjs";

test("copyPackagedRuntimeTree dereferences linked runtime files", async (t) => {
  const sourceRoot = mkdtempSync(resolve(tmpdir(), "prepare-playwright-runtime-source-"));
  const targetRoot = mkdtempSync(resolve(tmpdir(), "prepare-playwright-runtime-target-"));
  const sharedRoot = mkdtempSync(resolve(tmpdir(), "prepare-playwright-runtime-shared-"));
  const sharedFile = resolve(sharedRoot, "privacy-sandbox-attestations.dat");
  const linkedFile = resolve(sourceRoot, "chromium", "privacy-sandbox-attestations.dat");
  t.after(() => {
    rmSync(sourceRoot, { recursive: true, force: true });
    rmSync(targetRoot, { recursive: true, force: true });
    rmSync(sharedRoot, { recursive: true, force: true });
  });

  mkdirSync(resolve(sourceRoot, "chromium"), { recursive: true });
  mkdirSync(sharedRoot, { recursive: true });
  writeFileSync(sharedFile, "linked browser payload", "utf8");
  symlinkSync(sharedFile, linkedFile);

  copyPackagedRuntimeTree(sourceRoot, targetRoot);

  assert.equal(readFileSync(resolve(targetRoot, "chromium", "privacy-sandbox-attestations.dat"), "utf8"), "linked browser payload");
  assert.equal(lstatSync(resolve(targetRoot, "chromium", "privacy-sandbox-attestations.dat")).isSymbolicLink(), false);
});

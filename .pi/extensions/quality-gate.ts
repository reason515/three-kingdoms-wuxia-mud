import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { readFile } from "node:fs/promises";
import { join, relative } from "node:path";

/**
 * Project-local quality gate for the Three Kingdoms MUD monorepo.
 *
 * Usage:
 *   /verify                 infer scopes from git diff
 *   /verify combat           verify one scope
 *   /verify combat,content   verify several scopes
 *
 * The extension deliberately never commits, modifies source files, or bypasses
 * failed checks. It only orchestrates the commands specified in
 * docs/DEV_WORKFLOW.md.
 */

type Scope =
  | "combat"
  | "skill"
  | "idle"
  | "room"
  | "quest"
  | "faction"
  | "content"
  | "gateway"
  | "web"
  | "server"
  | "fix"
  | "chore"
  | "docs";

type CheckResult = {
  label: string;
  command: string;
  status: "passed" | "failed" | "skipped";
  detail?: string;
};

const VALID_SCOPES = new Set<Scope>([
  "combat", "skill", "idle", "room", "quest", "faction", "content",
  "gateway", "web", "server", "fix", "chore", "docs",
]);

const TARGETED_E2E_SCOPES = new Set<Scope>([
  "combat", "skill", "idle", "room", "quest", "faction", "content", "web",
]);

function parseExplicitScopes(args: string): Scope[] {
  if (!args.trim()) return [];
  const scopes = args
    .split(/[\s,]+/)
    .map((scope) => scope.trim().toLowerCase())
    .filter(Boolean);

  const invalid = scopes.filter((scope) => !VALID_SCOPES.has(scope as Scope));
  if (invalid.length > 0) {
    throw new Error(`Unknown scope: ${invalid.join(", ")}. Valid: ${[...VALID_SCOPES].join(", ")}`);
  }
  return [...new Set(scopes as Scope[])];
}

function scopesForFile(file: string): Scope[] {
  const normalized = file.replaceAll("\\", "/");
  const scopes: Scope[] = [];

  if (normalized.startsWith("packages/content/")) scopes.push("content");
  if (normalized.includes("/engine/combat")) scopes.push("combat");
  if (normalized.includes("/engine/skill") || normalized.includes("/engine/training")) scopes.push("skill");
  if (normalized.includes("/engine/idle")) scopes.push("idle");
  if (normalized.includes("/engine/room") || normalized.includes("/engine/map")) scopes.push("room");
  if (normalized.includes("/engine/quest") || normalized.includes("/dialogue")) scopes.push("quest");
  if (normalized.includes("/engine/faction")) scopes.push("faction");
  if (normalized.startsWith("packages/gateway/")) scopes.push("gateway");
  if (normalized.startsWith("packages/web/")) scopes.push("web");
  if (normalized.startsWith("packages/server/")) scopes.push("server");
  if (normalized.startsWith("docs/")) scopes.push("docs");
  if (normalized === "package.json" || normalized === "pnpm-lock.yaml" || normalized === "turbo.json") {
    scopes.push("chore");
  }

  return scopes;
}

async function readRootScripts(cwd: string): Promise<Set<string> | null> {
  try {
    const raw = await readFile(join(cwd, "package.json"), "utf8");
    const parsed = JSON.parse(raw) as { scripts?: Record<string, string> };
    return new Set(Object.keys(parsed.scripts ?? {}));
  } catch {
    return null;
  }
}

function tail(text: string | undefined, max = 1200): string | undefined {
  if (!text) return undefined;
  return text.length > max ? `…${text.slice(-max)}` : text;
}

export default function qualityGate(pi: ExtensionAPI) {
  async function changedFiles(cwd: string): Promise<string[]> {
    const commands = [
      ["diff", "--name-only", "HEAD"],
      ["diff", "--cached", "--name-only"],
    ];
    const files = new Set<string>();

    for (const args of commands) {
      const result = await pi.exec("git", args, { cwd, timeout: 5_000 });
      if (result.code !== 0) continue;
      for (const file of result.stdout.split(/\r?\n/)) {
        if (file.trim()) files.add(file.trim());
      }
    }
    return [...files].sort();
  }

  async function verify(rawScopes: string, cwd: string, signal?: AbortSignal): Promise<{
    scopes: Scope[];
    files: string[];
    results: CheckResult[];
    ready: boolean;
    passed: boolean;
  }> {
    const explicitScopes = parseExplicitScopes(rawScopes);
    const files = await changedFiles(cwd);
    const inferredScopes = files.flatMap(scopesForFile);
    const scopes = [...new Set<Scope>([...explicitScopes, ...inferredScopes])];
    const effectiveScopes = scopes.length > 0 ? scopes : ["chore" as Scope];
    const scripts = await readRootScripts(cwd);
    const results: CheckResult[] = [];

    if (!scripts) {
      results.push({
        label: "project scripts",
        command: "package.json",
        status: "skipped",
        detail: "No root package.json found. The quality gate is not ready until the planned pnpm monorepo exists.",
      });
      return { scopes: effectiveScopes, files, results, ready: false, passed: false };
    }

    async function runScript(label: string, script: string, args: string[] = []): Promise<boolean> {
      const command = `pnpm ${[script, ...args].join(" ")}`;
      if (!scripts.has(script)) {
        results.push({
          label,
          command,
          status: "skipped",
          detail: `Missing root script \"${script}\". Implement it before treating this gate as passing.`,
        });
        return false;
      }

      const result = await pi.exec("pnpm", [script, ...args], {
        cwd,
        signal,
        timeout: script.startsWith("test:e2e") ? 120_000 : 60_000,
      });
      const passed = result.code === 0;
      results.push({
        label,
        command,
        status: passed ? "passed" : "failed",
        detail: passed ? undefined : tail(result.stderr || result.stdout),
      });
      return passed;
    }

    // Documentation-only work does not require the runtime quality gate.
    if (effectiveScopes.every((scope) => scope === "docs")) {
      results.push({
        label: "documentation-only change",
        command: "no runtime checks",
        status: "passed",
        detail: "Run Markdown/link validation separately if configured.",
      });
      return { scopes: effectiveScopes, files, results, ready: true, passed: true };
    }

    const typecheck = await runScript("TypeScript", "typecheck");
    const lint = await runScript("Lint", "lint");
    const unit = await runScript("Unit / integration tests", "test");

    const needsContentValidation = effectiveScopes.includes("content") || files.some((file) => file.startsWith("packages/content/"));
    const validation = needsContentValidation
      ? await runScript("Content validation", "validate")
      : true;

    const e2eScopes = effectiveScopes.filter((scope) => TARGETED_E2E_SCOPES.has(scope));
    const targeted = await Promise.all(
      e2eScopes.map((scope) => runScript(`Targeted E2E (${scope})`, "test:e2e", ["--", scope])),
    );

    // Smoke is required for every code/configuration change, after targeted E2E.
    const smoke = await runScript("Smoke E2E", "test:e2e");
    const requiredChecksPresent = results.every((result) => result.status !== "skipped");
    const passed = typecheck && lint && unit && validation && targeted.every(Boolean) && smoke && requiredChecksPresent;

    return { scopes: effectiveScopes, files, results, ready: true, passed };
  }

  function formatReport(report: Awaited<ReturnType<typeof verify>>, cwd: string): string {
    const relativeFiles = report.files.map((file) => relative(cwd, join(cwd, file)) || file);
    const lines = [
      `Quality gate: ${report.passed ? "PASSED" : "NOT PASSED"}`,
      `Scopes: ${report.scopes.join(", ")}`,
      `Changed files: ${relativeFiles.length > 0 ? relativeFiles.join(", ") : "none detected"}`,
      "",
      ...report.results.map((result) => {
        const icon = result.status === "passed" ? "✓" : result.status === "failed" ? "✗" : "–";
        return `${icon} ${result.label}: ${result.command}${result.detail ? `\n  ${result.detail}` : ""}`;
      }),
    ];
    return lines.join("\n");
  }

  async function execute(rawScopes: string, cwd: string, signal?: AbortSignal): Promise<string> {
    const report = await verify(rawScopes, cwd, signal);
    const text = formatReport(report, cwd);
    return text;
  }

  pi.registerCommand("verify", {
    description: "Run targeted quality checks. Usage: /verify [combat,content,...]",
    handler: async (args, ctx) => {
      try {
        const text = await execute(args, ctx.cwd, ctx.signal);
        const passed = text.startsWith("Quality gate: PASSED");
        ctx.ui.notify(passed ? "Quality gate passed" : "Quality gate did not pass", passed ? "info" : "warning");
        pi.sendMessage({
          customType: "quality-gate",
          content: text,
          display: true,
          details: { scopes: args },
        });
      } catch (error) {
        ctx.ui.notify(`Quality gate error: ${error instanceof Error ? error.message : String(error)}`, "error");
      }
    },
  });

  pi.registerTool({
    name: "verify_quality_gate",
    label: "Verify Quality Gate",
    description: "Run the project quality gate for changed files or specified MUD scopes. It runs typecheck, lint, focused tests, relevant content validation, targeted E2E, and Smoke; it never commits or changes source files.",
    promptSnippet: "Run targeted quality checks for a MUD change",
    promptGuidelines: [
      "Use verify_quality_gate after implementing a code or content change and before reporting it complete.",
      "Use verify_quality_gate with scopes matching the changed MUD domain; do not run all E2E unless the user requests a milestone or release regression.",
    ],
    parameters: Type.Object({
      scopes: Type.Optional(Type.String({ description: "Comma-separated scopes, e.g. combat,content. Omit to infer from git diff." })),
    }),
    async execute(_toolCallId, params, signal, _onUpdate, ctx) {
      const text = await execute(params.scopes ?? "", ctx.cwd, signal);
      const passed = text.startsWith("Quality gate: PASSED");
      if (!passed) throw new Error(text);
      return {
        content: [{ type: "text", text }],
        details: { scopes: params.scopes ?? "inferred" },
      };
    },
  });
}

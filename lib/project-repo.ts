// Per-project git repository: each project is a git repo under
// .workspace/projects/{id}/repo/. Version = commit; rollback = checkout.
import { execFile } from "node:child_process";
import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

import type { FilePatch } from "@/types/multi-agent";

import { getProjectPath, pathExists } from "@/lib/storage";

const execFileAsync = promisify(execFile);

const SCAFFOLD_DIR = path.join(process.cwd(), "lib", "scaffold", "template");

function getRepoPath(projectId: string): string {
  return path.join(getProjectPath(projectId), "repo");
}

// Guard: every written path must stay inside repo/ and (for agent output) src/.
function resolveInRepo(repoPath: string, relPath: string): string {
  const resolved = path.resolve(repoPath, relPath);
  const rel = path.relative(repoPath, resolved);
  if (rel.startsWith("..") || path.isAbsolute(rel)) {
    throw new Error(`Path escapes repo: ${relPath}`);
  }
  return resolved;
}

async function git(repoPath: string, args: string[]): Promise<string> {
  const { stdout } = await execFileAsync("git", ["-C", repoPath, ...args], {
    maxBuffer: 32 * 1024 * 1024,
    env: { ...process.env, GIT_TERMINAL_PROMPT: "0" },
  });
  return stdout.trim();
}

export type CommitEntry = { hash: string; message: string; date: string };

export class ProjectRepo {
  private constructor(readonly projectId: string, readonly repoPath: string) {}

  static async open(projectId: string): Promise<ProjectRepo> {
    const repoPath = getRepoPath(projectId);
    return new ProjectRepo(projectId, repoPath);
  }

  async exists(): Promise<boolean> {
    return pathExists(path.join(this.repoPath, ".git"));
  }

  /** Create the repo from the fixed scaffold template and make the first commit. */
  async init(): Promise<CommitEntry> {
    await mkdir(this.repoPath, { recursive: true });
    await cp(SCAFFOLD_DIR, this.repoPath, { recursive: true });
    await git(this.repoPath, ["init", "-q"]);
    await git(this.repoPath, ["config", "user.email", "agent@designdraft.local"]);
    await git(this.repoPath, ["config", "user.name", "DesignDraft Agent"]);
    return this.commit("scaffold: initial project");
  }

  /** Apply generated/optimized patches to the working tree (no commit). */
  async applyPatches(patches: FilePatch[]): Promise<void> {
    for (const patch of patches) {
      const target = resolveInRepo(this.repoPath, patch.path);
      if (patch.op === "delete") {
        await rm(target, { force: true });
        continue;
      }
      await mkdir(path.dirname(target), { recursive: true });
      await writeFile(target, patch.content ?? "", "utf8");
    }
  }

  async readFile(relPath: string): Promise<string | null> {
    const target = resolveInRepo(this.repoPath, relPath);
    return readFile(target, "utf8").catch(() => null);
  }

  /** List all tracked + untracked files under src/ (for Sandpack + file index). */
  async listFiles(subdir = "src"): Promise<string[]> {
    const root = resolveInRepo(this.repoPath, subdir);
    const out: string[] = [];
    const walk = async (dir: string) => {
      const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
      for (const e of entries) {
        const full = path.join(dir, e.name);
        if (e.isDirectory()) await walk(full);
        else out.push(path.relative(this.repoPath, full));
      }
    };
    await walk(root);
    return out.sort();
  }

  async commit(message: string): Promise<CommitEntry> {
    await git(this.repoPath, ["add", "-A"]);
    // allow empty so callers don't crash on no-op commits
    await git(this.repoPath, ["commit", "-q", "--allow-empty", "-m", message]);
    const hash = await git(this.repoPath, ["rev-parse", "HEAD"]);
    const date = await git(this.repoPath, ["log", "-1", "--format=%cI"]);
    return { hash, message, date };
  }

  async log(limit = 50): Promise<CommitEntry[]> {
    const raw = await git(this.repoPath, [
      "log",
      `-${limit}`,
      "--format=%H%x1f%s%x1f%cI",
    ]);
    if (!raw) return [];
    return raw.split("\n").map((line) => {
      const [hash, message, date] = line.split("\x1f");
      return { hash, message, date };
    });
  }

  async checkout(hash: string): Promise<void> {
    await git(this.repoPath, ["checkout", "-q", hash, "--", "."]);
  }
}

import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createProject, createPrototype, createPrototypeVersion } from "@/lib/storage";
import { GET as getPrototypeRoute } from "./route";
import { GET as getVersionsRoute } from "./versions/route";
import { GET as getHtmlRoute } from "./versions/[versionId]/html/route";

let workspaceDir: string;

beforeEach(async () => {
  workspaceDir = await mkdtemp(join(tmpdir(), "designdraft-prototype-read-"));
  process.env.DESIGNDRAFT_WORKSPACE_DIR = workspaceDir;
});

afterEach(async () => {
  delete process.env.DESIGNDRAFT_WORKSPACE_DIR;
  await rm(workspaceDir, { recursive: true, force: true });
});

describe("prototype read routes", () => {
  it("returns prototype manifest, versions, and html", async () => {
    const project = await createProject({ name: "原型项目" });
    const created = await createPrototype(project.id, "a", "方案A", "<!doctype html><html><body>v1</body></html>");
    await createPrototypeVersion(project.id, created.prototype.id, "<!doctype html><html><body>v2</body></html>", "修改", "chat-optimization");

    const manifestResponse = await getPrototypeRoute(
      new Request(`http://localhost/api/prototypes/${created.prototype.id}?projectId=${project.id}`),
      { params: { prototypeId: created.prototype.id } },
    );
    expect(manifestResponse.status).toBe(200);
    await expect(manifestResponse.json()).resolves.toMatchObject({ prototype: { currentVersionId: "v2" } });

    const versionsResponse = await getVersionsRoute(
      new Request(`http://localhost/api/prototypes/${created.prototype.id}/versions?projectId=${project.id}`),
      { params: { prototypeId: created.prototype.id } },
    );
    expect(versionsResponse.status).toBe(200);
    const versionsBody = await versionsResponse.json();
    expect(versionsBody.versions).toHaveLength(2);

    const htmlResponse = await getHtmlRoute(
      new Request(`http://localhost/api/prototypes/${created.prototype.id}/versions/v2/html?projectId=${project.id}`),
      { params: { prototypeId: created.prototype.id, versionId: "v2" } },
    );
    expect(htmlResponse.status).toBe(200);
    await expect(htmlResponse.text()).resolves.toContain("v2");
    expect(htmlResponse.headers.get("Content-Type")).toContain("text/html");
    expect(htmlResponse.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(htmlResponse.headers.get("Content-Security-Policy")).toContain("default-src 'none'");
  });
});

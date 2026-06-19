import { NextResponse } from "next/server";

import { ProjectRepo } from "@/lib/project-repo";
import { getProject } from "@/lib/storage";

export const runtime = "nodejs";

// Return the project's src/ file tree as { path: content } for Sandpack.
export async function GET(request: Request) {
  const projectId = new URL(request.url).searchParams.get("projectId");
  if (!projectId) return NextResponse.json({ error: "缺少 projectId" }, { status: 400 });
  if (!(await getProject(projectId))) {
    return NextResponse.json({ error: "项目不存在" }, { status: 404 });
  }

  const repo = await ProjectRepo.open(projectId);
  if (!(await repo.exists())) {
    return NextResponse.json({ files: {}, ready: false });
  }

  const paths = await repo.listFiles("src");
  const entries = await Promise.all(
    paths.map(async (p) => [`/${p}`, (await repo.readFile(p)) ?? ""] as const),
  );
  // package.json deps so Sandpack can resolve react-router-dom etc.
  const pkg = await repo.readFile("package.json");

  return NextResponse.json({
    ready: true,
    files: Object.fromEntries(entries),
    packageJson: pkg,
  });
}

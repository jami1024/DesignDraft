import { NextResponse } from "next/server";

import { deleteProject, getProject } from "@/lib/storage";

type ProjectRouteContext = {
  params: {
    projectId: string;
  };
};

export const runtime = "nodejs";

export async function GET(_request: Request, context: ProjectRouteContext) {
  const project = await getProject(context.params.projectId);

  if (!project) {
    return NextResponse.json({ error: "项目不存在" }, { status: 404 });
  }

  return NextResponse.json({ project });
}

export async function DELETE(_request: Request, context: ProjectRouteContext) {
  const project = await getProject(context.params.projectId);

  if (!project) {
    return NextResponse.json({ error: "项目不存在" }, { status: 404 });
  }

  await deleteProject(context.params.projectId);

  return NextResponse.json({ ok: true });
}

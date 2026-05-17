import { NextResponse } from "next/server";

import { getProject, saveDesignMemory } from "@/lib/storage";
import type { DesignDirection, ProjectDesignMemory } from "@/types";

export const runtime = "nodejs";

type RequestBody = {
  direction?: DesignDirection;
};

export async function POST(
  request: Request,
  { params }: { params: { projectId: string } },
) {
  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "无效请求" }, { status: 400 });
  }

  const { projectId } = params;
  if (!body.direction) {
    return NextResponse.json({ error: "缺少设计方向" }, { status: 400 });
  }

  const project = await getProject(projectId);
  if (!project) {
    return NextResponse.json({ error: "项目不存在" }, { status: 404 });
  }

  const direction = body.direction;
  const memory: ProjectDesignMemory = {
    version: 1,
    palette: {
      colors: direction.palette,
      colorStrategy: direction.colorStrategy,
    },
    typography: {
      families: [direction.typography.display, direction.typography.body],
      display: direction.typography.display,
      body: direction.typography.body,
    },
    register: direction.register,
    visualCharacteristics: direction.visualCharacteristics,
    pageContributions: [],
    updatedAt: new Date().toISOString(),
  };

  await saveDesignMemory(projectId, memory);

  return NextResponse.json({ success: true });
}

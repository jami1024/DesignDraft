import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

import { getShareByToken } from "@/lib/storage";

type RequestBody = {
  token?: string;
  password?: string;
};

export async function POST(request: Request) {
  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "无效请求" }, { status: 400 });
  }

  const { token, password } = body;
  if (!token || !password) {
    return NextResponse.json({ error: "缺少必要参数" }, { status: 400 });
  }

  const share = await getShareByToken(token);
  if (!share) {
    return NextResponse.json({ error: "链接不存在或已失效" }, { status: 404 });
  }

  if (new Date(share.expiresAt) < new Date()) {
    return NextResponse.json({ error: "链接已过期" }, { status: 410 });
  }

  if (!share.passwordHash) {
    return NextResponse.json({ verified: true });
  }

  const valid = await bcrypt.compare(password, share.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "密码错误" }, { status: 403 });
  }

  return NextResponse.json({ verified: true });
}

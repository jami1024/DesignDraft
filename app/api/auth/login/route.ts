import { NextResponse } from "next/server";

type RequestBody = {
  token?: string;
};

export async function POST(request: Request) {
  const authToken = process.env.DESIGNDRAFT_AUTH_TOKEN;

  if (!authToken) {
    return NextResponse.json({ error: "认证未启用" }, { status: 400 });
  }

  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "无效请求" }, { status: 400 });
  }

  if (!body.token || body.token !== authToken) {
    return NextResponse.json({ error: "访问令牌无效" }, { status: 403 });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set("dd_session", authToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });

  return response;
}

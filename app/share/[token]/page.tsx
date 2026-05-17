import { notFound } from "next/navigation";

import { getShareByToken, incrementShareAccess, readPageHtml } from "@/lib/storage";
import { SharePageClient } from "./share-page-client";

type SharePageProps = {
  params: { token: string };
};

export default async function SharePage({ params }: SharePageProps) {
  const share = await getShareByToken(params.token);

  if (!share) {
    notFound();
  }

  const expired = new Date(share.expiresAt) < new Date();

  if (expired) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#FAFAF9]">
        <div className="text-center">
          <h1 className="text-lg font-semibold text-[#1C1917]">链接已过期</h1>
          <p className="mt-2 text-sm text-[#78716C]">此分享链接已失效，请联系分享者获取新链接。</p>
        </div>
      </main>
    );
  }

  if (share.passwordHash) {
    return <SharePageClient token={params.token} needsPassword />;
  }

  await incrementShareAccess(params.token);

  const html = await readPageHtml(share.projectId, share.pageId, share.versionId);
  if (!html) {
    notFound();
  }

  return <SharePageClient token={params.token} initialHtml={html} />;
}

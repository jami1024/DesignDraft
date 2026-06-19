// Route outbound LLM fetches through an HTTP proxy when one is configured.
// Node's global fetch (undici) ignores HTTP(S)_PROXY by default; production
// servers with direct egress leave these env vars unset and skip this entirely.
import { ProxyAgent, setGlobalDispatcher } from "undici";

let installed = false;

export function ensureProxyDispatcher(): void {
  if (installed) return;
  installed = true;
  const proxyUrl =
    process.env.HTTPS_PROXY ||
    process.env.https_proxy ||
    process.env.HTTP_PROXY ||
    process.env.http_proxy;
  if (proxyUrl) {
    setGlobalDispatcher(new ProxyAgent(proxyUrl));
  }
}

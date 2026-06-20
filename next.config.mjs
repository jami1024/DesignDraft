/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  webpack: (config, { isServer }) => {
    if (isServer) {
      // pi-ai is ESM-only (its package exports define only an `import`
      // condition — `require()` throws ERR_PACKAGE_PATH_NOT_EXPORTED) and it
      // lazy-loads provider SDKs + node: builtins via dynamic import() with
      // computed paths. Bundling it makes webpack emit throwing stubs that fail
      // at runtime (MODULE_NOT_FOUND: node:fs). Externalize it as an `import`
      // external so the server bundle loads it via native dynamic import().
      const piAiExternal = ({ request }, cb) =>
        request === "@earendil-works/pi-ai" || (request && request.startsWith("@earendil-works/pi-ai/"))
          ? cb(null, `import ${request}`)
          : cb();
      const existing = config.externals;
      config.externals = [
        piAiExternal,
        ...(Array.isArray(existing) ? existing : existing ? [existing] : []),
      ];
    }
    return config;
  },
};

export default nextConfig;

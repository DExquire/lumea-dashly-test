import path from 'node:path';
import type { NextConfig } from 'next';

/**
 * Media (product images) is served by Strapi, so its host has to be whitelisted
 * for `next/image`. Locally that is `localhost:1337`; in production it is the
 * deployed Strapi instance (or a provider like Cloudinary / S3), which is why
 * the hosts are derived from env instead of being hardcoded.
 */
const mediaOrigins = [
  process.env.NEXT_PUBLIC_STRAPI_URL ?? 'http://localhost:1337',
  ...(process.env.NEXT_PUBLIC_MEDIA_ORIGINS ?? '').split(',').map((value) => value.trim()),
].filter(Boolean);

const remotePatterns = mediaOrigins.flatMap((origin) => {
  try {
    const { protocol, hostname, port } = new URL(origin);

    return [
      {
        protocol: protocol.replace(':', '') as 'http' | 'https',
        hostname,
        ...(port ? { port } : {}),
        pathname: '/**',
      },
    ];
  } catch {
    return [];
  }
});

/**
 * Next blocks optimising images from private IPs (SSRF protection). In local
 * development Strapi *is* on localhost, so the guard is lifted only then —
 * never for a deployed media host.
 */
const hasLocalMediaHost = remotePatterns.some(
  (pattern) => pattern.hostname === 'localhost' || pattern.hostname === '127.0.0.1',
);

/**
 * Anchor every path to this file rather than to `process.cwd()`: the root
 * `npm run dev` starts both apps from the repository root, so the working
 * directory is not the app directory.
 */
const appDir = __dirname;

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  /** This app is one workspace of the monorepo, not the repository root. */
  turbopack: {
    root: appDir,
  },
  images: {
    remotePatterns,
    formats: ['image/avif', 'image/webp'],
    ...(hasLocalMediaHost ? { dangerouslyAllowLocalIP: true } : {}),
  },
  sassOptions: {
    /**
     * Lets every SCSS module `@use "functions"`, `@use "mixins"` etc. without
     * relative paths. `includePaths` is the legacy Sass API name and `loadPaths`
     * the modern one — both are set so the option applies whichever compiler
     * pipeline Next uses.
     */
    includePaths: [path.join(appDir, 'src/styles')],
    loadPaths: [path.join(appDir, 'src/styles')],
  },
};

export default nextConfig;

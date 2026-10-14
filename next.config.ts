import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const nextConfig: NextConfig = {
  // Explicit empty Turbopack config: avoids the Turbopack/webpack ambiguity
  // check, since @serwist/next injects a webpack() hook (used only for
  // `next build --webpack`; disabled entirely in dev).
  turbopack: {},
};

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

export default withSerwist(nextConfig);

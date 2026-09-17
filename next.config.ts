import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The judge and the plan generator read the inspection reference from disk at runtime;
  // make sure serverless bundlers (Vercel) ship it with the API routes.
  outputFileTracingIncludes: {
    "/api/inspect": ["./src/lib/reference/**"],
    "/api/pms": ["./src/lib/reference/**"],
  },
};

export default nextConfig;

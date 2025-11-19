import React from "react";

/**
 * Safely unwrap Next.js App Router params object (which may be a Promise)
 * Usage:
 *   const { marketId } = useParamsSafe(params);
 */
export function useParamsSafe(params: any) {
  // React.use resolves promises in the App Router environment
  const p = React.use(params) as Record<string, any> | undefined;
  return p ?? {};
}

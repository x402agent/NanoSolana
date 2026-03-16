const DEFAULT_CONVEX_SITE_ORIGIN = 'https://original-ibex-124.convex.site'

export function getConvexSiteOrigin(env: NodeJS.ProcessEnv = process.env) {
  const value = env.CONVEX_SITE_URL?.trim() || env.VITE_CONVEX_SITE_URL?.trim()
  if (!value) return DEFAULT_CONVEX_SITE_ORIGIN
  return new URL(value).origin
}

export function buildConvexApiTarget(requestUrl: URL, convexOrigin: string) {
  return new URL(`${requestUrl.pathname}${requestUrl.search}`, convexOrigin).toString()
}

export function rewriteConvexRedirectLocation(
  location: string,
  convexOrigin: string,
  publicOrigin: string,
) {
  const resolved = new URL(location, convexOrigin)
  if (resolved.origin !== convexOrigin) return resolved.toString()
  return new URL(`${resolved.pathname}${resolved.search}${resolved.hash}`, publicOrigin).toString()
}

export function stripCookieDomain(cookie: string, convexOrigin: string) {
  const convexHost = new URL(convexOrigin).hostname.toLowerCase()
  return cookie.replace(/;\s*Domain=([^;]+)/gi, (match, domain: string) => {
    const normalized = domain.trim().toLowerCase().replace(/^\./, '')
    return normalized === convexHost ? '' : match
  })
}

import { describe, expect, it } from 'vitest'

import {
  buildConvexApiTarget,
  getConvexSiteOrigin,
  rewriteConvexRedirectLocation,
  stripCookieDomain,
} from './convex'

describe('convex proxy helpers', () => {
  it('prefers CONVEX_SITE_URL when present', () => {
    expect(
      getConvexSiteOrigin({
        CONVEX_SITE_URL: 'https://custom.convex.site',
        VITE_CONVEX_SITE_URL: 'https://fallback.convex.site',
      } as NodeJS.ProcessEnv),
    ).toBe('https://custom.convex.site')
  })

  it('builds api targets using the incoming path and query', () => {
    expect(
      buildConvexApiTarget(
        new URL('https://nanohub-web-production.up.railway.app/api/auth/callback/github?code=123'),
        'https://original-ibex-124.convex.site',
      ),
    ).toBe('https://original-ibex-124.convex.site/api/auth/callback/github?code=123')
  })

  it('rewrites convex redirects back to the public origin', () => {
    expect(
      rewriteConvexRedirectLocation(
        'https://original-ibex-124.convex.site/?code=abc',
        'https://original-ibex-124.convex.site',
        'https://nanohub-web-production.up.railway.app',
      ),
    ).toBe('https://nanohub-web-production.up.railway.app/?code=abc')
  })

  it('preserves third-party redirects', () => {
    expect(
      rewriteConvexRedirectLocation(
        'https://github.com/login/oauth/authorize?client_id=test',
        'https://original-ibex-124.convex.site',
        'https://nanohub-web-production.up.railway.app',
      ),
    ).toBe('https://github.com/login/oauth/authorize?client_id=test')
  })

  it('strips convex cookie domains so cookies attach to the public host', () => {
    expect(
      stripCookieDomain(
        'authjs.session-token=value; Path=/; Domain=original-ibex-124.convex.site; HttpOnly; Secure',
        'https://original-ibex-124.convex.site',
      ),
    ).toBe('authjs.session-token=value; Path=/; HttpOnly; Secure')
  })
})

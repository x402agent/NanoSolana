import {
  createError,
  defineEventHandler,
  getProxyRequestHeaders,
  getRequestURL,
} from 'h3'

import {
  buildConvexApiTarget,
  getConvexSiteOrigin,
  rewriteConvexRedirectLocation,
  stripCookieDomain,
} from '../../proxy/convex'

const PAYLOAD_METHODS = new Set(['PATCH', 'POST', 'PUT', 'DELETE'])
const EXCLUDED_RESPONSE_HEADERS = new Set(['content-encoding', 'content-length', 'transfer-encoding'])

export default defineEventHandler(async (event) => {
  const requestUrl = getRequestURL(event)
  const publicOrigin = requestUrl.origin
  const convexOrigin = getConvexSiteOrigin()
  const target = buildConvexApiTarget(requestUrl, convexOrigin)

  const requestBody = PAYLOAD_METHODS.has(event.req.method) ? event.req.body : undefined
  const requestHeaders = new Headers(getProxyRequestHeaders(event, { host: false }))

  let upstream: Response
  try {
    upstream = await fetch(target, {
      method: event.req.method,
      headers: requestHeaders,
      body: requestBody,
      duplex: requestBody ? 'half' : undefined,
      redirect: 'manual',
    })
  } catch (error) {
    throw createError({
      statusCode: 502,
      statusMessage: 'NanoHub API proxy failed',
      cause: error,
    })
  }

  const responseHeaders = new Headers()
  for (const [key, value] of upstream.headers.entries()) {
    const lowerKey = key.toLowerCase()
    if (EXCLUDED_RESPONSE_HEADERS.has(lowerKey) || lowerKey === 'set-cookie') continue
    if (lowerKey === 'location') {
      responseHeaders.set(
        key,
        rewriteConvexRedirectLocation(value, convexOrigin, publicOrigin),
      )
      continue
    }
    responseHeaders.append(key, value)
  }

  const setCookies =
    typeof upstream.headers.getSetCookie === 'function'
      ? upstream.headers.getSetCookie()
      : upstream.headers.get('set-cookie')
        ? [upstream.headers.get('set-cookie') as string]
        : []

  for (const cookie of setCookies) {
    responseHeaders.append('set-cookie', stripCookieDomain(cookie, convexOrigin))
  }

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  })
})

import { defaultRenderHandler } from '@tanstack/react-router/ssr/server'
import type { Register } from '@tanstack/react-router'
import {
  createStartHandler,
  type RequestHandler,
} from '@tanstack/react-start/server'

const fetch = createStartHandler(defaultRenderHandler)

export type ServerEntry = { fetch: RequestHandler<Register> }

export function createServerEntry(entry: ServerEntry): ServerEntry {
  return {
    async fetch(...args) {
      return await entry.fetch(...args)
    },
  }
}

export default createServerEntry({ fetch })

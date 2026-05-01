import { createTRPCReact } from '@trpc/react-query'
import { httpBatchLink } from '@trpc/client'
import type { TrpcRouter } from './types'

export const trpc = createTRPCReact<TrpcRouter>()

const getBaseUrl = () => {
  if (typeof window !== 'undefined') return ''
  return 'http://localhost:3000'
}

export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: `${getBaseUrl()}/trpc`,
      headers() {
        const token = localStorage.getItem('token')
        return token ? { Authorization: `Bearer ${token}` } : {}
      },
    }),
  ],
})

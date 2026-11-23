// src/lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,        // data is considered fresh for 30s
      gcTime: 5 * 60_000,       // inactive cache entries removed after 5 min
      retry: 2,
      refetchOnWindowFocus: true,
    },
  },
})   

import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/queryClient'


function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className='bg-slate-900 text-white min-h-screen'>
        <h1>Initialized tanstackQuery</h1>
      </div>
    </QueryClientProvider>
  )
}

export default App

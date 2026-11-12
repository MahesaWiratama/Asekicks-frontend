import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import { ProductProvider } from './utils/ProductContext.jsx'
import './index.css'

// React Query: cache data dari API agar halaman terasa cepat dan data selalu sinkron
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      {/* Membungkus App dengan QueryClientProvider dan ProductProvider */}
      <QueryClientProvider client={queryClient}>
        <ProductProvider>
          <App />
          <Toaster position="top-right" reverseOrder={false} />
        </ProductProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>,
)

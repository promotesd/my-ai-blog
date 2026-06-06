import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'sonner'
import IntlProvider from '@/providers/IntlProvider'
import { ThemeProvider } from '@/providers/ThemeProvider'
import ErrorBoundary from '@/components/ErrorBoundary'
import ThemeColorSync from '@/components/ThemeColorSync'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <IntlProvider>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <BrowserRouter>
            <Toaster richColors />
            <ThemeColorSync />
            <App />
          </BrowserRouter>
        </ThemeProvider>
      </IntlProvider>
    </ErrorBoundary>
  </StrictMode>,
)

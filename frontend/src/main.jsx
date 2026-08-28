import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './routes/AppRoutes.jsx'
import ErrorBoundary from './shared/ErrorBoundary.jsx'

// The boundary sits OUTSIDE the router on purpose. A route that fails to
// resolve, or a router that throws while matching, is exactly the crash that
// most deserves to be caught — and a boundary mounted inside the thing that
// broke goes down with it.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
)

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { Auth0Setup } from './auth0/Auth0Setup'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Auth0Setup>
      <App />
    </Auth0Setup>
  </StrictMode>,
)
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './demo/App'
import './chrome-title/fonts.css'
import './chrome-title/chrome-title.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

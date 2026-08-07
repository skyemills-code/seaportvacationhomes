import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { DraftProvider } from './context/DraftContext'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <DraftProvider>
      <App />
    </DraftProvider>
  </StrictMode>
)

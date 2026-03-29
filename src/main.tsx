import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './i18n'
import App from './App.tsx'

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {/* silent */});
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

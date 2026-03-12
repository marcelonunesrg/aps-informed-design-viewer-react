import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import './i18n'

createRoot(document.getElementById('root') as HTMLElement).render(
  <App />,
)

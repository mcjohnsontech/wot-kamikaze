import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MantineProvider } from '@mantine/core'
import '@mantine/core/styles.css'
import './index.css'
import { theme } from './theme';
import './App.css'
import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary'
import { MotionProvider } from './context/MotionContext'
import { MagneticCursor } from './components/MagneticCursor'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MotionProvider>
      <MantineProvider theme={theme}>
        <ErrorBoundary>
          <MagneticCursor />
          <App />
        </ErrorBoundary>
      </MantineProvider>
    </MotionProvider>
  </StrictMode>,
)

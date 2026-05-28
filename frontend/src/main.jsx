import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import DashboardApp from './dashboard/DashboardApp.jsx'
import MonitoringApp from './monitoring/MonitoringApp.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/dashboard" element={<DashboardApp />} />
        <Route path="/monitoring" element={<MonitoringApp />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)


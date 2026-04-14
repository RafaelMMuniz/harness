import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './components/Layout'
import { EventsPage } from './pages/Events'
import { TrendsPage } from './pages/Trends'
import { FunnelsPage } from './pages/Funnels'
import { UsersPage } from './pages/Users'
import { SettingsPage } from './pages/Settings'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/events" replace />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/trends" element={<TrendsPage />} />
          <Route path="/funnels" element={<FunnelsPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

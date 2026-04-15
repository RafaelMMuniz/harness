import { Routes, Route } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import EventsPage from './pages/EventsPage';
import TrendsPage from './pages/TrendsPage';
import FunnelsPage from './pages/FunnelsPage';
import UsersPage from './pages/UsersPage';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="ml-60 flex-1 min-h-screen bg-neutral-100 p-8">
        <Routes>
          <Route path="/" element={<EventsPage />} />
          <Route path="/trends" element={<TrendsPage />} />
          <Route path="/funnels" element={<FunnelsPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </main>
    </div>
  );
}

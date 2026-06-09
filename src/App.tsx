import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './components/Layout/MainLayout';
import Dashboard from './pages/Dashboard';
import Rules from './pages/Rules';
import Scan from './pages/Scan';
import Classification from './pages/Classification';
import Rename from './pages/Rename';
import Todos from './pages/Todos';
import Logs from './pages/Logs';
import Undo from './pages/Undo';
import Settings from './pages/Settings';

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="rules" element={<Rules />} />
          <Route path="scan" element={<Scan />} />
          <Route path="classification" element={<Classification />} />
          <Route path="rename" element={<Rename />} />
          <Route path="todos" element={<Todos />} />
          <Route path="logs" element={<Logs />} />
          <Route path="undo" element={<Undo />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </Router>
  );
}

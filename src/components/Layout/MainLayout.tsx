import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAppStore } from '../../store/useAppStore';

const MainLayout: React.FC = () => {
  const { fetchDashboardStats, fetchTodos, fetchLogs } = useAppStore();

  useEffect(() => {
    fetchDashboardStats();
    fetchTodos();
    fetchLogs();
  }, []);

  return (
    <div className="min-h-screen">
      <Sidebar />
      <div className="ml-64 min-h-screen">
        <Header />
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;

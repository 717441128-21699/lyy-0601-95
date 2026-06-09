import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderGit2,
  ScanSearch,
  ListFilter,
  FileType,
  CheckSquare,
  ScrollText,
  Undo2,
  Settings,
  Zap,
} from 'lucide-react';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { to: '/', label: '仪表板', icon: <LayoutDashboard size={20} /> },
  { to: '/rules', label: '规则配置', icon: <FolderGit2 size={20} /> },
  { to: '/scan', label: '文件扫描', icon: <ScanSearch size={20} /> },
  { to: '/classification', label: '分类预览', icon: <ListFilter size={20} /> },
  { to: '/rename', label: '批量重命名', icon: <FileType size={20} /> },
  { to: '/todos', label: '待办事项', icon: <CheckSquare size={20} /> },
  { to: '/logs', label: '执行日志', icon: <ScrollText size={20} /> },
  { to: '/undo', label: '撤销恢复', icon: <Undo2 size={20} /> },
  { to: '/settings', label: '系统设置', icon: <Settings size={20} /> },
];

const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 bg-white shadow-medium flex flex-col h-screen fixed left-0 top-0 z-40">
      <div className="p-6 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-700 to-primary-800 flex items-center justify-center shadow-soft">
            <Zap className="text-white" size={24} />
          </div>
          <div>
            <h1 className="font-display font-bold text-lg text-primary-800">效率助手</h1>
            <p className="text-xs text-slate-500">智能文档管理</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-thin">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''}`
            }
          >
            {item.icon}
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-100">
        <div className="bg-gradient-to-r from-primary-50 to-accent-50 rounded-xl p-4">
          <p className="text-sm font-medium text-primary-800 mb-2">
            💡 快捷操作
          </p>
          <div className="space-y-2">
            <NavLink to="/scan" className="text-xs text-primary-600 hover:text-primary-800 flex items-center gap-1">
              <ScanSearch size={14} />
              快速扫描文件夹
            </NavLink>
            <NavLink to="/todos" className="text-xs text-primary-600 hover:text-primary-800 flex items-center gap-1">
              <CheckSquare size={14} />
              查看待办事项
            </NavLink>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;

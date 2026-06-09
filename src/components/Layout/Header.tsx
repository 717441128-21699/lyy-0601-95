import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Bell,
  Search,
  RotateCcw,
  Download,
  AlertCircle,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { api, downloadFile } from '../../services/api';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { loading, error, setError, undoLatest, scannedFiles, todos } = useAppStore();

  const handleUndo = async () => {
    if (window.confirm('确定要撤销上次操作吗？')) {
      try {
        await undoLatest();
        alert('撤销成功！');
      } catch (err) {
        alert('撤销失败：' + (err as Error).message);
      }
    }
  };

  const handleExport = async () => {
    if (scannedFiles.length === 0) {
      alert('请先扫描文件');
      return;
    }
    try {
      const response = await api.export.exportProcessingList(scannedFiles, '整理清单');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `处理清单_${new Date().toLocaleDateString()}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('导出失败：' + (err as Error).message);
    }
  };

  const pageTitle = (() => {
    switch (location.pathname) {
      case '/': return '仪表板';
      case '/rules': return '规则配置';
      case '/scan': return '文件扫描';
      case '/classification': return '分类预览';
      case '/rename': return '批量重命名';
      case '/todos': return '待办事项';
      case '/logs': return '执行日志';
      case '/undo': return '撤销恢复';
      case '/settings': return '系统设置';
      default: return '效率助手';
    }
  })();

  const pendingTodos = todos.filter(t => t.status === 'pending').length;

  return (
    <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-30">
      <div className="h-full px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-display font-semibold text-slate-800">
            {pageTitle}
          </h2>
          {loading && (
            <div className="flex items-center gap-2 text-accent-600">
              <div className="w-4 h-4 border-2 border-accent-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">处理中...</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {error && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-warning-50 text-warning-600 rounded-lg text-sm">
              <AlertCircle size={16} />
              <span>{error}</span>
              <button
                onClick={() => setError(null)}
                className="ml-1 hover:text-warning-700"
              >
                ×
              </button>
            </div>
          )}

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="搜索..."
              className="pl-10 pr-4 py-2 w-64 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-400 transition-all"
            />
          </div>

          <button
            onClick={handleExport}
            className="p-2 text-slate-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-all"
            title="导出处理清单"
          >
            <Download size={20} />
          </button>

          <button
            onClick={handleUndo}
            className="p-2 text-slate-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-all"
            title="撤销上次操作"
          >
            <RotateCcw size={20} />
          </button>

          <button
            onClick={() => navigate('/todos')}
            className="relative p-2 text-slate-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-all"
          >
            <Bell size={20} />
            {pendingTodos > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent-500 text-white text-xs font-medium rounded-full flex items-center justify-center">
                {pendingTodos}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;

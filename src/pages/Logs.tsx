import React, { useEffect, useState } from 'react';
import {
  ScrollText,
  Download,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Info,
  FileText,
  RefreshCw,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import dayjs from 'dayjs';
import { api, downloadFile } from '../services/api';

const Logs: React.FC = () => {
  const [levelFilter, setLevelFilter] = useState<string>('all');

  const { logs, loading, fetchLogs } = useAppStore();

  useEffect(() => {
    fetchLogs(100);
  }, []);

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error':
        return <AlertCircle className="text-warning-500" size={16} />;
      case 'warning':
        return <AlertTriangle className="text-accent-500" size={16} />;
      case 'success':
        return <CheckCircle className="text-success-500" size={16} />;
      default:
        return <Info className="text-primary-500" size={16} />;
    }
  };

  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'error':
        return <span className="badge badge-warning">错误</span>;
      case 'warning':
        return <span className="badge badge-accent">警告</span>;
      case 'success':
        return <span className="badge badge-success">成功</span>;
      default:
        return <span className="badge badge-primary">信息</span>;
    }
  };

  const filteredLogs = levelFilter === 'all'
    ? logs
    : logs.filter(l => l.level === levelFilter);

  const handleExport = async () => {
    try {
      const response = await api.export.exportLogs();
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `执行日志_${dayjs().format('YYYYMMDD')}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('导出失败');
    }
  };

  const stats = {
    all: logs.length,
    success: logs.filter(l => l.status === 'success').length,
    warning: logs.filter(l => l.level === 'warning').length,
    error: logs.filter(l => l.level === 'error').length,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">执行日志</h3>
            <p className="text-sm text-slate-500">查看所有操作记录和异常信息</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchLogs(100)}
              className="btn-secondary flex items-center gap-2"
            >
              <RefreshCw size={16} />
              刷新
            </button>
            <button onClick={handleExport} className="btn-secondary flex items-center gap-2">
              <Download size={16} />
              导出日志
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-6">
          {(['all', 'success', 'warning', 'error'] as const).map((level) => (
            <button
              key={level}
              onClick={() => setLevelFilter(level)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                levelFilter === level
                  ? 'bg-primary-800 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {level === 'all' && '全部'}
              {level === 'success' && '成功'}
              {level === 'warning' && '警告'}
              {level === 'error' && '错误'}
              <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                levelFilter === level ? 'bg-white/20' : 'bg-slate-200'
              }`}>
                {stats[level as keyof typeof stats]}
              </span>
            </button>
          ))}
        </div>

        {filteredLogs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-header w-12"></th>
                  <th className="table-header">时间</th>
                  <th className="table-header">级别</th>
                  <th className="table-header">操作</th>
                  <th className="table-header">消息</th>
                  <th className="table-header">详情</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="table-row">
                    <td className="table-cell">
                      {getLevelIcon(log.level)}
                    </td>
                    <td className="table-cell text-slate-600 whitespace-nowrap">
                      {dayjs(log.timestamp).format('YYYY-MM-DD HH:mm:ss')}
                    </td>
                    <td className="table-cell">
                      {getLevelBadge(log.level)}
                    </td>
                    <td className="table-cell">
                      <span className="text-sm text-slate-700">{log.action}</span>
                    </td>
                    <td className="table-cell">
                      <span className="text-sm text-slate-700">{log.message}</span>
                    </td>
                    <td className="table-cell">
                      {log.details ? (
                        <details className="text-xs text-slate-500">
                          <summary className="cursor-pointer hover:text-primary-600">
                            查看详情
                          </summary>
                          <pre className="mt-2 p-2 bg-slate-50 rounded-lg text-xs overflow-x-auto max-w-md">
                            {typeof log.details === 'string'
                              ? log.details
                              : JSON.stringify(log.details, null, 2)}
                          </pre>
                        </details>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-slate-500">
            <ScrollText className="mx-auto mb-3 opacity-50" size={48} />
            <p>暂无日志记录</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Logs;

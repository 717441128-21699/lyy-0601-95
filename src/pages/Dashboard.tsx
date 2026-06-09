import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  CheckSquare,
  ScrollText,
  Clock,
  Receipt,
  ScrollText as ScrollTextIcon,
  BellRing,
  ArrowRight,
  TrendingUp,
  Calendar,
  Zap,
  AlertTriangle,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import StatCard from '../components/UI/StatCard';
import FileTypeIcon from '../components/UI/FileTypeIcon';
import dayjs from 'dayjs';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { dashboardStats, todos, logs, fetchDashboardStats, fetchTodos, fetchLogs } = useAppStore();

  useEffect(() => {
    fetchDashboardStats();
    fetchTodos();
    fetchLogs();
  }, []);

  const recentTodos = todos.slice(0, 5);
  const recentLogs = logs.slice(0, 5);

  const fileTypeStats = dashboardStats?.fileTypeStats || [];
  const upcomingDeadlines = todos
    .filter(t => t.status === 'pending' && t.deadline)
    .sort((a, b) => dayjs(a.deadline).valueOf() - dayjs(b.deadline).valueOf())
    .slice(0, 5);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-4 gap-6">
        <StatCard
          title="待处理文件"
          value={dashboardStats?.totalFiles || 0}
          icon={FileText}
          gradient="bg-gradient-to-br from-primary-600 to-primary-800"
          change="较昨日 +12%"
          changeType="increase"
          onClick={() => navigate('/scan')}
        />
        <StatCard
          title="待办事项"
          value={dashboardStats?.pendingTodos || 0}
          icon={CheckSquare}
          gradient="bg-gradient-to-br from-accent-500 to-accent-700"
          onClick={() => navigate('/todos')}
        />
        <StatCard
          title="今日执行次数"
          value={dashboardStats?.todayOperations || 0}
          icon={Zap}
          gradient="bg-gradient-to-br from-emerald-500 to-emerald-700"
          change="+8次"
          changeType="increase"
        />
        <StatCard
          title="处理成功率"
          value={`${dashboardStats?.successRate || 0}%`}
          icon={TrendingUp}
          gradient="bg-gradient-to-br from-violet-500 to-violet-700"
          change="+2.3%"
          changeType="increase"
        />
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-800">文件类型分布</h3>
                <p className="text-sm text-slate-500">已扫描文件按类型统计</p>
              </div>
              <button
                onClick={() => navigate('/scan')}
                className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
              >
                查看全部 <ArrowRight size={14} />
              </button>
            </div>

            {fileTypeStats.length > 0 ? (
              <div className="space-y-4">
                {fileTypeStats.map((stat: any) => {
                  const total = fileTypeStats.reduce((sum: number, s: any) => sum + s.count, 0);
                  const percentage = total > 0 ? (stat.count / total) * 100 : 0;
                  
                  return (
                    <div key={stat.type} className="flex items-center gap-4">
                      <FileTypeIcon type={stat.type} size={24} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-slate-700">
                            {stat.typeName}
                          </span>
                          <span className="text-sm text-slate-500">
                            {stat.count} 个 ({percentage.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="progress-bar">
                          <div
                            className="progress-fill"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <FileText className="mx-auto mb-3 opacity-50" size={48} />
                <p>暂无文件数据</p>
                <p className="text-sm">请先扫描文件夹</p>
              </div>
            )}
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-800">截止日期提醒</h3>
                <p className="text-sm text-slate-500">即将到期的待办事项</p>
              </div>
              <button
                onClick={() => navigate('/todos')}
                className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
              >
                查看全部 <ArrowRight size={14} />
              </button>
            </div>

            {upcomingDeadlines.length > 0 ? (
              <div className="space-y-3">
                {upcomingDeadlines.map((todo) => {
                  const isUrgent = dayjs(todo.deadline).diff(dayjs(), 'day') <= 1;
                  const isToday = dayjs(todo.deadline).isSame(dayjs(), 'day');
                  
                  return (
                    <div
                      key={todo.id}
                      className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
                    >
                      <div className={`w-2 h-2 rounded-full ${
                        isUrgent ? 'bg-warning-500 animate-pulse' : 'bg-primary-500'
                      }`} />
                      <div className="flex-1">
                        <p className="font-medium text-slate-800">{todo.title}</p>
                        <p className="text-sm text-slate-500">{todo.description}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-medium ${
                          isUrgent ? 'text-warning-600' : 'text-slate-600'
                        }`}>
                          {isToday ? '今天' : dayjs(todo.deadline).format('MM月DD日')}
                        </p>
                        <p className="text-xs text-slate-400">
                          {dayjs(todo.deadline).format('HH:mm')}
                        </p>
                      </div>
                      {todo.priority === 'high' && (
                        <AlertTriangle className="text-accent-500" size={18} />
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <CheckSquare className="mx-auto mb-3 opacity-50" size={48} />
                <p>暂无待办事项</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-800">快捷操作</h3>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/scan')}
                className="w-full p-4 rounded-xl bg-gradient-to-r from-primary-50 to-primary-100 hover:from-primary-100 hover:to-primary-200 transition-all flex items-center gap-3 group"
              >
                <div className="w-10 h-10 rounded-lg bg-primary-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Zap className="text-white" size={20} />
                </div>
                <div className="text-left">
                  <p className="font-medium text-primary-800">快速扫描</p>
                  <p className="text-xs text-primary-600">扫描收件文件夹</p>
                </div>
              </button>

              <button
                onClick={() => navigate('/classification')}
                className="w-full p-4 rounded-xl bg-gradient-to-r from-accent-50 to-accent-100 hover:from-accent-100 hover:to-accent-200 transition-all flex items-center gap-3 group"
              >
                <div className="w-10 h-10 rounded-lg bg-accent-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ArrowRight className="text-white" size={20} />
                </div>
                <div className="text-left">
                  <p className="font-medium text-accent-800">一键整理</p>
                  <p className="text-xs text-accent-600">按规则分类文件</p>
                </div>
              </button>

              <button
                onClick={() => navigate('/rules')}
                className="w-full p-4 rounded-xl bg-gradient-to-r from-violet-50 to-violet-100 hover:from-violet-100 hover:to-violet-200 transition-all flex items-center gap-3 group"
              >
                <div className="w-10 h-10 rounded-lg bg-violet-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ScrollTextIcon className="text-white" size={20} />
                </div>
                <div className="text-left">
                  <p className="font-medium text-violet-800">规则管理</p>
                  <p className="text-xs text-violet-600">配置分类规则</p>
                </div>
              </button>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-800">最近操作</h3>
              <button
                onClick={() => navigate('/logs')}
                className="text-xs text-primary-600 hover:text-primary-700"
              >
                全部日志
              </button>
            </div>

            {recentLogs.length > 0 ? (
              <div className="space-y-3">
                {recentLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      log.level === 'error' ? 'bg-warning-100' :
                      log.level === 'warning' ? 'bg-accent-100' : 'bg-primary-100'
                    }`}>
                      {log.action.includes('scan') && <Clock size={14} className="text-primary-600" />}
                      {log.action.includes('classify') && <FileText size={14} className="text-primary-600" />}
                      {log.action.includes('rename') && <FileText size={14} className="text-primary-600" />}
                      {log.action.includes('todo') && <CheckSquare size={14} className="text-primary-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700 truncate">
                        {log.message}
                      </p>
                      <p className="text-xs text-slate-400">
                        {dayjs(log.timestamp).fromNow()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-slate-500">
                <ScrollText className="mx-auto mb-2 opacity-50" size={32} />
                <p className="text-sm">暂无操作记录</p>
              </div>
            )}
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">文件类型</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 rounded-lg bg-accent-50">
                <Receipt className="mx-auto text-accent-600 mb-1" size={24} />
                <p className="text-xs text-slate-600">发票</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-primary-50">
                <ScrollTextIcon className="mx-auto text-primary-600 mb-1" size={24} />
                <p className="text-xs text-slate-600">合同</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-warning-50">
                <BellRing className="mx-auto text-warning-600 mb-1" size={24} />
                <p className="text-xs text-slate-600">通知</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

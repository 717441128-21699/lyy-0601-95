import React, { useEffect, useState } from 'react';
import {
  Settings as SettingsIcon,
  Plus,
  Trash2,
  Edit2,
  Save,
  Clock,
  FolderOpen,
  Bell,
  Shield,
  Play,
  Pause,
  Calendar,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import dayjs from 'dayjs';
import Modal from '../components/UI/Modal';
import type { ScheduledTask, IgnoreRule, Settings } from '../../shared/types';

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'general' | 'schedule' | 'ignore' | 'about'>('general');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showIgnoreModal, setShowIgnoreModal] = useState(false);
  const [editingTask, setEditingTask] = useState<ScheduledTask | null>(null);
  const [editingIgnore, setEditingIgnore] = useState<IgnoreRule | null>(null);
  const [taskForm, setTaskForm] = useState<any>({});
  const [ignoreForm, setIgnoreForm] = useState<any>({});

  const {
    settings,
    scheduledTasks,
    ignoreRules,
    fetchSettings,
    updateSettings,
    fetchScheduledTasks,
    addScheduledTask,
    updateScheduledTask,
    deleteScheduledTask,
    runScheduledTask,
    fetchIgnoreRules,
    addIgnoreRule,
    updateIgnoreRule,
    deleteIgnoreRule,
  } = useAppStore();

  useEffect(() => {
    fetchSettings();
    fetchScheduledTasks();
    fetchIgnoreRules();
  }, [activeTab]);

  const handleAddTask = () => {
    setEditingTask(null);
    setTaskForm({
      name: '',
      type: 'scan_and_classify' as ScheduledTask['type'],
      cronExpression: '0 9 * * *',
      targetPath: '',
      isEnabled: true,
    });
    setShowTaskModal(true);
  };

  const handleEditTask = (task: ScheduledTask) => {
    setEditingTask(task);
    setTaskForm({ ...task });
    setShowTaskModal(true);
  };

  const handleSaveTask = async () => {
    if (editingTask) {
      await updateScheduledTask(editingTask.id, taskForm);
    } else {
      await addScheduledTask(taskForm);
    }
    setShowTaskModal(false);
    fetchScheduledTasks();
  };

  const handleAddIgnore = () => {
    setEditingIgnore(null);
    setIgnoreForm({
      name: '',
      type: 'filename' as IgnoreRule['type'],
      pattern: '',
      isActive: true,
    });
    setShowIgnoreModal(true);
  };

  const handleEditIgnore = (rule: IgnoreRule) => {
    setEditingIgnore(rule);
    setIgnoreForm({ ...rule });
    setShowIgnoreModal(true);
  };

  const handleSaveIgnore = async () => {
    if (editingIgnore) {
      await updateIgnoreRule(editingIgnore.id, ignoreForm);
    } else {
      await addIgnoreRule(ignoreForm);
    }
    setShowIgnoreModal(false);
    fetchIgnoreRules();
  };

  const toggleSetting = (key: keyof Settings, value: any) => {
    updateSettings({ [key]: value });
  };

  const cronPresets = [
    { label: '每天 9:00', value: '0 9 * * *' },
    { label: '每天 18:00', value: '0 18 * * *' },
    { label: '每周一 9:00', value: '0 9 * * 1' },
    { label: '每小时', value: '0 * * * *' },
  ];

  const taskTypeLabels: Record<ScheduledTask['type'], string> = {
    scan: '仅扫描',
    classify: '仅分类',
    scan_and_classify: '扫描并分类',
    full: '完整整理',
  };

  const ignoreTypeLabels: Record<IgnoreRule['type'], string> = {
    filename: '文件名匹配',
    extension: '扩展名',
    folder: '目录',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="card">
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => setActiveTab('general')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'general'
                ? 'bg-primary-800 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            通用设置
          </button>
          <button
            onClick={() => setActiveTab('schedule')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'schedule'
                ? 'bg-primary-800 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            定时任务
          </button>
          <button
            onClick={() => setActiveTab('ignore')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'ignore'
                ? 'bg-primary-800 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            忽略规则
          </button>
          <button
            onClick={() => setActiveTab('about')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'about'
                ? 'bg-primary-800 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            关于
          </button>
        </div>

        {activeTab === 'general' && (
          <div className="space-y-6">
            <div>
              <h4 className="font-medium text-slate-800 mb-4 flex items-center gap-2">
                <FolderOpen size={18} />
                文件夹设置
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">默认收件文件夹</label>
                  <input
                    type="text"
                    className="input-field"
                    value={settings.defaultInboxPath || ''}
                    onChange={(e) => toggleSetting('defaultInboxPath', e.target.value)}
                    placeholder="例如：C:/Users/Administrator/Downloads"
                  />
                </div>
                <div>
                  <label className="label">默认输出文件夹</label>
                  <input
                    type="text"
                    className="input-field"
                    value={settings.defaultOutputPath || ''}
                    onChange={(e) => toggleSetting('defaultOutputPath', e.target.value)}
                    placeholder="例如：C:/Users/Administrator/Documents/整理"
                  />
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-slate-800 mb-4 flex items-center gap-2">
                <Bell size={18} />
                通知设置
              </h4>
              <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-medium text-slate-700">操作完成通知</p>
                  <p className="text-sm text-slate-500">文件整理完成后发送通知</p>
                </div>
                <div
                  className={`toggle-switch ${
                    settings.notificationEnabled ? 'on' : 'off'
                  }`}
                  onClick={() => toggleSetting('notificationEnabled', !settings.notificationEnabled)}
                >
                  <div
                    className="toggle-knob"
                    style={{
                      transform: `translateX(${settings.notificationEnabled ? '20px' : '2px'}`,
                    }}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-medium text-slate-700">截止日期提醒</p>
                  <p className="text-sm text-slate-500">待办事项到期前提醒</p>
                </div>
                <div
                  className={`toggle-switch ${
                    settings.deadlineReminder ? 'on' : 'off'
                  }`}
                  onClick={() => toggleSetting('deadlineReminder', !settings.deadlineReminder)}
                >
                  <div
                    className="toggle-knob"
                    style={{
                      transform: `translateX(${settings.deadlineReminder ? '20px' : '2px'}`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-slate-800 mb-4 flex items-center gap-2">
              <Shield size={18} />
              安全设置
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-medium text-slate-700">自动创建备份</p>
                  <p className="text-sm text-slate-500">操作前自动备份文件</p>
                </div>
                <div
                  className={`toggle-switch ${
                    settings.autoBackup ? 'on' : 'off'
                  }`}
                  onClick={() => toggleSetting('autoBackup', !settings.autoBackup)}
                >
                  <div
                    className="toggle-knob"
                    style={{
                      transform: `translateX(${settings.autoBackup ? '20px' : '2px'}`,
                    }}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-medium text-slate-700">操作前确认</p>
                  <p className="text-sm text-slate-500">执行批量操作前要求确认</p>
                </div>
                <div
                  className={`toggle-switch ${
                    settings.confirmBeforeAction ? 'on' : 'off'
                  }`}
                  onClick={() => toggleSetting('confirmBeforeAction', !settings.confirmBeforeAction)}
                >
                  <div
                    className="toggle-knob"
                    style={{
                      transform: `translateX(${settings.confirmBeforeAction ? '20px' : '2px'}`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-slate-800 mb-4 flex items-center gap-2">
              <Clock size={18} />
              保留设置
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">日志保留天数</label>
                <input
                  type="number"
                  className="input-field"
                  value={settings.logRetentionDays || 30}
                  onChange={(e) => toggleSetting('logRetentionDays', Number(e.target.value))}
                  min="1"
                  max="365"
                />
              </div>
              <div>
                <label className="label">快照保留数量</label>
                <input
                  type="number"
                  className="input-field"
                  value={settings.snapshotRetentionCount || 10}
                  onChange={(e) => toggleSetting('snapshotRetentionCount', Number(e.target.value))}
                  min="1"
                  max="100"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'schedule' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-slate-500">
              配置定时任务，自动扫描和整理文件
            </p>
            <button onClick={handleAddTask} className="btn-primary flex items-center gap-2">
              <Plus size={16} />
              添加任务
            </button>
          </div>

          {scheduledTasks.length > 0 ? (
            <div className="space-y-3">
              {scheduledTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-all group"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                    <Calendar className="text-primary-600" size={20} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-slate-800">{task.name}</h4>
                      <span className="badge badge-primary">
                        {taskTypeLabels[task.type]}
                      </span>
                      {task.isEnabled ? (
                        <span className="badge badge-success">已启用</span>
                      ) : (
                        <span className="badge bg-slate-200 text-slate-600">已禁用</span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <span>Cron: {task.cronExpression}</span>
                      {task.targetPath && <span>路径: {task.targetPath}</span>}
                      {task.lastRunAt && (
                        <span>上次运行: {dayjs(task.lastRunAt).format('MM-DD HH:mm')}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => runScheduledTask(task.id)}
                      className="p-2 text-slate-500 hover:text-success-600 hover:bg-success-50 rounded-lg transition-colors"
                      title="立即运行"
                    >
                      <Play size={16} />
                    </button>
                    <button
                      onClick={() => handleEditTask(task)}
                      className="p-2 text-slate-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('确定要删除这个定时任务吗？')) {
                          deleteScheduledTask(task.id);
                        }
                      }}
                      className="p-2 text-slate-500 hover:text-warning-600 hover:bg-warning-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500">
              <Clock className="mx-auto mb-3 opacity-50" size={48} />
              <p>暂无定时任务</p>
              <p className="text-sm">点击"添加任务"创建第一个定时任务</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'ignore' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-slate-500">
            配置忽略规则，扫描时跳过指定的文件或目录
            </p>
            <button onClick={handleAddIgnore} className="btn-primary flex items-center gap-2">
              <Plus size={16} />
              添加规则
            </button>
          </div>

          {ignoreRules.length > 0 ? (
            <div className="space-y-3">
              {ignoreRules.map((rule) => (
                <div
                  key={rule.id}
                  className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-all group"
                >
                  <div className="w-10 h-10 rounded-lg bg-slate-200 flex items-center justify-center">
                    <Shield className="text-slate-600" size={20} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-slate-800">{rule.name}</h4>
                      <span className="badge badge-primary">
                        {ignoreTypeLabels[rule.type]}
                      </span>
                      {rule.isActive ? (
                        <span className="badge badge-success">已启用</span>
                      ) : (
                        <span className="badge bg-slate-200 text-slate-600">已禁用</span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500">
                      匹配规则: {rule.pattern}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEditIgnore(rule)}
                      className="p-2 text-slate-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('确定要删除这个忽略规则吗？')) {
                          deleteIgnoreRule(rule.id);
                        }
                      }}
                      className="p-2 text-slate-500 hover:text-warning-600 hover:bg-warning-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500">
              <Shield className="mx-auto mb-3 opacity-50" size={48} />
              <p>暂无忽略规则</p>
              <p className="text-sm">点击"添加规则"创建第一个忽略规则</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'about' && (
        <div className="text-center py-12">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center mx-auto mb-4">
            <SettingsIcon className="text-white" size={40} />
          </div>
          <h3 className="text-xl font-semibold text-slate-800 mb-2">
            个人效率自动化工具
          </h3>
          <p className="text-slate-500 mb-4">版本 1.0.0</p>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            面向行政人员的智能文档管理工具，自动整理收件文件夹，生成待办事项，
            支持智能识别发票、合同、通知等文件类型，提取截止日期，
            让您的工作更加高效有序。
          </p>
        </div>
      )}
    </div>
      <Modal
      isOpen={showTaskModal}
      onClose={() => setShowTaskModal(false)}
      title={editingTask ? '编辑定时任务' : '添加定时任务'}
    >
      <div className="space-y-4">
        <div>
          <label className="label">任务名称</label>
          <input
            type="text"
            className="input-field"
            value={taskForm.name || ''}
            onChange={(e) => setTaskForm({ ...taskForm, name: e.target.value })}
            placeholder="例如：每日整理下载文件夹"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">任务类型</label>
            <select
              className="input-field"
              value={taskForm.type || 'scan_and_classify'}
              onChange={(e) => setTaskForm({ ...taskForm, type: e.target.value })}
            >
              <option value="scan">仅扫描</option>
              <option value="classify">仅分类</option>
              <option value="scan_and_classify">扫描并分类</option>
            </select>
          </div>
          <div>
            <label className="label">Cron 表达式</label>
            <select
              className="input-field"
              value={taskForm.cronExpression || '0 9 * * *'}
              onChange={(e) => setTaskForm({ ...taskForm, cronExpression: e.target.value })}
            >
              {cronPresets.map((preset) => (
                <option key={preset.value} value={preset.value}>
                  {preset.label} ({preset.value})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="label">目标路径</label>
          <input
            type="text"
            className="input-field"
            value={taskForm.targetPath || ''}
            onChange={(e) => setTaskForm({ ...taskForm, targetPath: e.target.value })}
            placeholder="留空使用默认收件文件夹"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="taskEnabled"
            checked={taskForm.isEnabled ?? true}
            onChange={(e) => setTaskForm({ ...taskForm, isEnabled: e.target.checked })}
            className="w-4 h-4 text-primary-600 rounded border-slate-300 focus:ring-primary-500"
          />
          <label htmlFor="taskEnabled" className="text-sm text-slate-700">
            启用此任务
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <button onClick={() => setShowTaskModal(false)} className="btn-secondary">
            取消
          </button>
          <button onClick={handleSaveTask} className="btn-primary flex items-center gap-2">
            <Save size={16} />
            保存
          </button>
        </div>
      </div>
    </Modal>

    <Modal
      isOpen={showIgnoreModal}
      onClose={() => setShowIgnoreModal(false)}
      title={editingIgnore ? '编辑忽略规则' : '添加忽略规则'}
    >
      <div className="space-y-4">
        <div>
          <label className="label">规则名称</label>
          <input
            type="text"
            className="input-field"
            value={ignoreForm.name || ''}
            onChange={(e) => setIgnoreForm({ ...ignoreForm, name: e.target.value })}
            placeholder="例如：忽略临时文件"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">规则类型</label>
            <select
              className="input-field"
              value={ignoreForm.type || 'filename'}
              onChange={(e) => setIgnoreForm({ ...ignoreForm, type: e.target.value as IgnoreRule['type'] })}
            >
              <option value="filename">文件名匹配</option>
              <option value="extension">按扩展名</option>
              <option value="folder">按目录</option>
            </select>
          </div>
          <div>
            <label className="label">匹配规则</label>
            <input
              type="text"
              className="input-field"
              value={ignoreForm.pattern || ''}
              onChange={(e) => setIgnoreForm({ ...ignoreForm, pattern: e.target.value })}
              placeholder={
                ignoreForm.type === 'extension' ? '例如：.tmp,.log' :
                ignoreForm.type === 'directory' ? '例如：temp,cache' :
                '例如：~$*,*.tmp'
              }
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="ignoreActive"
            checked={ignoreForm.isActive ?? true}
            onChange={(e) => setIgnoreForm({ ...ignoreForm, isActive: e.target.checked })}
            className="w-4 h-4 text-primary-600 rounded border-slate-300 focus:ring-primary-500"
          />
          <label htmlFor="ignoreActive" className="text-sm text-slate-700">
            启用此规则
          </label>
        </div>

        <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-600">
          <p className="font-medium mb-1">支持通配符：</p>
          <p>• * 匹配任意字符，** 匹配任意目录</p>
          <p>• ? 匹配单个字符</p>
          <p>• 多个规则用逗号分隔</p>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <button onClick={() => setShowIgnoreModal(false)} className="btn-secondary">
            取消
          </button>
          <button onClick={handleSaveIgnore} className="btn-primary flex items-center gap-2">
            <Save size={16} />
            保存
          </button>
        </div>
      </div>
    </Modal>
    </div>
  );
};

export default Settings;

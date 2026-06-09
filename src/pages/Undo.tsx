import React, { useEffect, useState } from 'react';
import {
  Undo2,
  RefreshCw,
  RotateCcw,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import type { OperationSnapshot } from '../../shared/types';
import dayjs from 'dayjs';
import Modal from '../components/UI/Modal';

const Undo: React.FC = () => {
  const [snapshots, setSnapshots] = useState<OperationSnapshot[]>([]);
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedSnapshot, setSelectedSnapshot] = useState<OperationSnapshot | null>(null);

  const { undo, undoLatest } = useAppStore();

  const fetchSnapshots = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/undo/snapshots?limit=20');
      const data = await response.json();
      if (data.success) {
        setSnapshots(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch snapshots:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSnapshots();
  }, []);

  const handleUndoLatest = async () => {
    if (window.confirm('确定要撤销上次操作吗？')) {
      try {
        await undoLatest();
        alert('撤销成功！');
        fetchSnapshots();
      } catch (err) {
        alert('撤销失败：' + (err as Error).message);
      }
    }
  };

  const handleUndoSnapshot = async () => {
    if (!selectedSnapshot) return;
    setShowConfirm(false);
    try {
      await undo(selectedSnapshot.id);
      alert('撤销成功！');
      fetchSnapshots();
    } catch (err) {
      alert('撤销失败：' + (err as Error).message);
    }
    setSelectedSnapshot(null);
  };

  const getActionIcon = (action: string) => {
    if (action.includes('classify')) return <FileText className="text-primary-600" size={20} />;
    if (action.includes('rename')) return <FileText className="text-accent-600" size={20} />;
    if (action.includes('scan')) return <Clock className="text-emerald-600" size={20} />;
    return <Undo2 className="text-slate-600" size={20} />;
  };

  const getActionLabel = (action: string) => {
    if (action.includes('classify')) return '文件分类';
    if (action.includes('rename')) return '批量重命名';
    if (action.includes('scan')) return '文件扫描';
    return action;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="card bg-gradient-to-r from-primary-50 to-accent-50 border-none">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary-600 flex items-center justify-center flex-shrink-0">
            <RotateCcw className="text-white" size={28} />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-primary-800 mb-1">
              撤销恢复
            </h3>
            <p className="text-sm text-primary-600 mb-4">
              系统会自动记录每次操作的快照，您可以随时撤销之前的操作，恢复文件到之前的状态。
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={handleUndoLatest}
                disabled={snapshots.length === 0}
                className="btn-accent flex items-center gap-2"
              >
                <RotateCcw size={18} />
                撤销上次操作
              </button>
              <button
                onClick={fetchSnapshots}
                className="btn-secondary flex items-center gap-2"
              >
                <RefreshCw className={loading ? 'animate-spin' : ''} size={16} />
                刷新
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">操作历史</h3>
            <p className="text-sm text-slate-500">
              共 {snapshots.length} 条操作记录
            </p>
          </div>
        </div>

        {snapshots.length > 0 ? (
          <div className="space-y-3">
            {snapshots.map((snapshot, index) => (
              <div
                key={snapshot.id}
                className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                  index === 0
                    ? 'bg-primary-50 border-primary-200'
                    : 'bg-white border-slate-200 hover:border-primary-200'
                }`}
              >
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                  {getActionIcon(snapshot.action)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-slate-800">
                      {getActionLabel(snapshot.action)}
                    </h4>
                    {index === 0 && (
                      <span className="badge badge-primary">最近</span>
                    )}
                    {snapshot.status === 'applied' && (
                      <span className="badge badge-success">已生效</span>
                    )}
                    {snapshot.status === 'undone' && (
                      <span className="badge bg-slate-100 text-slate-600">已撤销</span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock size={14} />
                      {dayjs(snapshot.createdAt).format('YYYY-MM-DD HH:mm:ss')}
                    </span>
                    <span>
                      {snapshot.fileCount} 个文件
                    </span>
                  </div>
                  {snapshot.description && (
                    <p className="text-sm text-slate-600 mt-1">
                      {snapshot.description}
                    </p>
                  )}
                </div>
                <div>
                  {snapshot.status === 'applied' ? (
                    <button
                      onClick={() => {
                        setSelectedSnapshot(snapshot);
                        setShowConfirm(true);
                      }}
                      className="btn-secondary text-sm flex items-center gap-2"
                    >
                      <Undo2 size={16} />
                      撤销此操作
                    </button>
                  ) : (
                    <span className="text-slate-400 text-sm">已撤销</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-500">
            <Undo2 className="mx-auto mb-3 opacity-50" size={48} />
            <p>暂无操作记录</p>
            <p className="text-sm">执行文件整理等操作后，快照会自动保存在这里</p>
          </div>
        )}
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">撤销说明</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-50">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="text-success-500" size={18} />
              <h4 className="font-medium text-slate-700">文件移动</h4>
            </div>
            <p className="text-sm text-slate-500">
              撤销时会将文件移回原始位置
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="text-success-500" size={18} />
              <h4 className="font-medium text-slate-700">文件重命名</h4>
            </div>
            <p className="text-sm text-slate-500">
              撤销时会恢复文件的原始名称
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="text-accent-500" size={18} />
              <h4 className="font-medium text-slate-700">注意事项</h4>
            </div>
            <p className="text-sm text-slate-500">
              请确认没有其他程序正在使用这些文件
            </p>
          </div>
        </div>
      </div>

      {showConfirm && (
        <Modal
          isOpen={showConfirm}
          onClose={() => setShowConfirm(false)}
          title="确认撤销"
        >
          <div className="space-y-4">
            <p className="text-slate-600">
              确定要撤销此操作吗？
            </p>
            {selectedSnapshot && (
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="font-medium text-slate-800 mb-1">
                  {getActionLabel(selectedSnapshot.action)}
                </p>
                <p className="text-sm text-slate-500">
                  执行时间：{dayjs(selectedSnapshot.createdAt).format('YYYY-MM-DD HH:mm:ss')}
                </p>
                <p className="text-sm text-slate-500">
                  涉及文件：{selectedSnapshot.fileCount} 个
                </p>
              </div>
            )}
            <div className="bg-warning-50 rounded-lg p-3 text-sm text-warning-700">
              <p>⚠️ 撤销操作将恢复文件恢复到操作前的状态。</p>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={() => setShowConfirm(false)}
                className="btn-secondary"
              >
                取消
              </button>
              <button
                onClick={handleUndoSnapshot}
                className="btn-accent flex items-center gap-2"
              >
                <Undo2 size={16} />
                确认撤销
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Undo;

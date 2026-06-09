import React, { useState } from 'react';
import {
  ListFilter,
  FolderOpen,
  ArrowRight,
  Play,
  Eye,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import FileTypeIcon from '../components/UI/FileTypeIcon';
import { useNavigate } from 'react-router-dom';

const groupByOptions = [
  { value: 'rule', label: '按规则分类' },
  { value: 'type', label: '按文件类型' },
  { value: 'date', label: '按日期' },
  { value: 'extension', label: '按扩展名' },
  { value: 'source', label: '按来源' },
];

const Classification: React.FC = () => {
  const navigate = useNavigate();
  const [groupBy, setGroupBy] = useState('rule');
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    scannedFiles,
    selectedFiles,
    classificationPreview,
    loading,
    generateClassificationPreview,
    executeClassification,
  } = useAppStore();

  const handleGeneratePreview = () => {
    if (scannedFiles.length === 0) {
      alert('请先扫描文件');
      navigate('/scan');
      return;
    }
    generateClassificationPreview(groupBy as any);
  };

  const handleExecute = async () => {
    setShowConfirm(false);
    try {
      await executeClassification();
      alert('分类执行成功！');
    } catch (err) {
      alert('执行失败：' + (err as Error).message);
    }
  };

  const filesToProcess = selectedFiles.length > 0 ? selectedFiles : scannedFiles;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">分类设置</h3>
            <p className="text-sm text-slate-500">
              {filesToProcess.length > 0
                ? `将对 ${filesToProcess.length} 个文件进行分类`
                : '请先扫描文件'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-600">分类方式:</label>
              <select
                className="input-field w-40"
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value)}
              >
                {groupByOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handleGeneratePreview}
              disabled={loading || filesToProcess.length === 0}
              className="btn-primary flex items-center gap-2"
            >
              {loading ? (
                <RefreshCw className="animate-spin" size={16} />
              ) : (
                <Eye size={16} />
              )}
              生成预览
            </button>
          </div>
        </div>

        {filesToProcess.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            <ListFilter className="mx-auto mb-3 opacity-50" size={48} />
            <p>暂无文件可分类</p>
            <button
              onClick={() => navigate('/scan')}
              className="text-primary-600 hover:text-primary-700 text-sm mt-2"
            >
              去扫描文件 →
            </button>
          </div>
        )}
      </div>

      {classificationPreview && (
        <>
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-800">分类预览</h3>
                <p className="text-sm text-slate-500">
                  共 {classificationPreview.totalFiles} 个文件，
                  将被分为 {classificationPreview.groups.length} 组
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleGeneratePreview}
                  className="btn-secondary flex items-center gap-2"
                >
                  <RefreshCw size={16} />
                  重新生成
                </button>
                <button
                  onClick={() => setShowConfirm(true)}
                  className="btn-accent flex items-center gap-2"
                >
                  <Play size={16} />
                  一键执行
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {classificationPreview.groups.map((group, groupIndex) => (
                <div
                  key={groupIndex}
                  className="border border-slate-200 rounded-xl overflow-hidden"
                >
                  <div className="bg-slate-50 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center">
                        <FolderOpen className="text-primary-600" size={18} />
                      </div>
                      <div>
                        <h4 className="font-medium text-slate-800">
                          {group.name}
                        </h4>
                        <p className="text-xs text-slate-500">
                          目标路径: {group.targetFolder}
                        </p>
                      </div>
                    </div>
                    <span className="badge badge-primary">
                      {group.files.length} 个文件
                    </span>
                  </div>
                  <div className="p-4">
                    <div className="grid grid-cols-2 gap-2">
                      {group.files.slice(0, 6).map((file, fileIndex) => (
                        <div
                          key={fileIndex}
                          className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50"
                        >
                          <FileTypeIcon type={file.type} size={16} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-slate-700 truncate">
                              {file.name}
                            </p>
                            <p className="text-xs text-slate-400 truncate">
                              → {file.targetFolder}
                            </p>
                          </div>
                          {classificationPreview.conflicts.some(c => c.fileId === file.id) && (
                            <AlertCircle
                              className="text-warning-500 flex-shrink-0"
                              size={14}
                            />
                          )}
                        </div>
                      ))}
                      {group.files.length > 6 && (
                        <div className="col-span-2 text-center py-2 text-sm text-slate-500">
                          还有 {group.files.length - 6} 个文件...
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {classificationPreview.groups.find(g => g.name === '未分类') && (
              <div className="mt-4 border border-warning-200 bg-warning-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="text-warning-600" size={20} />
                  <h4 className="font-medium text-warning-800">
                    未匹配到规则的文件 ({classificationPreview.groups.find(g => g.name === '未分类')?.files.length || 0})
                  </h4>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {classificationPreview.groups.find(g => g.name === '未分类')?.files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-2 rounded-lg bg-white/50"
                    >
                      <FileTypeIcon type={file.type} size={16} />
                      <span className="text-sm text-slate-700 truncate">
                        {file.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="card bg-gradient-to-r from-primary-50 to-accent-50">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary-600 flex items-center justify-center flex-shrink-0">
                <Sparkles className="text-white" size={24} />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-primary-800 mb-1">
                  准备好执行分类了吗？
                </h4>
                <p className="text-sm text-primary-600 mb-4">
                  执行后，文件将按照预览结果移动到对应的目标文件夹。
                  操作会自动创建快照，支持撤销。
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <CheckCircle2 className="text-success-500" size={16} />
                    自动创建操作快照
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <CheckCircle2 className="text-success-500" size={16} />
                    记录执行日志
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <CheckCircle2 className="text-success-500" size={16} />
                    支持随时撤销
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowConfirm(true)}
                className="btn-accent flex items-center gap-2 text-lg px-6 py-3"
              >
                <Play size={20} />
                一键执行
              </button>
            </div>
          </div>
        </>
      )}

      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-large max-w-md w-full animate-slide-up">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-lg font-semibold text-slate-800">确认执行分类</h3>
            </div>
            <div className="p-6">
              <p className="text-slate-600 mb-4">
                确定要执行文件分类吗？此操作将移动 {classificationPreview?.totalFiles || 0} 个文件。
              </p>
              <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-600">
                <p>• 操作会自动创建快照，可随时撤销</p>
                <p>• 重复文件将自动合并</p>
                <p>• 缺失附件的文件会被标记</p>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="btn-secondary"
              >
                取消
              </button>
              <button
                onClick={handleExecute}
                className="btn-accent flex items-center gap-2"
              >
                <Play size={16} />
                确认执行
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Classification;

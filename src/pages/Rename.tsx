import React, { useState, useEffect } from 'react';
import {
  FileType,
  Eye,
  Play,
  RefreshCw,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import FileTypeIcon from '../components/UI/FileTypeIcon';
import { useNavigate } from 'react-router-dom';

const Rename: React.FC = () => {
  const navigate = useNavigate();
  const [template, setTemplate] = useState('{type}_{date}_{original}');
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    scannedFiles,
    selectedFiles,
    renameRules,
    renamePreview,
    loading,
    fetchRenameRules,
    generateRenamePreview,
    executeRename,
  } = useAppStore();

  useEffect(() => {
    fetchRenameRules();
  }, []);

  const handleGeneratePreview = () => {
    if (scannedFiles.length === 0) {
      alert('请先扫描文件');
      navigate('/scan');
      return;
    }
    generateRenamePreview(template);
  };

  const handleExecute = async () => {
    setShowConfirm(false);
    try {
      await executeRename();
      alert('重命名执行成功！');
    } catch (err) {
      alert('执行失败：' + (err as Error).message);
    }
  };

  const filesToProcess = selectedFiles.length > 0 ? selectedFiles : scannedFiles;

  const templateVariables = [
    { var: '{original}', desc: '原文件名' },
    { var: '{index}', desc: '序号' },
    { var: '{date}', desc: '日期 (YYYY-MM-DD)' },
    { var: '{year}', desc: '年' },
    { var: '{month}', desc: '月' },
    { var: '{day}', desc: '日' },
    { var: '{type}', desc: '文件类型' },
    { var: '{ext}', desc: '扩展名' },
  ];

  const insertVariable = (v: string) => {
    setTemplate(prev => prev + v);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">批量重命名</h3>
            <p className="text-sm text-slate-500">
              {filesToProcess.length > 0
                ? `将对 ${filesToProcess.length} 个文件进行重命名`
                : '请先扫描文件'}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="label">命名模板</label>
            <input
              type="text"
              className="input-field font-mono text-lg"
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              placeholder="例如：{type}_{date}_{original}"
            />
          </div>

          <div>
            <p className="text-sm text-slate-600 mb-2">快速插入变量：</p>
            <div className="flex flex-wrap gap-2">
              {templateVariables.map((v) => (
                <button
                  key={v.var}
                  onClick={() => insertVariable(v.var)}
                  className="px-3 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 rounded-lg font-mono transition-colors"
                  title={v.desc}
                >
                  {v.var}
                  <span className="text-slate-500 ml-1 text-xs">({v.desc})</span>
                </button>
              ))}
            </div>
          </div>

          {renameRules.length > 0 && (
            <div>
              <p className="text-sm text-slate-600 mb-2">或选择预设规则：</p>
              <div className="flex flex-wrap gap-2">
                {renameRules
                  .filter(r => r.isActive)
                  .map((rule) => (
                    <button
                      key={rule.id}
                      onClick={() => setTemplate(rule.template)}
                      className="px-3 py-1.5 text-sm bg-primary-50 hover:bg-primary-100 text-primary-700 rounded-lg transition-colors"
                    >
                      {rule.name}
                    </button>
                  ))}
              </div>
            </div>
          )}

          <div className="pt-4">
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
      </div>

      {renamePreview && (
        <>
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-800">重命名预览</h3>
                <p className="text-sm text-slate-500">
                  共 {renamePreview.items.length} 个文件将被重命名，
                  {renamePreview.conflictCount > 0 && (
                    <span className="text-warning-600 ml-1">
                      检测到 {renamePreview.conflictCount} 个命名冲突
                    </span>
                  )}
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
                  执行重命名
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="table-header">原文件名</th>
                    <th className="table-header">新文件名</th>
                    <th className="table-header">状态</th>
                  </tr>
                </thead>
                <tbody>
                  {renamePreview.items.slice(0, 20).map((item, index) => (
                    <tr key={index} className="table-row">
                      <td className="table-cell">
                        <div className="flex items-center gap-3">
                          <FileTypeIcon type="document" size={18} />
                          <span className="font-mono text-sm">{item.oldName}</span>
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center gap-2">
                          <ArrowRight className="text-slate-400" size={16} />
                          <span className="font-mono text-sm text-primary-600 font-medium">
                            {item.newName}
                          </span>
                        </div>
                      </td>
                      <td className="table-cell">
                        {item.conflict ? (
                          <span className="badge badge-warning flex items-center gap-1">
                            <AlertCircle size={12} />
                            命名冲突
                          </span>
                        ) : (
                          <span className="badge badge-success">准备就绪</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {renamePreview.items.length > 20 && (
                <div className="text-center py-4 text-sm text-slate-500">
                  还有 {renamePreview.items.length - 20} 个文件...
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-large max-w-md w-full animate-slide-up">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-lg font-semibold text-slate-800">确认执行重命名</h3>
            </div>
            <div className="p-6">
              <p className="text-slate-600 mb-4">
                确定要执行批量重命名吗？将重命名 {renamePreview?.items.length || 0} 个文件。
              </p>
              <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-600">
                <p>• 操作会自动创建快照，可随时撤销</p>
                <p>• 命名冲突会自动添加序号后缀</p>
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

export default Rename;

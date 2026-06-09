import React, { useState } from 'react';
import {
  ScanSearch,
  FolderOpen,
  RefreshCw,
  CheckSquare,
  Square,
  AlertTriangle,
  FileWarning,
  Calendar,
  ArrowRight,
  Download,
  Sparkles,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import FileTypeIcon from '../components/UI/FileTypeIcon';
import dayjs from 'dayjs';
import { api, downloadFile } from '../services/api';

const Scan: React.FC = () => {
  const [scanPath, setScanPath] = useState('');
  const [recursive, setRecursive] = useState(true);

  const {
    scannedFiles,
    selectedFiles,
    loading,
    scanDirectory,
    selectFile,
    selectAllFiles,
    clearSelection,
    generateTodos,
  } = useAppStore();

  const handleScan = async () => {
    if (!scanPath.trim()) {
      alert('请输入扫描路径');
      return;
    }
    await scanDirectory(scanPath, recursive);
  };

  const handleQuickScan = async (path: string) => {
    setScanPath(path);
    await scanDirectory(path, recursive);
  };

  const allSelected = scannedFiles.length > 0 && selectedFiles.length === scannedFiles.length;
  const duplicateCount = scannedFiles.filter(f => f.isDuplicate).length;
  const missingAttachmentCount = scannedFiles.filter(f => f.missingAttachments && f.missingAttachments.length > 0).length;
  const hasDeadlineCount = scannedFiles.filter(f => f.deadline).length;

  const handleExport = async () => {
    if (scannedFiles.length === 0) return;
    try {
      const response = await api.export.exportFiles(scannedFiles);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `文件清单_${dayjs().format('YYYYMMDD')}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('导出失败');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const quickPaths = [
    { label: '下载文件夹', path: 'C:/Users/Administrator/Downloads' },
    { label: '桌面', path: 'C:/Users/Administrator/Desktop' },
    { label: '文档', path: 'C:/Users/Administrator/Documents' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">扫描设置</h3>
            <p className="text-sm text-slate-500">选择要扫描的文件夹路径</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-4">
          {quickPaths.map((p) => (
            <button
              key={p.path}
              onClick={() => handleQuickScan(p.path)}
              className="p-4 rounded-xl border border-slate-200 hover:border-primary-300 hover:bg-primary-50 transition-all text-left group"
            >
              <FolderOpen className="text-slate-400 group-hover:text-primary-600 mb-2" size={24} />
              <p className="font-medium text-slate-700">{p.label}</p>
              <p className="text-xs text-slate-400 truncate">{p.path}</p>
            </button>
          ))}
        </div>

        <div className="flex gap-4">
          <div className="flex-1 relative">
            <FolderOpen className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              className="input-field pl-10"
              value={scanPath}
              onChange={(e) => setScanPath(e.target.value)}
              placeholder="输入文件夹路径，例如：C:/Users/Administrator/Downloads"
              onKeyDown={(e) => e.key === 'Enter' && handleScan()}
            />
          </div>
          <label className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-lg cursor-pointer">
            <input
              type="checkbox"
              checked={recursive}
              onChange={(e) => setRecursive(e.target.checked)}
              className="w-4 h-4 text-primary-600 rounded border-slate-300 focus:ring-primary-500"
            />
            <span className="text-sm text-slate-600">递归扫描子目录</span>
          </label>
          <button
            onClick={handleScan}
            disabled={loading}
            className="btn-primary flex items-center gap-2 min-w-[120px] justify-center"
          >
            {loading ? (
              <RefreshCw className="animate-spin" size={18} />
            ) : (
              <ScanSearch size={18} />
            )}
            {loading ? '扫描中...' : '开始扫描'}
          </button>
        </div>
      </div>

      {scannedFiles.length > 0 && (
        <>
          <div className="grid grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-white shadow-soft">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                  <FileWarning className="text-primary-600" size={20} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800">{scannedFiles.length}</p>
                  <p className="text-sm text-slate-500">扫描到文件</p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white shadow-soft">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-warning-100 flex items-center justify-center">
                  <AlertTriangle className="text-warning-600" size={20} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800">{duplicateCount}</p>
                  <p className="text-sm text-slate-500">重复文件</p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white shadow-soft">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent-100 flex items-center justify-center">
                  <FileWarning className="text-accent-600" size={20} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800">{missingAttachmentCount}</p>
                  <p className="text-sm text-slate-500">缺失附件</p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white shadow-soft">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <Calendar className="text-emerald-600" size={20} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800">{hasDeadlineCount}</p>
                  <p className="text-sm text-slate-500">含截止日期</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => selectAllFiles(!allSelected)}
                  className="flex items-center gap-2 text-sm text-slate-600 hover:text-primary-600"
                >
                  {allSelected ? (
                    <CheckSquare className="text-primary-600" size={18} />
                  ) : (
                    <Square size={18} />
                  )}
                  全选
                </button>
                <span className="text-sm text-slate-500">
                  已选择 {selectedFiles.length} / {scannedFiles.length} 个文件
                </span>
              </div>
              <div className="flex items-center gap-2">
                {selectedFiles.length > 0 && (
                  <>
                    <button
                      onClick={clearSelection}
                      className="btn-secondary text-sm"
                    >
                      取消选择
                    </button>
                    <button
                      onClick={generateTodos}
                      className="btn-accent text-sm flex items-center gap-2"
                    >
                      <Sparkles size={16} />
                      生成待办
                    </button>
                  </>
                )}
                <button onClick={handleExport} className="btn-secondary text-sm flex items-center gap-2">
                  <Download size={16} />
                  导出清单
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="table-header w-12"></th>
                    <th className="table-header">文件名</th>
                    <th className="table-header">类型</th>
                    <th className="table-header">大小</th>
                    <th className="table-header">修改时间</th>
                    <th className="table-header">截止日期</th>
                    <th className="table-header">状态</th>
                  </tr>
                </thead>
                <tbody>
                  {scannedFiles.map((file) => {
                    const isSelected = selectedFiles.some(f => f.id === file.id);
                    
                    return (
                      <tr key={file.id} className="table-row">
                        <td className="table-cell">
                          <button
                            onClick={() => selectFile(file, !isSelected)}
                            className="p-1"
                          >
                            {isSelected ? (
                              <CheckSquare className="text-primary-600" size={18} />
                            ) : (
                              <Square className="text-slate-300" size={18} />
                            )}
                          </button>
                        </td>
                        <td className="table-cell">
                          <div className="flex items-center gap-3">
                            <FileTypeIcon type={file.type} size={20} />
                            <div>
                              <p className="font-medium text-slate-800">{file.name}</p>
                              <p className="text-xs text-slate-400 truncate max-w-xs">
                                {file.path}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="table-cell">
                          <span className="badge badge-primary">
                            {file.type}
                          </span>
                        </td>
                        <td className="table-cell text-slate-600">
                          {formatFileSize(file.size)}
                        </td>
                        <td className="table-cell text-slate-600">
                          {dayjs(file.modifiedAt).format('YYYY-MM-DD HH:mm')}
                        </td>
                        <td className="table-cell">
                          {file.deadline ? (
                            <span className={`badge ${
                              dayjs(file.deadline).diff(dayjs(), 'day') <= 1
                                ? 'badge-warning'
                                : 'badge-accent'
                            }`}>
                              {dayjs(file.deadline).format('YYYY-MM-DD')}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="table-cell">
                          <div className="flex items-center gap-1">
                            {file.isDuplicate && (
                              <span className="badge badge-warning" title="重复文件">
                                <AlertTriangle size={12} className="mr-1" />
                                重复
                              </span>
                            )}
                            {file.missingAttachments && file.missingAttachments.length > 0 && (
                              <span className="badge badge-warning" title={`缺失附件: ${file.missingAttachments.join(', ')}`}>
                                缺附件
                              </span>
                            )}
                            {file.source && (
                              <span className="badge badge-primary">
                                {file.source}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={() => window.location.href = '/classification'}
              className="btn-secondary flex items-center gap-2"
            >
              继续分类预览
              <ArrowRight size={16} />
            </button>
            <button
              onClick={() => window.location.href = '/rename'}
              className="btn-accent flex items-center gap-2"
            >
              批量重命名
              <ArrowRight size={16} />
            </button>
          </div>
        </>
      )}

      {scannedFiles.length === 0 && !loading && (
        <div className="card text-center py-16">
          <ScanSearch className="mx-auto text-slate-300 mb-4" size={64} />
          <h3 className="text-xl font-semibold text-slate-600 mb-2">暂无扫描结果</h3>
          <p className="text-slate-500 mb-6">请输入文件夹路径并开始扫描</p>
          <button onClick={handleScan} className="btn-primary">
            开始扫描
          </button>
        </div>
      )}
    </div>
  );
};

export default Scan;

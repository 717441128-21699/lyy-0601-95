import React, { useEffect, useState } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  FolderOpen,
  FileText,
  Calendar,
  Paperclip,
  Tag,
  Save,
  X,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import Modal from '../components/UI/Modal';
import type { ClassificationRule, RenameRule } from '../../shared/types';

const Rules: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'classification' | 'rename'>('classification');
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});

  const {
    classificationRules,
    renameRules,
    fetchClassificationRules,
    fetchRenameRules,
    addClassificationRule,
    updateClassificationRule,
    deleteClassificationRule,
    addRenameRule,
    updateRenameRule,
    deleteRenameRule,
  } = useAppStore();

  useEffect(() => {
    fetchClassificationRules();
    fetchRenameRules();
  }, []);

  const handleAdd = () => {
    setEditingRule(null);
    if (activeTab === 'classification') {
      setFormData({
        name: '',
        type: 'keyword',
        pattern: '',
        targetFolder: '',
        priority: 1,
        isActive: true,
      });
    } else {
      setFormData({
        name: '',
        pattern: '',
        template: '{original}_{index}',
        isActive: true,
      });
    }
    setShowModal(true);
  };

  const handleEdit = (rule: any) => {
    setEditingRule(rule);
    setFormData({ ...rule });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('确定要删除这条规则吗？')) {
      if (activeTab === 'classification') {
        await deleteClassificationRule(id);
      } else {
        await deleteRenameRule(id);
      }
    }
  };

  const handleSubmit = async () => {
    if (activeTab === 'classification') {
      if (editingRule) {
        await updateClassificationRule(editingRule.id, formData);
      } else {
        await addClassificationRule(formData);
      }
    } else {
      if (editingRule) {
        await updateRenameRule(editingRule.id, formData);
      } else {
        await addRenameRule(formData);
      }
    }
    setShowModal(false);
  };

  const classificationTypeOptions = [
    { value: 'keyword', label: '关键词匹配', icon: Tag },
    { value: 'extension', label: '按扩展名', icon: Paperclip },
    { value: 'date', label: '按日期', icon: Calendar },
    { value: 'source', label: '按来源', icon: FolderOpen },
    { value: 'type', label: '按文件类型', icon: FileText },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('classification')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'classification'
                  ? 'bg-primary-800 text-white shadow-soft'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              分类规则
            </button>
            <button
              onClick={() => setActiveTab('rename')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'rename'
                  ? 'bg-primary-800 text-white shadow-soft'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              重命名规则
            </button>
          </div>
          <button onClick={handleAdd} className="btn-primary flex items-center gap-2">
            <Plus size={18} />
            添加规则
          </button>
        </div>

        {activeTab === 'classification' ? (
          <div className="space-y-3">
            {classificationRules.map((rule) => (
              <div
                key={rule.id}
                className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-all group"
              >
                <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                  {(() => {
                    const Icon = classificationTypeOptions.find(o => o.value === rule.type)?.icon || Tag;
                    return <Icon className="text-primary-600" size={20} />;
                  })()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-slate-800">{rule.name}</h4>
                    <span className={`badge ${rule.isActive ? 'badge-success' : 'badge-warning'}`}>
                      {rule.isActive ? '已启用' : '已禁用'}
                    </span>
                    <span className="text-xs text-slate-400">优先级: {rule.priority}</span>
                  </div>
                  <p className="text-sm text-slate-500 mt-1">
                    {rule.type === 'keyword' && `关键词: ${rule.pattern}`}
                    {rule.type === 'extension' && `扩展名: ${rule.pattern}`}
                    {rule.type === 'date' && `日期格式: ${rule.pattern}`}
                    {rule.type === 'source' && `来源: ${rule.pattern}`}
                    {rule.type === 'type' && `文件类型: ${rule.pattern}`}
                    <span className="mx-2">→</span>
                    目标文件夹: {rule.targetFolder}
                  </p>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleEdit(rule)}
                    className="p-2 text-slate-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(rule.id)}
                    className="p-2 text-slate-500 hover:text-warning-600 hover:bg-warning-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}

            {classificationRules.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                <FileText className="mx-auto mb-3 opacity-50" size={48} />
                <p>暂无分类规则</p>
                <p className="text-sm">点击"添加规则"创建第一条规则</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {renameRules.map((rule) => (
              <div
                key={rule.id}
                className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-all group"
              >
                <div className="w-10 h-10 rounded-lg bg-accent-100 flex items-center justify-center">
                  <FileText className="text-accent-600" size={20} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-slate-800">{rule.name}</h4>
                    <span className={`badge ${rule.isActive ? 'badge-success' : 'badge-warning'}`}>
                      {rule.isActive ? '已启用' : '已禁用'}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 mt-1">
                    匹配: {rule.pattern}
                    <span className="mx-2">→</span>
                    模板: <code className="px-2 py-0.5 bg-slate-200 rounded text-slate-700">{rule.template}</code>
                  </p>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleEdit(rule)}
                    className="p-2 text-slate-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(rule.id)}
                    className="p-2 text-slate-500 hover:text-warning-600 hover:bg-warning-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}

            {renameRules.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                <FileText className="mx-auto mb-3 opacity-50" size={48} />
                <p>暂无重命名规则</p>
                <p className="text-sm">点击"添加规则"创建第一条规则</p>
              </div>
            )}
          </div>
        )}
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingRule ? '编辑规则' : '添加规则'}
        width="max-w-2xl"
      >
        <div className="space-y-4">
          <div>
            <label className="label">规则名称</label>
            <input
              type="text"
              className="input-field"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="请输入规则名称"
            />
          </div>

          {activeTab === 'classification' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">规则类型</label>
                  <select
                    className="input-field"
                    value={formData.type || 'keyword'}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  >
                    {classificationTypeOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">优先级</label>
                  <input
                    type="number"
                    className="input-field"
                    value={formData.priority || 1}
                    onChange={(e) => setFormData({ ...formData, priority: Number(e.target.value) })}
                    min="1"
                    max="100"
                  />
                </div>
              </div>

              <div>
                <label className="label">匹配规则</label>
                <input
                  type="text"
                  className="input-field"
                  value={formData.pattern || ''}
                  onChange={(e) => setFormData({ ...formData, pattern: e.target.value })}
                  placeholder={
                    formData.type === 'keyword' ? '例如：发票,合同' :
                    formData.type === 'extension' ? '例如：.pdf,.docx' :
                    formData.type === 'date' ? '例如：YYYY-MM' :
                    formData.type === 'source' ? '例如：邮箱,微信' :
                    '例如：invoice,contract'
                  }
                />
              </div>

              <div>
                <label className="label">目标文件夹</label>
                <input
                  type="text"
                  className="input-field"
                  value={formData.targetFolder || ''}
                  onChange={(e) => setFormData({ ...formData, targetFolder: e.target.value })}
                  placeholder="例如：/Documents/发票"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive ?? true}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-primary-600 rounded border-slate-300 focus:ring-primary-500"
                />
                <label htmlFor="isActive" className="text-sm text-slate-700">
                  启用此规则
                </label>
              </div>
            </>
          )}

          {activeTab === 'rename' && (
            <>
              <div>
                <label className="label">匹配文件（支持通配符）</label>
                <input
                  type="text"
                  className="input-field"
                  value={formData.pattern || ''}
                  onChange={(e) => setFormData({ ...formData, pattern: e.target.value })}
                  placeholder="例如：*.pdf, invoice_*"
                />
              </div>

              <div>
                <label className="label">命名模板</label>
                <input
                  type="text"
                  className="input-field font-mono"
                  value={formData.template || ''}
                  onChange={(e) => setFormData({ ...formData, template: e.target.value })}
                  placeholder="例如：{type}_{date}_{original}"
                />
                <p className="text-xs text-slate-500 mt-1">
                  支持变量: {'{original}'} 原名, {'{index}'} 序号, {'{date}'} 日期, {'{year}'} 年, {'{month}'} 月, {'{day}'} 日, {'{type}'} 类型, {'{ext}'} 扩展名
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="renameActive"
                  checked={formData.isActive ?? true}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-primary-600 rounded border-slate-300 focus:ring-primary-500"
                />
                <label htmlFor="renameActive" className="text-sm text-slate-700">
                  启用此规则
                </label>
              </div>
            </>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button onClick={() => setShowModal(false)} className="btn-secondary">
              取消
            </button>
            <button onClick={handleSubmit} className="btn-primary flex items-center gap-2">
              <Save size={16} />
              保存
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Rules;

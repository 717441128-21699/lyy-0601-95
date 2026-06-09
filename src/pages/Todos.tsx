import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Plus,
  Filter,
  Calendar,
  Clock,
  AlertTriangle,
  Trash2,
  Edit2,
  Sparkles,
  Flag,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import type { TodoItem } from '../../shared/types';
import dayjs from 'dayjs';
import Modal from '../components/UI/Modal';

const Todos: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed' | 'cancelled'>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingTodo, setEditingTodo] = useState<TodoItem | null>(null);
  const [formData, setFormData] = useState<any>({});

  const {
    todos,
    scannedFiles,
    loading,
    fetchTodos,
    addTodo,
    updateTodoStatus,
    updateTodo,
    deleteTodo,
    generateTodos,
  } = useAppStore();

  useEffect(() => {
    fetchTodos(filter !== 'all' ? filter : undefined);
  }, [filter]);

  const filteredTodos = todos.filter(t => {
    if (filter === 'all') return true;
    return t.status === filter;
  });

  const handleAdd = () => {
    setEditingTodo(null);
    setFormData({
      title: '',
      description: '',
      priority: 'medium' as TodoItem['priority'],
      status: 'pending' as TodoItem['status'],
      deadline: dayjs().add(1, 'day').format('YYYY-MM-DDTHH:mm'),
    });
    setShowModal(true);
  };

  const handleEdit = (todo: TodoItem) => {
    setEditingTodo(todo);
    setFormData({ ...todo });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (editingTodo) {
      await updateTodo(editingTodo.id, formData);
    } else {
      await addTodo(formData);
    }
    setShowModal(false);
    fetchTodos(filter !== 'all' ? filter : undefined);
  };

  const handleGenerate = async () => {
    if (scannedFiles.length === 0) {
      alert('请先扫描文件');
      return;
    }
    await generateTodos();
  };

  const getPriorityColor = (priority: TodoItem['priority']) => {
    switch (priority) {
      case 'high': return 'bg-warning-500';
      case 'medium': return 'bg-accent-500';
      case 'low': return 'bg-slate-400';
    }
  };

  const getPriorityText = (priority: TodoItem['priority']) => {
    switch (priority) {
      case 'high': return '高';
      case 'medium': return '中';
      case 'low': return '低';
    }
  };

  const getStatusBadge = (status: TodoItem['status']) => {
    switch (status) {
      case 'pending': return <span className="badge badge-warning">待处理</span>;
      case 'in_progress': return <span className="badge badge-accent">处理中</span>;
      case 'completed': return <span className="badge badge-success">已完成</span>;
      case 'cancelled': return <span className="badge bg-slate-100 text-slate-600">已取消</span>;
    }
  };

  const stats = {
    all: todos.length,
    pending: todos.filter(t => t.status === 'pending').length,
    completed: todos.filter(t => t.status === 'completed').length,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">待办事项</h3>
            <p className="text-sm text-slate-500">管理您的待办事项和提醒</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleGenerate}
              className="btn-secondary flex items-center gap-2"
            >
              <Sparkles size={16} />
              从文件生成
            </button>
            <button onClick={handleAdd} className="btn-primary flex items-center gap-2">
              <Plus size={16} />
              新建待办
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-6">
          {(['all', 'pending', 'completed', 'cancelled'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filter === f
                  ? 'bg-primary-800 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {f === 'all' && '全部'}
              {f === 'pending' && '待处理'}
              {f === 'completed' && '已完成'}
              {f === 'cancelled' && '已取消'}
              <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                filter === f ? 'bg-white/20' : 'bg-slate-200'
              }`}>
                {f === 'all' ? stats.all : f === 'pending' ? stats.pending : stats.completed}
              </span>
            </button>
          ))}
        </div>

        {filteredTodos.length > 0 ? (
          <div className="space-y-3">
            {filteredTodos.map((todo) => {
              const isOverdue = todo.deadline && dayjs(todo.deadline).isBefore(dayjs()) && todo.status !== 'completed';
              const isToday = todo.deadline && dayjs(todo.deadline).isSame(dayjs(), 'day');
              
              return (
                <div
                  key={todo.id}
                  className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${
                    todo.status === 'completed'
                      ? 'bg-slate-50 border-slate-200 opacity-75'
                      : isOverdue
                      ? 'bg-warning-50 border-warning-200'
                      : 'bg-white border-slate-200 hover:border-primary-200'
                  }`}
                >
                  <button
                    onClick={() => updateTodoStatus(
                      todo.id,
                      todo.status === 'completed' ? 'pending' : 'completed'
                    )}
                    className="mt-1"
                  >
                    {todo.status === 'completed' ? (
                      <CheckSquare className="text-success-500" size={22} />
                    ) : (
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        todo.priority === 'high' ? 'border-warning-500' :
                        todo.priority === 'medium' ? 'border-accent-500' : 'border-slate-300'
                      }`}>
                        <div className={`w-2.5 h-2.5 rounded-full ${getPriorityColor(todo.priority)}`} />
                      </div>
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className={`font-medium ${
                        todo.status === 'completed' ? 'line-through text-slate-500' : 'text-slate-800'
                      }`}>
                        {todo.title}
                      </h4>
                      {getStatusBadge(todo.status)}
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Flag size={12} className={
                          todo.priority === 'high' ? 'text-warning-500' :
                          todo.priority === 'medium' ? 'text-accent-500' : 'text-slate-400'
                        } />
                        {getPriorityText(todo.priority)}优先级
                      </span>
                    </div>
                    {todo.description && (
                      <p className={`text-sm ${
                        todo.status === 'completed' ? 'text-slate-400' : 'text-slate-600'
                      }`}>
                        {todo.description}
                      </p>
                    )}
                    {todo.deadline && (
                      <div className={`flex items-center gap-1 mt-2 text-xs ${
                        isOverdue ? 'text-warning-600 font-medium' :
                        isToday ? 'text-accent-600 font-medium' : 'text-slate-500'
                      }`}>
                        {isOverdue ? <AlertTriangle size={12} /> : <Calendar size={12} />}
                        {isOverdue ? '已过期 - ' : isToday ? '今天 - ' : ''}
                        {dayjs(todo.deadline).format('YYYY-MM-DD HH:mm')}
                      </div>
                    )}
                    {todo.relatedFileName && (
                      <p className="text-xs text-slate-400 mt-1">
                        关联文件: {todo.relatedFileName}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEdit(todo)}
                      className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('确定要删除这条待办吗？')) {
                          deleteTodo(todo.id);
                        }
                      }}
                      className="p-2 text-slate-400 hover:text-warning-600 hover:bg-warning-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-500">
            <CheckSquare className="mx-auto mb-3 opacity-50" size={48} />
            <p>暂无待办事项</p>
            <p className="text-sm">点击"新建待办"或"从文件生成"创建待办</p>
          </div>
        )}
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingTodo ? '编辑待办' : '新建待办'}
      >
        <div className="space-y-4">
          <div>
            <label className="label">标题</label>
            <input
              type="text"
              className="input-field"
              value={formData.title || ''}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="请输入待办标题"
            />
          </div>

          <div>
            <label className="label">描述</label>
            <textarea
              className="input-field min-h-[80px]"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="请输入待办描述"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">优先级</label>
              <select
                className="input-field"
                value={formData.priority || 'medium'}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              >
                <option value="low">低</option>
                <option value="medium">中</option>
                <option value="high">高</option>
              </select>
            </div>
            <div>
              <label className="label">状态</label>
              <select
                className="input-field"
                value={formData.status || 'pending'}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="pending">待处理</option>
                <option value="in_progress">处理中</option>
                <option value="completed">已完成</option>
                <option value="cancelled">已取消</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label">截止日期</label>
            <input
              type="datetime-local"
              className="input-field"
              value={formData.deadline || ''}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button onClick={() => setShowModal(false)} className="btn-secondary">
              取消
            </button>
            <button onClick={handleSubmit} className="btn-primary">
              保存
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Todos;

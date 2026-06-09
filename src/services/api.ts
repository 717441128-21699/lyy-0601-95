import type {
  ApiResponse,
  FileInfo,
  ScanResult,
  ClassificationRule,
  ClassificationPreview,
  RenameRule,
  RenamePreview,
  TodoItem,
  ExecutionLog,
  OperationSnapshot,
  ScheduledTask,
  DashboardStats,
  Settings,
  IgnoreRule,
} from '../../shared/types';

const BASE_URL = '/api';

async function request<T>(
  url: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const response = await fetch(`${BASE_URL}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: '请求失败' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

export const api = {
  dashboard: {
    getStats: () => request<DashboardStats>('/dashboard/stats'),
  },

  scan: {
    scanDirectory: (path: string, recursive = true) =>
      request<ScanResult>(`/scan?path=${encodeURIComponent(path)}&recursive=${recursive}`),
  },

  classification: {
    getRules: () => request<ClassificationRule[]>('/classification/rules'),
    addRule: (rule: Omit<ClassificationRule, 'id' | 'createdAt' | 'updatedAt'>) =>
      request<ClassificationRule>('/classification/rules', {
        method: 'POST',
        body: JSON.stringify(rule),
      }),
    updateRule: (id: string, rule: Partial<ClassificationRule>) =>
      request<ClassificationRule>(`/classification/rules/${id}`, {
        method: 'PUT',
        body: JSON.stringify(rule),
      }),
    deleteRule: (id: string) =>
      request<boolean>(`/classification/rules/${id}`, {
        method: 'DELETE',
      }),
    preview: (files: FileInfo[], groupBy = 'rule') =>
      request<ClassificationPreview>('/classification/preview', {
        method: 'POST',
        body: JSON.stringify({ files, groupBy }),
      }),
    execute: (preview: ClassificationPreview) =>
      request<any>('/classification/execute', {
        method: 'POST',
        body: JSON.stringify(preview),
      }),
  },

  rename: {
    getRules: () => request<RenameRule[]>('/rename/rules'),
    addRule: (rule: Omit<RenameRule, 'id' | 'createdAt' | 'updatedAt'>) =>
      request<RenameRule>('/rename/rules', {
        method: 'POST',
        body: JSON.stringify(rule),
      }),
    updateRule: (id: string, rule: Partial<RenameRule>) =>
      request<RenameRule>(`/rename/rules/${id}`, {
        method: 'PUT',
        body: JSON.stringify(rule),
      }),
    deleteRule: (id: string) =>
      request<boolean>(`/rename/rules/${id}`, {
        method: 'DELETE',
      }),
    preview: (files: FileInfo[], template?: string) =>
      request<RenamePreview>('/rename/preview', {
        method: 'POST',
        body: JSON.stringify({ files, template }),
      }),
    execute: (preview: RenamePreview) =>
      request<any>('/rename/execute', {
        method: 'POST',
        body: JSON.stringify(preview),
      }),
  },

  todos: {
    getTodos: (status?: string, limit?: number) => {
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      if (limit) params.append('limit', String(limit));
      return request<TodoItem[]>(`/todos?${params.toString()}`);
    },
    addTodo: (todo: Omit<TodoItem, 'id' | 'createdAt' | 'updatedAt'>) =>
      request<TodoItem>('/todos', {
        method: 'POST',
        body: JSON.stringify(todo),
      }),
    generateTodos: (files: FileInfo[]) =>
      request<TodoItem[]>('/todos/generate', {
        method: 'POST',
        body: JSON.stringify({ files }),
      }),
    updateStatus: (id: string, status: TodoItem['status']) =>
      request<TodoItem>(`/todos/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      }),
    updateTodo: (id: string, updates: Partial<TodoItem>) =>
      request<TodoItem>(`/todos/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      }),
    deleteTodo: (id: string) =>
      request<boolean>(`/todos/${id}`, {
        method: 'DELETE',
      }),
  },

  logs: {
    getLogs: (limit?: number) => {
      const params = limit ? `?limit=${limit}` : '';
      return request<ExecutionLog[]>(`/logs${params}`);
    },
    getRecent: (limit = 10) =>
      request<ExecutionLog[]>(`/logs/recent?limit=${limit}`),
  },

  undo: {
    getSnapshots: (limit = 10) =>
      request<OperationSnapshot[]>(`/undo/snapshots?limit=${limit}`),
    getLatest: () => request<OperationSnapshot>('/undo/latest'),
    undo: (snapshotId: string) =>
      request<any>(`/undo/${snapshotId}`, {
        method: 'POST',
      }),
    undoLatest: () =>
      request<any>('/undo', {
        method: 'POST',
      }),
  },

  export: {
    exportLogs: (startDate?: string, endDate?: string) => {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      return fetch(`${BASE_URL}/export/logs?${params.toString()}`);
    },
    exportFiles: (files: FileInfo[]) =>
      fetch(`${BASE_URL}/export/files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files }),
      }),
    exportTodos: (status?: string) => {
      const params = status ? `?status=${status}` : '';
      return fetch(`${BASE_URL}/export/todos${params}`);
    },
    exportProcessingList: (files: FileInfo[], action: string) =>
      fetch(`${BASE_URL}/export/processing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files, action }),
      }),
  },

  schedule: {
    getTasks: () => request<ScheduledTask[]>('/schedule/tasks'),
    addTask: (task: Omit<ScheduledTask, 'id' | 'createdAt'>) =>
      request<ScheduledTask>('/schedule/tasks', {
        method: 'POST',
        body: JSON.stringify(task),
      }),
    updateTask: (id: string, updates: Partial<ScheduledTask>) =>
      request<ScheduledTask>(`/schedule/tasks/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      }),
    deleteTask: (id: string) =>
      request<boolean>(`/schedule/tasks/${id}`, {
        method: 'DELETE',
      }),
    runTaskNow: (id: string) =>
      request<void>(`/schedule/tasks/${id}/run`, {
        method: 'POST',
      }),
  },

  settings: {
    getSettings: () => request<Partial<Settings>>('/settings'),
    updateSettings: (updates: Partial<Settings>) =>
      request<void>('/settings', {
        method: 'PUT',
        body: JSON.stringify(updates),
      }),
    getIgnoreRules: () => request<IgnoreRule[]>('/settings/ignore-rules'),
    addIgnoreRule: (rule: Omit<IgnoreRule, 'id' | 'createdAt'>) =>
      request<IgnoreRule>('/settings/ignore-rules', {
        method: 'POST',
        body: JSON.stringify(rule),
      }),
    updateIgnoreRule: (id: string, updates: Partial<IgnoreRule>) =>
      request<IgnoreRule>(`/settings/ignore-rules/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      }),
    deleteIgnoreRule: (id: string) =>
      request<boolean>(`/settings/ignore-rules/${id}`, {
        method: 'DELETE',
      }),
  },
};

export function downloadFile(response: Response, filename: string) {
  const blob = response.blob();
  const url = URL.createObjectURL(blob as any);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

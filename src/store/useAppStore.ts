import { create } from 'zustand';
import type {
  FileInfo,
  ClassificationRule,
  RenameRule,
  TodoItem,
  ExecutionLog,
  DashboardStats,
  ClassificationPreview,
  RenamePreview,
  ScheduledTask,
  Settings,
  IgnoreRule,
} from '../../shared/types';
import { api } from '../services/api';

interface AppState {
  loading: boolean;
  error: string | null;
  scannedFiles: FileInfo[];
  classificationRules: ClassificationRule[];
  renameRules: RenameRule[];
  ignoreRules: IgnoreRule[];
  todos: TodoItem[];
  logs: ExecutionLog[];
  scheduledTasks: ScheduledTask[];
  classificationPreview: ClassificationPreview | null;
  renamePreview: RenamePreview | null;
  dashboardStats: DashboardStats | null;
  settings: Partial<Settings>;
  selectedFiles: FileInfo[];

  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  selectFile: (file: FileInfo, selected: boolean) => void;
  selectAllFiles: (selected: boolean) => void;
  clearSelection: () => void;

  fetchDashboardStats: () => Promise<void>;
  scanDirectory: (path: string, recursive?: boolean) => Promise<void>;

  fetchClassificationRules: () => Promise<void>;
  addClassificationRule: (rule: Omit<ClassificationRule, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateClassificationRule: (id: string, rule: Partial<ClassificationRule>) => Promise<void>;
  deleteClassificationRule: (id: string) => Promise<void>;
  generateClassificationPreview: (groupBy?: string) => Promise<void>;
  executeClassification: () => Promise<any>;

  fetchRenameRules: () => Promise<void>;
  addRenameRule: (rule: Omit<RenameRule, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateRenameRule: (id: string, rule: Partial<RenameRule>) => Promise<void>;
  deleteRenameRule: (id: string) => Promise<void>;
  generateRenamePreview: (template?: string) => Promise<void>;
  executeRename: () => Promise<any>;

  fetchTodos: (status?: string) => Promise<void>;
  generateTodos: () => Promise<void>;
  addTodo: (todo: Omit<TodoItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTodoStatus: (id: string, status: TodoItem['status']) => Promise<void>;
  updateTodo: (id: string, updates: Partial<TodoItem>) => Promise<void>;
  deleteTodo: (id: string) => Promise<void>;

  fetchLogs: (limit?: number) => Promise<void>;

  undoLatest: () => Promise<any>;
  undo: (snapshotId: string) => Promise<any>;

  fetchScheduledTasks: () => Promise<void>;
  addScheduledTask: (task: Omit<ScheduledTask, 'id' | 'createdAt'>) => Promise<void>;
  updateScheduledTask: (id: string, updates: Partial<ScheduledTask>) => Promise<void>;
  deleteScheduledTask: (id: string) => Promise<void>;
  runScheduledTask: (id: string) => Promise<void>;

  fetchSettings: () => Promise<void>;
  updateSettings: (updates: Partial<Settings>) => Promise<void>;
  fetchIgnoreRules: () => Promise<void>;
  addIgnoreRule: (rule: Omit<IgnoreRule, 'id' | 'createdAt'>) => Promise<void>;
  updateIgnoreRule: (id: string, updates: Partial<IgnoreRule>) => Promise<void>;
  deleteIgnoreRule: (id: string) => Promise<void>;

  resetState: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  loading: false,
  error: null,
  scannedFiles: [],
  classificationRules: [],
  renameRules: [],
  ignoreRules: [],
  todos: [],
  logs: [],
  scheduledTasks: [],
  classificationPreview: null,
  renamePreview: null,
  dashboardStats: null,
  settings: {},
  selectedFiles: [],

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  selectFile: (file, selected) => {
    set((state) => ({
      selectedFiles: selected
        ? [...state.selectedFiles, file]
        : state.selectedFiles.filter((f) => f.id !== file.id),
    }));
  },

  selectAllFiles: (selected) => {
    set({
      selectedFiles: selected ? [...get().scannedFiles] : [],
    });
  },

  clearSelection: () => set({ selectedFiles: [] }),

  fetchDashboardStats: async () => {
    try {
      set({ loading: true, error: null });
      const response = await api.dashboard.getStats();
      if (response.success) {
        set({ dashboardStats: response.data });
      }
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  scanDirectory: async (path, recursive = true) => {
    try {
      set({ loading: true, error: null });
      const response = await api.scan.scanDirectory(path, recursive);
      if (response.success) {
        set({
          scannedFiles: response.data.files,
          selectedFiles: [],
        });
      }
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  fetchClassificationRules: async () => {
    try {
      const response = await api.classification.getRules();
      if (response.success) {
        set({ classificationRules: response.data });
      }
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  addClassificationRule: async (rule) => {
    try {
      const response = await api.classification.addRule(rule);
      if (response.success) {
        set((state) => ({
          classificationRules: [...state.classificationRules, response.data],
        }));
      }
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  updateClassificationRule: async (id, rule) => {
    try {
      const response = await api.classification.updateRule(id, rule);
      if (response.success) {
        set((state) => ({
          classificationRules: state.classificationRules.map((r) =>
            r.id === id ? response.data : r
          ),
        }));
      }
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  deleteClassificationRule: async (id) => {
    try {
      const response = await api.classification.deleteRule(id);
      if (response.success) {
        set((state) => ({
          classificationRules: state.classificationRules.filter((r) => r.id !== id),
        }));
      }
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  generateClassificationPreview: async (groupBy = 'rule') => {
    try {
      set({ loading: true, error: null });
      const files = get().selectedFiles.length > 0 ? get().selectedFiles : get().scannedFiles;
      const response = await api.classification.preview(files, groupBy as any);
      if (response.success) {
        set({ classificationPreview: response.data });
      }
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  executeClassification: async () => {
    try {
      set({ loading: true, error: null });
      const preview = get().classificationPreview;
      if (!preview) throw new Error('请先生成预览');
      
      const response = await api.classification.execute(preview);
      if (response.success) {
        set({ classificationPreview: null });
        await get().fetchDashboardStats();
        await get().fetchLogs();
        return response.data;
      }
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  fetchRenameRules: async () => {
    try {
      const response = await api.rename.getRules();
      if (response.success) {
        set({ renameRules: response.data });
      }
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  addRenameRule: async (rule) => {
    try {
      const response = await api.rename.addRule(rule);
      if (response.success) {
        set((state) => ({
          renameRules: [...state.renameRules, response.data],
        }));
      }
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  updateRenameRule: async (id, rule) => {
    try {
      const response = await api.rename.updateRule(id, rule);
      if (response.success) {
        set((state) => ({
          renameRules: state.renameRules.map((r) =>
            r.id === id ? response.data : r
          ),
        }));
      }
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  deleteRenameRule: async (id) => {
    try {
      const response = await api.rename.deleteRule(id);
      if (response.success) {
        set((state) => ({
          renameRules: state.renameRules.filter((r) => r.id !== id),
        }));
      }
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  generateRenamePreview: async (template) => {
    try {
      set({ loading: true, error: null });
      const files = get().selectedFiles.length > 0 ? get().selectedFiles : get().scannedFiles;
      const response = await api.rename.preview(files, template);
      if (response.success) {
        set({ renamePreview: response.data });
      }
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  executeRename: async () => {
    try {
      set({ loading: true, error: null });
      const preview = get().renamePreview;
      if (!preview) throw new Error('请先生成预览');
      
      const response = await api.rename.execute(preview);
      if (response.success) {
        set({ renamePreview: null });
        await get().fetchDashboardStats();
        await get().fetchLogs();
        return response.data;
      }
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  fetchTodos: async (status) => {
    try {
      const response = await api.todos.getTodos(status);
      if (response.success) {
        set({ todos: response.data });
      }
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  generateTodos: async () => {
    try {
      set({ loading: true, error: null });
      const files = get().selectedFiles.length > 0 ? get().selectedFiles : get().scannedFiles;
      const response = await api.todos.generateTodos(files);
      if (response.success) {
        set((state) => ({
          todos: [...state.todos, ...response.data.filter(t => !state.todos.find(st => st.id === t.id))],
        }));
        await get().fetchDashboardStats();
      }
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  addTodo: async (todo) => {
    try {
      const response = await api.todos.addTodo(todo);
      if (response.success) {
        set((state) => ({
          todos: [response.data, ...state.todos],
        }));
        await get().fetchDashboardStats();
      }
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  updateTodoStatus: async (id, status) => {
    try {
      const response = await api.todos.updateStatus(id, status);
      if (response.success) {
        set((state) => ({
          todos: state.todos.map((t) =>
            t.id === id ? response.data : t
          ),
        }));
        await get().fetchDashboardStats();
      }
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  updateTodo: async (id, updates) => {
    try {
      const response = await api.todos.updateTodo(id, updates);
      if (response.success) {
        set((state) => ({
          todos: state.todos.map((t) =>
            t.id === id ? response.data : t
          ),
        }));
      }
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  deleteTodo: async (id) => {
    try {
      const response = await api.todos.deleteTodo(id);
      if (response.success) {
        set((state) => ({
          todos: state.todos.filter((t) => t.id !== id),
        }));
        await get().fetchDashboardStats();
      }
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  fetchLogs: async (limit) => {
    try {
      const response = await api.logs.getLogs(limit);
      if (response.success) {
        set({ logs: response.data });
      }
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  undoLatest: async () => {
    try {
      set({ loading: true, error: null });
      const response = await api.undo.undoLatest();
      if (response.success) {
        await get().fetchDashboardStats();
        await get().fetchLogs();
        return response.data;
      }
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  undo: async (snapshotId) => {
    try {
      set({ loading: true, error: null });
      const response = await api.undo.undo(snapshotId);
      if (response.success) {
        await get().fetchDashboardStats();
        await get().fetchLogs();
        return response.data;
      }
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  fetchScheduledTasks: async () => {
    try {
      const response = await api.schedule.getTasks();
      if (response.success) {
        set({ scheduledTasks: response.data });
      }
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  addScheduledTask: async (task) => {
    try {
      const response = await api.schedule.addTask(task);
      if (response.success) {
        set((state) => ({
          scheduledTasks: [...state.scheduledTasks, response.data],
        }));
      }
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  updateScheduledTask: async (id, updates) => {
    try {
      const response = await api.schedule.updateTask(id, updates);
      if (response.success) {
        set((state) => ({
          scheduledTasks: state.scheduledTasks.map((t) =>
            t.id === id ? response.data : t
          ),
        }));
      }
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  deleteScheduledTask: async (id) => {
    try {
      const response = await api.schedule.deleteTask(id);
      if (response.success) {
        set((state) => ({
          scheduledTasks: state.scheduledTasks.filter((t) => t.id !== id),
        }));
      }
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  runScheduledTask: async (id) => {
    try {
      const response = await api.schedule.runTaskNow(id);
      if (response.success && response.data) {
        set((state) => ({
          scheduledTasks: state.scheduledTasks.map((t) =>
            t.id === id ? response.data : t
          ),
        }));
      }
      await get().fetchDashboardStats();
      await get().fetchLogs();
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  fetchSettings: async () => {
    try {
      const response = await api.settings.getSettings();
      if (response.success) {
        set({ settings: response.data });
      }
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  updateSettings: async (updates) => {
    try {
      await api.settings.updateSettings(updates);
      set((state) => ({
        settings: { ...state.settings, ...updates },
      }));
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  fetchIgnoreRules: async () => {
    try {
      const response = await api.settings.getIgnoreRules();
      if (response.success) {
        set({ ignoreRules: response.data });
      }
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  addIgnoreRule: async (rule) => {
    try {
      const response = await api.settings.addIgnoreRule(rule);
      if (response.success) {
        set((state) => ({
          ignoreRules: [...state.ignoreRules, response.data],
        }));
      }
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  updateIgnoreRule: async (id, updates) => {
    try {
      const response = await api.settings.updateIgnoreRule(id, updates);
      if (response.success) {
        set((state) => ({
          ignoreRules: state.ignoreRules.map((r) =>
            r.id === id ? response.data : r
          ),
        }));
      }
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  deleteIgnoreRule: async (id) => {
    try {
      const response = await api.settings.deleteIgnoreRule(id);
      if (response.success) {
        set((state) => ({
          ignoreRules: state.ignoreRules.filter((r) => r.id !== id),
        }));
      }
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  resetState: () => {
    set({
      scannedFiles: [],
      classificationPreview: null,
      renamePreview: null,
      selectedFiles: [],
    });
  },
}));

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export type FileType = 'invoice' | 'contract' | 'notice' | 'other' | 'document' | 'spreadsheet' | 'image' | 'video' | 'audio' | 'archive' | 'code' | 'unknown';

export type TodoPriority = 'low' | 'medium' | 'high';

export type TodoStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export type LogStatus = 'success' | 'warning' | 'error';

export type LogLevel = 'info' | 'warning' | 'error';

export type RuleType = 'classification' | 'rename' | 'ignore';

export type ClassificationRuleType = 'keyword' | 'extension' | 'date' | 'source' | 'type';

export type SnapshotStatus = 'applied' | 'undone';

export type ScheduledTaskType = 'scan' | 'classify' | 'scan_and_classify' | 'full';

export interface FileInfo {
  id: string;
  name: string;
  path: string;
  originalPath: string;
  size: number;
  extension: string;
  createdAt: string;
  modifiedAt: string;
  type: FileType;
  source?: string;
  deadline?: string;
  isDuplicate?: boolean;
  duplicateOf?: string;
  duplicateGroupId?: string;
  toDelete?: boolean;
  missingAttachments?: string[];
  targetFolder?: string;
  newName?: string;
}

export interface DuplicateGroup {
  groupId: string;
  files: FileInfo[];
  keepFile: FileInfo;
  toDelete: FileInfo[];
}

export interface ClassificationRule {
  id: string;
  name: string;
  type: ClassificationRuleType;
  pattern: string;
  targetFolder: string;
  isActive: boolean;
  priority: number;
  conditions: {
    source?: string;
    filenamePattern?: string;
    dateRange?: { start: string; end: string };
    extensions?: string[];
    fileType?: FileType;
  };
  createdAt: string;
  updatedAt: string;
}

export interface RenameRule {
  id: string;
  name: string;
  pattern: string;
  template: string;
  isActive: boolean;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IgnoreRule {
  id: string;
  name: string;
  pattern: string;
  type: 'filename' | 'extension' | 'folder';
  isActive: boolean;
  enabled: boolean;
  createdAt: string;
}

export interface TodoItem {
  id: string;
  title: string;
  description: string;
  deadline?: string;
  priority: TodoPriority;
  status: TodoStatus;
  relatedFileId?: string;
  relatedFileName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExecutionLog {
  id: string;
  action: string;
  level: LogLevel;
  message: string;
  timestamp: string;
  filesAffected: number;
  status: LogStatus;
  details: string;
  snapshotId?: string;
}

export interface OperationSnapshot {
  id: string;
  action: string;
  status: SnapshotStatus;
  description: string;
  createdAt: string;
  fileCount: number;
  timestamp: string;
  fileStates: FileInfo[];
  changes: Array<{
    fileId: string;
    oldPath: string;
    newPath: string;
    oldName: string;
    newName: string;
  }>;
}

export interface ScheduledTask {
  id: string;
  name: string;
  type: ScheduledTaskType;
  cronExpression: string;
  targetPath: string;
  isEnabled: boolean;
  lastRunAt?: string;
  action: 'scan' | 'classify' | 'scan_and_classify' | 'full';
  sourcePath: string;
  enabled: boolean;
  lastRun?: string;
  nextRun?: string;
  status?: 'pending' | 'running' | 'completed' | 'failed';
  lastError?: string;
  createdAt: string;
}

export interface ScanResult {
  files: FileInfo[];
  totalCount: number;
  duplicates: number;
  missingAttachments: number;
}

export interface ClassificationPreview {
  files: FileInfo[];
  totalFiles: number;
  duplicateGroups: DuplicateGroup[];
  groups: Array<{
    name: string;
    files: FileInfo[];
    targetFolder: string;
  }>;
  targetFolders: string[];
  conflicts: Array<{
    fileId: string;
    targetPath: string;
    existingFile: string;
  }>;
}

export interface RenamePreview {
  items: Array<{
    id: string;
    oldName: string;
    newName: string;
    path: string;
    conflict: boolean;
  }>;
  conflictCount: number;
  files: Array<{
    id: string;
    oldName: string;
    newName: string;
    path: string;
    conflict: boolean;
  }>;
}

export interface DashboardStats {
  totalFiles: number;
  pendingTodos: number;
  todayProcessed: number;
  todayOperations: number;
  successRate: number;
  duplicateFiles: number;
  fileTypes: Record<FileType, number>;
  fileTypeStats: Array<{ type: FileType; count: number; label: string }>;
  recentActivity: ExecutionLog[];
  upcomingTodos: TodoItem[];
}

export interface Settings {
  defaultInboxPath: string;
  defaultOutputPath: string;
  notificationEnabled: boolean;
  deadlineReminder: boolean;
  autoBackup: boolean;
  confirmBeforeAction: boolean;
  logRetentionDays: number;
  snapshotRetentionCount: number;
  defaultSourcePath: string;
  defaultTargetPath: string;
  enableNotifications: boolean;
  backupPath: string;
  theme: 'light' | 'dark';
}

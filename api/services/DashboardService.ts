import type { DashboardStats, FileType } from '../../shared/types';
import { FileRecordRepository } from '../repositories/FileRecordRepository';
import { TodoRepository } from '../repositories/TodoRepository';
import { ExecutionLogRepository } from '../repositories/ExecutionLogRepository';

const fileTypeLabels: Record<FileType, string> = {
  invoice: '发票',
  contract: '合同',
  notice: '通知',
  document: '文档',
  spreadsheet: '表格',
  image: '图片',
  video: '视频',
  audio: '音频',
  archive: '压缩包',
  code: '代码',
  other: '其他',
  unknown: '未知',
};

export class DashboardService {
  private fileRecordRepo: FileRecordRepository;
  private todoRepo: TodoRepository;
  private executionLogRepo: ExecutionLogRepository;

  constructor() {
    this.fileRecordRepo = new FileRecordRepository();
    this.todoRepo = new TodoRepository();
    this.executionLogRepo = new ExecutionLogRepository();
  }

  async getStats(): Promise<DashboardStats> {
    const allFiles = this.fileRecordRepo.findAll();
    const pendingTodos = this.todoRepo.countPending();
    const todayProcessed = this.executionLogRepo.countToday();
    const duplicates = this.fileRecordRepo.countDuplicates();
    const fileTypes = this.fileRecordRepo.countByType() as Record<FileType, number>;
    const recentActivity = this.executionLogRepo.findRecent(5);
    const upcomingTodos = this.todoRepo.findUpcoming(5);

    const fileTypeStats = Object.entries(fileTypes)
      .filter(([, count]) => count > 0)
      .map(([type, count]) => ({
        type: type as FileType,
        count,
        label: fileTypeLabels[type as FileType] || type,
      }));

    const successLogs = recentActivity.filter(l => l.status === 'success').length;
    const successRate = recentActivity.length > 0 ? Math.round((successLogs / recentActivity.length) * 100) : 100;

    return {
      totalFiles: allFiles.length,
      pendingTodos,
      todayProcessed,
      todayOperations: recentActivity.length,
      successRate,
      duplicateFiles: duplicates,
      fileTypes,
      fileTypeStats,
      recentActivity,
      upcomingTodos,
    };
  }
}

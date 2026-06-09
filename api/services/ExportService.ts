import * as XLSX from 'xlsx';
import path from 'path';
import type { ExecutionLog, FileInfo, TodoItem } from '../../shared/types';
import { ExecutionLogRepository } from '../repositories/ExecutionLogRepository';
import { FileRecordRepository } from '../repositories/FileRecordRepository';
import { TodoRepository } from '../repositories/TodoRepository';

export class ExportService {
  private executionLogRepo: ExecutionLogRepository;
  private fileRecordRepo: FileRecordRepository;
  private todoRepo: TodoRepository;

  constructor() {
    this.executionLogRepo = new ExecutionLogRepository();
    this.fileRecordRepo = new FileRecordRepository();
    this.todoRepo = new TodoRepository();
  }

  async exportLogs(startDate?: string, endDate?: string): Promise<Buffer> {
    let logs: ExecutionLog[];

    if (startDate && endDate) {
      logs = (
        await this.executionLogRepo.findAll()
      ).filter(
        (log) => log.timestamp >= startDate && log.timestamp <= endDate
      );
    } else {
      logs = await this.executionLogRepo.findAll();
    }

    const data = logs.map((log) => ({
      '操作类型': log.action,
      '执行时间': log.timestamp,
      '影响文件数': log.filesAffected,
      '状态': log.status === 'success' ? '成功' : log.status === 'warning' ? '警告' : '失败',
      '详情': log.details,
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, '执行日志');

    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  }

  async exportFiles(files: FileInfo[]): Promise<Buffer> {
    const data = files.map((file) => ({
      '文件名': file.name,
      '原路径': file.originalPath,
      '当前路径': file.path,
      '类型': this.getTypeName(file.type),
      '扩展名': file.extension,
      '大小(KB)': (file.size / 1024).toFixed(2),
      '创建时间': file.createdAt,
      '修改时间': file.modifiedAt,
      '来源': file.source || '',
      '截止日期': file.deadline || '',
      '是否重复': file.isDuplicate ? '是' : '否',
      '缺失附件': file.missingAttachments?.join(', ') || '',
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, '文件清单');

    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  }

  async exportTodos(status?: string): Promise<Buffer> {
    let todos: TodoItem[];

    if (status && status !== 'all') {
      todos = await this.todoRepo.findByStatus(status as any);
    } else {
      todos = await this.todoRepo.findAll();
    }

    const data = todos.map((todo) => ({
      '标题': todo.title,
      '描述': todo.description,
      '截止日期': todo.deadline || '',
      '优先级': this.getPriorityName(todo.priority),
      '状态': this.getStatusName(todo.status),
      '关联文件': todo.relatedFileName || '',
      '创建时间': todo.createdAt,
      '更新时间': todo.updatedAt,
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, '待办事项');

    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  }

  async exportProcessingList(
    files: FileInfo[],
    action: string
  ): Promise<Buffer> {
    const data = files.map((file, index) => ({
      '序号': index + 1,
      '文件名': file.name,
      '新文件名': file.newName || file.name,
      '原路径': file.originalPath,
      '目标路径': file.targetFolder
        ? file.path.replace(path.basename(file.path), file.targetFolder + '/' + (file.newName || file.name))
        : file.path,
      '类型': this.getTypeName(file.type),
      '大小(KB)': (file.size / 1024).toFixed(2),
      '操作': action,
      '是否重复': file.isDuplicate ? '是' : '否',
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, '处理清单');

    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  }

  private getTypeName(type: string): string {
    const names: Record<string, string> = {
      invoice: '发票',
      contract: '合同',
      notice: '通知',
      other: '其他',
    };
    return names[type] || type;
  }

  private getPriorityName(priority: string): string {
    const names: Record<string, string> = {
      high: '高',
      medium: '中',
      low: '低',
    };
    return names[priority] || priority;
  }

  private getStatusName(status: string): string {
    const names: Record<string, string> = {
      pending: '待处理',
      in_progress: '进行中',
      completed: '已完成',
    };
    return names[status] || status;
  }
}

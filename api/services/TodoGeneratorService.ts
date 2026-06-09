import dayjs from 'dayjs';
import type { FileInfo, TodoItem, TodoPriority, FileType } from '../../shared/types';
import { TodoRepository } from '../repositories/TodoRepository';
import { ExecutionLogRepository } from '../repositories/ExecutionLogRepository';

export class TodoGeneratorService {
  private todoRepo: TodoRepository;
  private executionLogRepo: ExecutionLogRepository;

  constructor() {
    this.todoRepo = new TodoRepository();
    this.executionLogRepo = new ExecutionLogRepository();
  }

  private determinePriority(
    fileType: FileType,
    deadline?: string
  ): TodoPriority {
    if (deadline) {
      const daysUntilDeadline = dayjs(deadline).diff(dayjs(), 'day');
      if (daysUntilDeadline <= 3) return 'high';
      if (daysUntilDeadline <= 7) return 'medium';
    }

    const typePriority: Record<FileType, TodoPriority> = {
      invoice: 'high',
      contract: 'high',
      notice: 'medium',
      document: 'medium',
      spreadsheet: 'medium',
      image: 'low',
      video: 'low',
      audio: 'low',
      archive: 'low',
      code: 'low',
      other: 'low',
      unknown: 'low',
    };

    return typePriority[fileType] || 'medium';
  }

  private generateTodoTitle(file: FileInfo): string {
    const typeTitles: Record<FileType, string> = {
      invoice: '处理发票',
      contract: '审阅合同',
      notice: '查看通知',
      document: '处理文档',
      spreadsheet: '处理表格',
      image: '查看图片',
      video: '查看视频',
      audio: '查看音频',
      archive: '处理压缩包',
      code: '查看代码',
      other: '处理文件',
      unknown: '处理文件',
    };

    return `${typeTitles[file.type]}: ${file.name}`;
  }

  private generateTodoDescription(file: FileInfo): string {
    const parts: string[] = [];

    parts.push(`文件路径: ${file.path}`);
    parts.push(`文件类型: ${file.type}`);
    parts.push(`文件大小: ${(file.size / 1024).toFixed(2)} KB`);

    if (file.source) {
      parts.push(`来源: ${file.source}`);
    }

    if (file.isDuplicate) {
      parts.push('⚠️ 此文件为重复文件，请确认后处理');
    }

    if (file.missingAttachments && file.missingAttachments.length > 0) {
      parts.push(`⚠️ 可能缺少附件: ${file.missingAttachments.join(', ')}`);
    }

    return parts.join('\n');
  }

  async generateTodos(files: FileInfo[]): Promise<TodoItem[]> {
    const todos: TodoItem[] = [];

    for (const file of files) {
      const existingTodo = (await this.todoRepo.findAll()).find(
        (t) => t.relatedFileId === file.id
      );

      if (existingTodo) {
        todos.push(existingTodo);
        continue;
      }

      const todo = this.todoRepo.create({
        title: this.generateTodoTitle(file),
        description: this.generateTodoDescription(file),
        deadline: file.deadline,
        priority: this.determinePriority(file.type, file.deadline),
        status: 'pending',
        relatedFileId: file.id,
        relatedFileName: file.name,
      });

      todos.push(todo);
    }

    this.executionLogRepo.create({
      action: '生成待办事项',
      level: 'info',
      message: `待办事项生成完成`,
      filesAffected: todos.length,
      status: 'success',
      details: `为 ${todos.length} 个文件生成了待办事项`,
    });

    return todos;
  }

  async getTodos(
    status?: 'pending' | 'in_progress' | 'completed',
    limit?: number
  ): Promise<TodoItem[]> {
    let todos: TodoItem[];

    if (status) {
      todos = this.todoRepo.findByStatus(status);
    } else {
      todos = this.todoRepo.findAll();
    }

    if (limit) {
      todos = todos.slice(0, limit);
    }

    return todos;
  }

  async updateTodoStatus(
    id: string,
    status: 'pending' | 'in_progress' | 'completed'
  ): Promise<TodoItem | undefined> {
    return this.todoRepo.updateStatus(id, status);
  }

  async updateTodo(
    id: string,
    updates: Partial<Omit<TodoItem, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<TodoItem | undefined> {
    return this.todoRepo.update(id, updates);
  }

  async deleteTodo(id: string): Promise<boolean> {
    return this.todoRepo.delete(id);
  }

  async addTodo(
    todo: Omit<TodoItem, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<TodoItem> {
    return this.todoRepo.create(todo);
  }
}

import cron from 'node-cron';
import dayjs from 'dayjs';
import type { ScheduledTask } from '../../shared/types';
import { ScheduledTaskRepository } from '../repositories/ScheduledTaskRepository';
import { FileScannerService } from './FileScannerService';
import { FileClassifierService } from './FileClassifierService';
import { TodoGeneratorService } from './TodoGeneratorService';

export class ScheduleService {
  private taskRepo: ScheduledTaskRepository;
  private fileScannerService: FileScannerService;
  private fileClassifierService: FileClassifierService;
  private todoGeneratorService: TodoGeneratorService;
  private runningTasks: Map<string, cron.ScheduledTask>;

  constructor() {
    this.taskRepo = new ScheduledTaskRepository();
    this.fileScannerService = new FileScannerService();
    this.fileClassifierService = new FileClassifierService();
    this.todoGeneratorService = new TodoGeneratorService();
    this.runningTasks = new Map();
  }

  async startAll(): Promise<void> {
    const tasks = this.taskRepo.findAllEnabled();
    for (const task of tasks) {
      this.scheduleTask(task);
    }
  }

  private scheduleTask(task: ScheduledTask): void {
    if (this.runningTasks.has(task.id)) {
      this.runningTasks.get(task.id)!.stop();
    }

    try {
      const scheduled = cron.schedule(
        task.cronExpression,
        async () => {
          await this.executeTask(task);
        },
        {
          scheduled: task.enabled,
          timezone: 'Asia/Shanghai',
        }
      );

      this.runningTasks.set(task.id, scheduled);

      try {
        const nextDate = (scheduled as any).nextDate();
        if (nextDate) {
          this.taskRepo.update(task.id, {
            nextRun: nextDate.toISOString(),
          });
        }
      } catch {
        // ignore
      }
    } catch (error) {
      console.error(`启动定时任务失败: ${task.name}`, error);
    }
  }

  private async executeTask(task: ScheduledTask): Promise<void> {
    console.log(`执行定时任务: ${task.name}`);

    try {
      const now = new Date().toISOString();

      if (task.action === 'scan' || task.action === 'full') {
        const scanResult = await this.fileScannerService.scanDirectory(task.sourcePath);

        if (task.action === 'full') {
          const preview = await this.fileClassifierService.generatePreview(
            scanResult.files
          );
          await this.fileClassifierService.executeClassification(preview);
          await this.todoGeneratorService.generateTodos(scanResult.files);
        }
      } else if (task.action === 'classify') {
        const files = this.fileScannerService['fileRecordRepo'].findAll();
        const preview = await this.fileClassifierService.generatePreview(files);
        await this.fileClassifierService.executeClassification(preview);
      }

      this.taskRepo.update(task.id, {
        lastRun: now,
      });

      console.log(`定时任务完成: ${task.name}`);
    } catch (error) {
      console.error(`定时任务执行失败: ${task.name}`, error);
    }
  }

  async getTasks(): Promise<ScheduledTask[]> {
    return this.taskRepo.findAll();
  }

  async addTask(
    task: Omit<ScheduledTask, 'id' | 'createdAt'>
  ): Promise<ScheduledTask> {
    const newTask = this.taskRepo.create(task);
    if (newTask.enabled) {
      this.scheduleTask(newTask);
    }
    return newTask;
  }

  async updateTask(
    id: string,
    updates: Partial<Omit<ScheduledTask, 'id' | 'createdAt'>>
  ): Promise<ScheduledTask | undefined> {
    const updated = this.taskRepo.update(id, updates);
    if (updated) {
      if (updates.enabled !== undefined || updates.cronExpression !== undefined) {
        if (updated.enabled) {
          this.scheduleTask(updated);
        } else {
          const task = this.runningTasks.get(id);
          if (task) {
            task.stop();
            this.runningTasks.delete(id);
          }
        }
      }
    }
    return updated;
  }

  async deleteTask(id: string): Promise<boolean> {
    const task = this.runningTasks.get(id);
    if (task) {
      task.stop();
      this.runningTasks.delete(id);
    }
    return this.taskRepo.delete(id);
  }

  async runTaskNow(id: string): Promise<void> {
    const task = this.taskRepo.findById(id);
    if (task) {
      await this.executeTask(task);
    }
  }

  stopAll(): void {
    for (const [, task] of this.runningTasks) {
      task.stop();
    }
    this.runningTasks.clear();
  }
}

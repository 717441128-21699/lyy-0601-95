import cron from 'node-cron';
import dayjs from 'dayjs';
import type { ScheduledTask } from '../../shared/types';
import { ScheduledTaskRepository } from '../repositories/ScheduledTaskRepository';
import { SettingsRepository } from '../repositories/SettingsRepository';
import { FileScannerService } from './FileScannerService';
import { FileClassifierService } from './FileClassifierService';
import { TodoGeneratorService } from './TodoGeneratorService';

export class ScheduleService {
  private taskRepo: ScheduledTaskRepository;
  private settingsRepo: SettingsRepository;
  private fileScannerService: FileScannerService;
  private fileClassifierService: FileClassifierService;
  private todoGeneratorService: TodoGeneratorService;
  private runningTasks: Map<string, cron.ScheduledTask>;
  private static instance: ScheduleService;

  private constructor() {
    this.taskRepo = new ScheduledTaskRepository();
    this.settingsRepo = new SettingsRepository();
    this.fileScannerService = new FileScannerService();
    this.fileClassifierService = new FileClassifierService();
    this.todoGeneratorService = new TodoGeneratorService();
    this.runningTasks = new Map();
  }

  public static getInstance(): ScheduleService {
    if (!ScheduleService.instance) {
      ScheduleService.instance = new ScheduleService();
    }
    return ScheduleService.instance;
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
      const shouldStart = task.isEnabled !== undefined ? task.isEnabled : task.enabled;
      const scheduled = cron.schedule(
        task.cronExpression,
        async () => {
          await this.executeTask(task);
        },
        {
          scheduled: shouldStart,
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
      let targetPath = task.targetPath || task.sourcePath || '';
      
      if (!targetPath) {
        const settings = this.settingsRepo.getAll();
        targetPath = settings.defaultInboxPath || '';
      }
      
      if (!targetPath) {
        throw new Error('未指定扫描路径，且通用设置中未配置默认收件文件夹');
      }

      let scannedFiles: any[] = [];
      
      if (task.type === 'scan' || task.action === 'scan') {
        const scanResult = await this.fileScannerService.scanDirectory(targetPath);
        scannedFiles = scanResult.files;
      } else if (task.type === 'classify' || task.action === 'classify') {
        scannedFiles = this.fileScannerService['fileRecordRepo'].findAll();
        const preview = await this.fileClassifierService.generatePreview(scannedFiles);
        await this.fileClassifierService.executeClassification(preview);
      } else if (task.type === 'scan_and_classify' || task.action === 'scan_and_classify' || task.type === 'full' || task.action === 'full') {
        // 扫描并分类完整流程，使用同一批文件
        const scanResult = await this.fileScannerService.scanDirectory(targetPath);
        scannedFiles = scanResult.files;
        const preview = await this.fileClassifierService.generatePreview(scannedFiles);
        await this.fileClassifierService.executeClassification(preview);
        await this.todoGeneratorService.generateTodos(scannedFiles);
      }

      const updateData: any = {
        lastRun: now,
        lastRunAt: now,
        status: 'completed',
      };
      this.taskRepo.update(task.id, updateData);

      console.log(`定时任务完成: ${task.name}`);
    } catch (error) {
      console.error(`定时任务执行失败: ${task.name}`, error);
      const now = new Date().toISOString();
      this.taskRepo.update(task.id, {
        lastRun: now,
        lastRunAt: now,
        status: 'failed',
        lastError: (error as Error).message,
      });
    }
  }

  async getTasks(): Promise<ScheduledTask[]> {
    return this.taskRepo.findAll();
  }

  async addTask(
    task: Omit<ScheduledTask, 'id' | 'createdAt'>
  ): Promise<ScheduledTask> {
    const newTask = this.taskRepo.create(task);
    const shouldSchedule = newTask.isEnabled !== undefined ? newTask.isEnabled : newTask.enabled;
    if (shouldSchedule) {
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
      const checkEnabled = updated.isEnabled !== undefined ? updated.isEnabled : updated.enabled;
      if (updates.isEnabled !== undefined || updates.enabled !== undefined || updates.cronExpression !== undefined) {
        if (checkEnabled) {
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

  async runTaskNow(id: string): Promise<ScheduledTask | undefined> {
    const task = this.taskRepo.findById(id);
    if (task) {
      await this.executeTask(task);
      return this.taskRepo.findById(id);
    }
    return undefined;
  }

  stopAll(): void {
    for (const [, task] of this.runningTasks) {
      task.stop();
    }
    this.runningTasks.clear();
  }
}

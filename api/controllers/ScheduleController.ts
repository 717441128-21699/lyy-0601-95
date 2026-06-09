import type { Request, Response } from 'express';
import { ScheduleService } from '../services/ScheduleService';
import type { ApiResponse, ScheduledTask } from '../../shared/types';

export class ScheduleController {
  private scheduleService: ScheduleService;

  constructor() {
    this.scheduleService = new ScheduleService();
  }

  async getTasks(req: Request, res: Response<ApiResponse<ScheduledTask[]>>) {
    try {
      const tasks = await this.scheduleService.getTasks();
      return res.json({ success: true, data: tasks });
    } catch (error) {
      return res.status(500).json({
        success: false,
        data: [],
        message: (error as Error).message,
      });
    }
  }

  async addTask(req: Request, res: Response<ApiResponse<ScheduledTask>>) {
    try {
      const task = req.body;
      const newTask = await this.scheduleService.addTask(task);
      return res.json({ success: true, data: newTask });
    } catch (error) {
      return res.status(500).json({
        success: false,
        data: null as any,
        message: (error as Error).message,
      });
    }
  }

  async updateTask(req: Request, res: Response<ApiResponse<ScheduledTask | undefined>>) {
    try {
      const { id } = req.params;
      const updates = req.body;
      const updated = await this.scheduleService.updateTask(id, updates);
      return res.json({ success: true, data: updated });
    } catch (error) {
      return res.status(500).json({
        success: false,
        data: undefined,
        message: (error as Error).message,
      });
    }
  }

  async deleteTask(req: Request, res: Response<ApiResponse<boolean>>) {
    try {
      const { id } = req.params;
      const deleted = await this.scheduleService.deleteTask(id);
      return res.json({ success: true, data: deleted });
    } catch (error) {
      return res.status(500).json({
        success: false,
        data: false,
        message: (error as Error).message,
      });
    }
  }

  async runTaskNow(req: Request, res: Response<ApiResponse<ScheduledTask | undefined>>) {
    try {
      const { id } = req.params;
      const task = await this.scheduleService.runTaskNow(id);
      return res.json({ success: true, data: task });
    } catch (error) {
      return res.status(500).json({
        success: false,
        data: undefined,
        message: (error as Error).message,
      });
    }
  }
}

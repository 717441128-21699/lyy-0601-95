import type { Request, Response } from 'express';
import { ExecutionLogRepository } from '../repositories/ExecutionLogRepository';
import type { ApiResponse, ExecutionLog } from '../../shared/types';

export class LogController {
  private logRepo: ExecutionLogRepository;

  constructor() {
    this.logRepo = new ExecutionLogRepository();
  }

  async getLogs(req: Request, res: Response<ApiResponse<ExecutionLog[]>>) {
    try {
      const { limit } = req.query;
      let logs = this.logRepo.findAll();
      
      if (limit) {
        logs = logs.slice(0, parseInt(limit as string));
      }
      
      return res.json({ success: true, data: logs });
    } catch (error) {
      return res.status(500).json({
        success: false,
        data: [],
        message: (error as Error).message,
      });
    }
  }

  async getRecent(req: Request, res: Response<ApiResponse<ExecutionLog[]>>) {
    try {
      const { limit = 10 } = req.query;
      const logs = this.logRepo.findRecent(parseInt(limit as string));
      return res.json({ success: true, data: logs });
    } catch (error) {
      return res.status(500).json({
        success: false,
        data: [],
        message: (error as Error).message,
      });
    }
  }
}

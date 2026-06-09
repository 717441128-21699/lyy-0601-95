import type { Request, Response } from 'express';
import { DashboardService } from '../services/DashboardService';
import type { ApiResponse, DashboardStats } from '../../shared/types';

export class DashboardController {
  private dashboardService: DashboardService;

  constructor() {
    this.dashboardService = new DashboardService();
  }

  async getStats(req: Request, res: Response<ApiResponse<DashboardStats>>) {
    try {
      const stats = await this.dashboardService.getStats();
      return res.json({ success: true, data: stats });
    } catch (error) {
      return res.status(500).json({
        success: false,
        data: null as any,
        message: (error as Error).message,
      });
    }
  }
}

import type { Request, Response } from 'express';
import dayjs from 'dayjs';
import { ExportService } from '../services/ExportService';
import type { ApiResponse, FileInfo } from '../../shared/types';

export class ExportController {
  private exportService: ExportService;

  constructor() {
    this.exportService = new ExportService();
  }

  async exportLogs(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;
      const buffer = await this.exportService.exportLogs(
        startDate as string,
        endDate as string
      );
      
      const filename = `执行日志_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`;
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${encodeURIComponent(filename)}"`
      );
      return res.send(buffer);
    } catch (error) {
      return res.status(500).json({
        success: false,
        data: null,
        message: (error as Error).message,
      });
    }
  }

  async exportFiles(req: Request, res: Response) {
    try {
      const { files } = req.body as { files: FileInfo[] };
      const buffer = await this.exportService.exportFiles(files);
      
      const filename = `文件清单_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`;
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${encodeURIComponent(filename)}"`
      );
      return res.send(buffer);
    } catch (error) {
      return res.status(500).json({
        success: false,
        data: null,
        message: (error as Error).message,
      });
    }
  }

  async exportTodos(req: Request, res: Response) {
    try {
      const { status } = req.query;
      const buffer = await this.exportService.exportTodos(status as string);
      
      const filename = `待办事项_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`;
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${encodeURIComponent(filename)}"`
      );
      return res.send(buffer);
    } catch (error) {
      return res.status(500).json({
        success: false,
        data: null,
        message: (error as Error).message,
      });
    }
  }

  async exportProcessingList(req: Request, res: Response) {
    try {
      const { files, action } = req.body as { files: FileInfo[]; action: string };
      const buffer = await this.exportService.exportProcessingList(files, action);
      
      const filename = `处理清单_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`;
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${encodeURIComponent(filename)}"`
      );
      return res.send(buffer);
    } catch (error) {
      return res.status(500).json({
        success: false,
        data: null,
        message: (error as Error).message,
      });
    }
  }
}

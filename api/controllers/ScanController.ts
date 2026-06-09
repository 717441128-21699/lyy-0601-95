import type { Request, Response } from 'express';
import { FileScannerService } from '../services/FileScannerService';
import type { ApiResponse } from '../../shared/types';

export class ScanController {
  private scannerService: FileScannerService;

  constructor() {
    this.scannerService = new FileScannerService();
  }

  async scan(req: Request, res: Response<ApiResponse<any>>) {
    try {
      const { path, recursive = true } = req.query;

      if (!path || typeof path !== 'string') {
        return res.status(400).json({
          success: false,
          data: null,
          message: '请提供有效的目录路径',
        });
      }

      const result = await this.scannerService.scanDirectory(
        path,
        recursive === true || recursive === 'true'
      );

      return res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        data: null,
        message: (error as Error).message,
      });
    }
  }
}

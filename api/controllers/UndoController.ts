import type { Request, Response } from 'express';
import { UndoService } from '../services/UndoService';
import type { ApiResponse, OperationSnapshot } from '../../shared/types';

export class UndoController {
  private undoService: UndoService;

  constructor() {
    this.undoService = new UndoService();
  }

  async getSnapshots(req: Request, res: Response<ApiResponse<OperationSnapshot[]>>) {
    try {
      const { limit = 10 } = req.query;
      const snapshots = await this.undoService.getSnapshots(parseInt(limit as string));
      return res.json({ success: true, data: snapshots });
    } catch (error) {
      return res.status(500).json({
        success: false,
        data: [],
        message: (error as Error).message,
      });
    }
  }

  async getLatest(req: Request, res: Response<ApiResponse<OperationSnapshot | undefined>>) {
    try {
      const snapshot = await this.undoService.getLatestSnapshot();
      return res.json({ success: true, data: snapshot });
    } catch (error) {
      return res.status(500).json({
        success: false,
        data: undefined,
        message: (error as Error).message,
      });
    }
  }

  async undo(req: Request, res: Response<ApiResponse<any>>) {
    try {
      const { snapshotId } = req.params;
      const result = await this.undoService.undo(snapshotId);
      return res.json({ success: true, data: result });
    } catch (error) {
      return res.status(500).json({
        success: false,
        data: null,
        message: (error as Error).message,
      });
    }
  }

  async undoLatest(req: Request, res: Response<ApiResponse<any>>) {
    try {
      const result = await this.undoService.undoLatest();
      return res.json({ success: true, data: result });
    } catch (error) {
      return res.status(500).json({
        success: false,
        data: null,
        message: (error as Error).message,
      });
    }
  }
}

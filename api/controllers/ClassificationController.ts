import type { Request, Response } from 'express';
import { FileClassifierService } from '../services/FileClassifierService';
import type {
  ApiResponse,
  ClassificationRule,
  ClassificationPreview,
} from '../../shared/types';

export class ClassificationController {
  private classifierService: FileClassifierService;

  constructor() {
    this.classifierService = new FileClassifierService();
  }

  async getRules(req: Request, res: Response<ApiResponse<ClassificationRule[]>>) {
    try {
      const rules = await this.classifierService.getRules();
      return res.json({ success: true, data: rules });
    } catch (error) {
      return res.status(500).json({
        success: false,
        data: [],
        message: (error as Error).message,
      });
    }
  }

  async addRule(req: Request, res: Response<ApiResponse<ClassificationRule>>) {
    try {
      const rule = req.body;
      const newRule = await this.classifierService.addRule(rule);
      return res.json({ success: true, data: newRule });
    } catch (error) {
      return res.status(500).json({
        success: false,
        data: null as any,
        message: (error as Error).message,
      });
    }
  }

  async updateRule(req: Request, res: Response<ApiResponse<ClassificationRule | undefined>>) {
    try {
      const { id } = req.params;
      const rule = req.body;
      const updated = await this.classifierService.updateRule(id, rule);
      return res.json({ success: true, data: updated });
    } catch (error) {
      return res.status(500).json({
        success: false,
        data: undefined,
        message: (error as Error).message,
      });
    }
  }

  async deleteRule(req: Request, res: Response<ApiResponse<boolean>>) {
    try {
      const { id } = req.params;
      const deleted = await this.classifierService.deleteRule(id);
      return res.json({ success: true, data: deleted });
    } catch (error) {
      return res.status(500).json({
        success: false,
        data: false,
        message: (error as Error).message,
      });
    }
  }

  async preview(req: Request, res: Response<ApiResponse<ClassificationPreview>>) {
    try {
      const { files, groupBy = 'rule' } = req.body;
      const preview = await this.classifierService.generatePreview(
        files,
        groupBy as any
      );
      return res.json({ success: true, data: preview });
    } catch (error) {
      return res.status(500).json({
        success: false,
        data: null as any,
        message: (error as Error).message,
      });
    }
  }

  async execute(req: Request, res: Response<ApiResponse<any>>) {
    try {
      const preview = req.body as ClassificationPreview;
      const result = await this.classifierService.executeClassification(preview);
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

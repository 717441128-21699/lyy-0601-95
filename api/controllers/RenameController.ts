import type { Request, Response } from 'express';
import { RenameService } from '../services/RenameService';
import type { ApiResponse, RenameRule, RenamePreview } from '../../shared/types';

export class RenameController {
  private renameService: RenameService;

  constructor() {
    this.renameService = new RenameService();
  }

  async getRules(req: Request, res: Response<ApiResponse<RenameRule[]>>) {
    try {
      const rules = await this.renameService.getRules();
      return res.json({ success: true, data: rules });
    } catch (error) {
      return res.status(500).json({
        success: false,
        data: [],
        message: (error as Error).message,
      });
    }
  }

  async addRule(req: Request, res: Response<ApiResponse<RenameRule>>) {
    try {
      const rule = req.body;
      const newRule = await this.renameService.addRule(rule);
      return res.json({ success: true, data: newRule });
    } catch (error) {
      return res.status(500).json({
        success: false,
        data: null as any,
        message: (error as Error).message,
      });
    }
  }

  async updateRule(req: Request, res: Response<ApiResponse<RenameRule | undefined>>) {
    try {
      const { id } = req.params;
      const rule = req.body;
      const updated = await this.renameService.updateRule(id, rule);
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
      const deleted = await this.renameService.deleteRule(id);
      return res.json({ success: true, data: deleted });
    } catch (error) {
      return res.status(500).json({
        success: false,
        data: false,
        message: (error as Error).message,
      });
    }
  }

  async preview(req: Request, res: Response<ApiResponse<RenamePreview>>) {
    try {
      const { files, template } = req.body;
      let preview: RenamePreview;
      
      if (template) {
        preview = await this.renameService.generatePreview(files, template);
      } else {
        preview = await this.renameService.generatePreviewByRules(files);
      }
      
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
      const preview = req.body as RenamePreview;
      const result = await this.renameService.executeRename(preview);
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

import type { Request, Response } from 'express';
import { SettingsRepository } from '../repositories/SettingsRepository';
import { IgnoreRuleRepository } from '../repositories/IgnoreRuleRepository';
import type { ApiResponse, Settings, IgnoreRule } from '../../shared/types';

export class SettingsController {
  private settingsRepo: SettingsRepository;
  private ignoreRuleRepo: IgnoreRuleRepository;

  constructor() {
    this.settingsRepo = new SettingsRepository();
    this.ignoreRuleRepo = new IgnoreRuleRepository();
  }

  async getSettings(req: Request, res: Response<ApiResponse<Partial<Settings>>>) {
    try {
      const settings = this.settingsRepo.getAll();
      return res.json({ success: true, data: settings });
    } catch (error) {
      return res.status(500).json({
        success: false,
        data: {},
        message: (error as Error).message,
      });
    }
  }

  async updateSettings(req: Request, res: Response<ApiResponse<void>>) {
    try {
      const updates = req.body as Partial<Settings>;
      
      for (const [key, value] of Object.entries(updates)) {
        this.settingsRepo.set(key, value);
      }
      
      return res.json({ success: true, data: undefined as any });
    } catch (error) {
      return res.status(500).json({
        success: false,
        data: undefined as any,
        message: (error as Error).message,
      });
    }
  }

  async getIgnoreRules(req: Request, res: Response<ApiResponse<IgnoreRule[]>>) {
    try {
      const rules = this.ignoreRuleRepo.findAll();
      return res.json({ success: true, data: rules });
    } catch (error) {
      return res.status(500).json({
        success: false,
        data: [],
        message: (error as Error).message,
      });
    }
  }

  async addIgnoreRule(req: Request, res: Response<ApiResponse<IgnoreRule>>) {
    try {
      const rule = req.body;
      const newRule = this.ignoreRuleRepo.create(rule);
      return res.json({ success: true, data: newRule });
    } catch (error) {
      return res.status(500).json({
        success: false,
        data: null as any,
        message: (error as Error).message,
      });
    }
  }

  async updateIgnoreRule(req: Request, res: Response<ApiResponse<IgnoreRule | undefined>>) {
    try {
      const { id } = req.params;
      const updates = req.body;
      const updated = this.ignoreRuleRepo.update(id, updates);
      return res.json({ success: true, data: updated });
    } catch (error) {
      return res.status(500).json({
        success: false,
        data: undefined,
        message: (error as Error).message,
      });
    }
  }

  async deleteIgnoreRule(req: Request, res: Response<ApiResponse<boolean>>) {
    try {
      const { id } = req.params;
      const deleted = this.ignoreRuleRepo.delete(id);
      return res.json({ success: true, data: deleted });
    } catch (error) {
      return res.status(500).json({
        success: false,
        data: false,
        message: (error as Error).message,
      });
    }
  }
}

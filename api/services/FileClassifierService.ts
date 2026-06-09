import fs from 'fs/promises';
import path from 'path';
import dayjs from 'dayjs';
import type {
  FileInfo,
  ClassificationRule,
  ClassificationPreview,
  FileType,
} from '../../shared/types';
import { ClassificationRuleRepository } from '../repositories/ClassificationRuleRepository';
import { FileRecordRepository } from '../repositories/FileRecordRepository';
import { ExecutionLogRepository } from '../repositories/ExecutionLogRepository';
import { SnapshotRepository } from '../repositories/SnapshotRepository';

export class FileClassifierService {
  private classificationRuleRepo: ClassificationRuleRepository;
  private fileRecordRepo: FileRecordRepository;
  private executionLogRepo: ExecutionLogRepository;
  private snapshotRepo: SnapshotRepository;

  constructor() {
    this.classificationRuleRepo = new ClassificationRuleRepository();
    this.fileRecordRepo = new FileRecordRepository();
    this.executionLogRepo = new ExecutionLogRepository();
    this.snapshotRepo = new SnapshotRepository();
  }

  private matchRule(file: FileInfo, rule: ClassificationRule): boolean {
    const conditions = rule.conditions;

    if (conditions.source && file.source !== conditions.source) {
      return false;
    }

    if (conditions.filenamePattern) {
      const regex = new RegExp(conditions.filenamePattern, 'i');
      if (!regex.test(file.name)) {
        return false;
      }
    }

    if (conditions.dateRange) {
      const fileDate = dayjs(file.createdAt);
      const start = dayjs(conditions.dateRange.start);
      const end = dayjs(conditions.dateRange.end);
      if (fileDate.isBefore(start) || fileDate.isAfter(end)) {
        return false;
      }
    }

    if (conditions.extensions && conditions.extensions.length > 0) {
      if (!conditions.extensions.includes(file.extension.toLowerCase())) {
        return false;
      }
    }

    if (conditions.fileType && file.type !== conditions.fileType) {
      return false;
    }

    return true;
  }

  private classifyByDate(file: FileInfo): string {
    const date = dayjs(file.createdAt);
    const year = date.format('YYYY');
    const month = date.format('MM');
    return `${year}/${year}-${month}`;
  }

  private classifyByExtension(file: FileInfo): string {
    const ext = file.extension.toLowerCase().replace('.', '');
    const categories: Record<string, string> = {
      pdf: 'PDF文档',
      doc: 'Word文档',
      docx: 'Word文档',
      xls: 'Excel文档',
      xlsx: 'Excel文档',
      ppt: 'PPT文档',
      pptx: 'PPT文档',
      jpg: '图片',
      jpeg: '图片',
      png: '图片',
      gif: '图片',
      txt: '文本文件',
      zip: '压缩文件',
      rar: '压缩文件',
      '7z': '压缩文件',
      mp4: '视频',
      avi: '视频',
      mp3: '音频',
    };
    return categories[ext] || '其他';
  }

  private classifyByType(file: FileInfo): string {
    const typeNames: Record<FileType, string> = {
      invoice: '发票',
      contract: '合同',
      notice: '通知',
      document: '文档',
      spreadsheet: '表格',
      image: '图片',
      video: '视频',
      audio: '音频',
      archive: '压缩包',
      code: '代码',
      other: '其他',
      unknown: '未知',
    };
    return typeNames[file.type] || '其他';
  }

  async generatePreview(
    files: FileInfo[],
    groupBy: 'rule' | 'type' | 'date' | 'extension' | 'source' = 'rule'
  ): Promise<ClassificationPreview> {
    const rules = this.classificationRuleRepo.findAllEnabled();
    const conflicts: ClassificationPreview['conflicts'] = [];
    const targetFoldersSet = new Set<string>();

    const classifiedFiles = files.map((file) => {
      let targetFolder = '未分类';

      if (groupBy === 'rule') {
        for (const rule of rules) {
          if (this.matchRule(file, rule)) {
            targetFolder = rule.targetFolder;
            break;
          }
        }
      } else if (groupBy === 'type') {
        targetFolder = this.classifyByType(file);
      } else if (groupBy === 'date') {
        targetFolder = this.classifyByDate(file);
      } else if (groupBy === 'extension') {
        targetFolder = this.classifyByExtension(file);
      } else if (groupBy === 'source') {
        targetFolder = file.source || '未知来源';
      }

      const targetPath = path.join(path.dirname(file.path), '..', targetFolder, file.name);
      targetFoldersSet.add(targetFolder);

      try {
        fs.access(targetPath);
        conflicts.push({
          fileId: file.id,
          targetPath,
          existingFile: targetPath,
        });
      } catch {
        // 文件不存在，无冲突
      }

      return {
        ...file,
        targetFolder,
      };
    });

    const groupsMap = new Map<string, { name: string; files: FileInfo[]; targetFolder: string }>();
    classifiedFiles.forEach((file) => {
      const folder = file.targetFolder || '未分类';
      if (!groupsMap.has(folder)) {
        groupsMap.set(folder, { name: folder, files: [], targetFolder: folder });
      }
      groupsMap.get(folder)!.files.push(file);
    });

    const groups = Array.from(groupsMap.values());

    return {
      files: classifiedFiles,
      totalFiles: classifiedFiles.length,
      groups,
      targetFolders: Array.from(targetFoldersSet),
      conflicts,
    };
  }

  async executeClassification(preview: ClassificationPreview): Promise<{
    success: boolean;
    moved: number;
    failed: number;
    snapshotId?: string;
  }> {
    const changes: Array<{
      fileId: string;
      oldPath: string;
      newPath: string;
      oldName: string;
      newName: string;
    }> = [];

    let moved = 0;
    let failed = 0;
    const errors: string[] = [];

    const snapshot = this.snapshotRepo.create({
      fileStates: preview.files,
      changes: [],
    });

    for (const file of preview.files) {
      if (!file.targetFolder) continue;

      try {
        const targetDir = path.join(path.dirname(file.path), '..', file.targetFolder);
        const targetPath = path.join(targetDir, file.name);

        await fs.mkdir(targetDir, { recursive: true });

        if (await fs.stat(targetPath).catch(() => false)) {
          const ext = path.extname(file.name);
          const baseName = path.basename(file.name, ext);
          let counter = 1;
          let newTargetPath = path.join(targetDir, `${baseName}_${counter}${ext}`);
          while (await fs.stat(newTargetPath).catch(() => false)) {
            counter++;
            newTargetPath = path.join(targetDir, `${baseName}_${counter}${ext}`);
          }
          await fs.rename(file.path, newTargetPath);
          changes.push({
            fileId: file.id,
            oldPath: file.path,
            newPath: newTargetPath,
            oldName: file.name,
            newName: path.basename(newTargetPath),
          });
          this.fileRecordRepo.update(file.id, {
            path: newTargetPath,
            name: path.basename(newTargetPath),
          });
        } else {
          await fs.rename(file.path, targetPath);
          changes.push({
            fileId: file.id,
            oldPath: file.path,
            newPath: targetPath,
            oldName: file.name,
            newName: file.name,
          });
          this.fileRecordRepo.update(file.id, {
            path: targetPath,
          });
        }

        moved++;
      } catch (error) {
        failed++;
        errors.push(`${file.name}: ${(error as Error).message}`);
      }
    }

    this.snapshotRepo.update(snapshot.id, {
      changes,
    } as any);

    this.executionLogRepo.create({
      action: '文件分类',
      level: failed > 0 ? 'warning' : 'info',
      message: failed > 0 ? `文件分类部分失败` : `文件分类完成`,
      filesAffected: moved,
      status: failed > 0 ? 'warning' : 'success',
      details:
        failed > 0
          ? `成功移动 ${moved} 个文件，失败 ${failed} 个: ${errors.join('; ')}`
          : `成功移动 ${moved} 个文件`,
      snapshotId: snapshot.id,
    });

    return {
      success: failed === 0,
      moved,
      failed,
      snapshotId: snapshot.id,
    };
  }

  async getRules(): Promise<ClassificationRule[]> {
    return this.classificationRuleRepo.findAll();
  }

  async addRule(
    rule: Omit<ClassificationRule, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<ClassificationRule> {
    return this.classificationRuleRepo.create(rule);
  }

  async updateRule(
    id: string,
    rule: Partial<Omit<ClassificationRule, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<ClassificationRule | undefined> {
    return this.classificationRuleRepo.update(id, rule);
  }

  async deleteRule(id: string): Promise<boolean> {
    return this.classificationRuleRepo.delete(id);
  }
}

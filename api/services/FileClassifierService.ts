import fs from 'fs/promises';
import path from 'path';
import dayjs from 'dayjs';
import type {
  FileInfo,
  ClassificationRule,
  ClassificationPreview,
  FileType,
  DuplicateGroup,
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
    if (!rule.isActive) return false;

    const pattern = rule.pattern || '';
    const patterns = pattern.split(/[,，]/).map(p => p.trim()).filter(p => p);

    switch (rule.type) {
      case 'keyword': {
        const fileName = file.name.toLowerCase();
        return patterns.some(p => fileName.includes(p.toLowerCase()));
      }
      case 'extension': {
        const fileExt = file.extension.toLowerCase();
        return patterns.some(p => {
          const ext = p.startsWith('.') ? p.toLowerCase() : `.${p.toLowerCase()}`;
          return fileExt === ext;
        });
      }
      case 'date': {
        const fileDate = dayjs(file.createdAt);
        const fileYearMonth = fileDate.format('YYYY-MM');
        const fileYear = fileDate.format('YYYY');
        return patterns.some(p => {
          if (p.includes('-')) {
            return fileYearMonth === p || fileYearMonth.startsWith(p);
          }
          return fileYear === p;
        });
      }
      case 'source': {
        if (!file.source) return false;
        const sourceLower = file.source.toLowerCase();
        return patterns.some(p => sourceLower.includes(p.toLowerCase()));
      }
      case 'type': {
        return patterns.some(p => {
          const typeLower = p.toLowerCase();
          if (typeLower === 'invoice' || typeLower === '发票') return file.type === 'invoice';
          if (typeLower === 'contract' || typeLower === '合同') return file.type === 'contract';
          if (typeLower === 'notice' || typeLower === '通知') return file.type === 'notice';
          if (typeLower === 'document' || typeLower === '文档') return file.type === 'document';
          if (typeLower === 'spreadsheet' || typeLower === '表格') return file.type === 'spreadsheet';
          if (typeLower === 'image' || typeLower === '图片') return file.type === 'image';
          if (typeLower === 'video' || typeLower === '视频') return file.type === 'video';
          if (typeLower === 'audio' || typeLower === '音频') return file.type === 'audio';
          if (typeLower === 'archive' || typeLower === '压缩包') return file.type === 'archive';
          if (typeLower === 'code' || typeLower === '代码') return file.type === 'code';
          if (typeLower === 'other' || typeLower === '其他') return file.type === 'other';
          return false;
        });
      }
      default:
        return false;
    }
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
    const rules = this.classificationRuleRepo.findAllEnabled().sort((a, b) => b.priority - a.priority);
    const conflicts: ClassificationPreview['conflicts'] = [];
    const targetFoldersSet = new Set<string>();

    const classifiedFiles = await Promise.all(files.map(async (file) => {
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

      const baseDir = path.dirname(file.path);
      const targetPath = path.join(baseDir, '..', targetFolder, file.name);
      targetFoldersSet.add(targetFolder);

      try {
        await fs.access(targetPath);
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
    }));

    // 处理重复文件组
    const duplicateGroupsMap = new Map<string, DuplicateGroup>();
    classifiedFiles.forEach((file) => {
      if (file.duplicateGroupId) {
        if (!duplicateGroupsMap.has(file.duplicateGroupId)) {
          duplicateGroupsMap.set(file.duplicateGroupId, {
            groupId: file.duplicateGroupId,
            files: [],
            keepFile: file,
            toDelete: [],
          });
        }
        const group = duplicateGroupsMap.get(file.duplicateGroupId)!;
        group.files.push(file);
        if (file.isDuplicate) {
          group.toDelete.push(file);
          file.toDelete = true;
        } else {
          group.keepFile = file;
        }
      }
    });

    // 确保每个重复组的 keepFile 是正确的（不是重复的那个）
    for (const group of duplicateGroupsMap.values()) {
      const keepFile = group.files.find(f => !f.isDuplicate) || group.files[0];
      group.keepFile = keepFile;
      group.toDelete = group.files.filter(f => f.id !== keepFile.id);
      group.toDelete.forEach(f => {
        f.toDelete = true;
        f.isDuplicate = true;
        f.duplicateOf = keepFile.id;
      });
    }

    const duplicateGroups = Array.from(duplicateGroupsMap.values());

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
      duplicateGroups,
      groups,
      targetFolders: Array.from(targetFoldersSet),
      conflicts,
    };
  }

  async executeClassification(preview: ClassificationPreview): Promise<{
    success: boolean;
    moved: number;
    deleted: number;
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
    let deleted = 0;
    let failed = 0;
    const errors: string[] = [];

    const snapshot = this.snapshotRepo.create({
      action: '文件分类与去重',
      description: '文件分类并合并重复文件',
      fileCount: preview.files.length,
      fileStates: preview.files,
      changes: [],
    });

    // 先处理重复文件删除
    if (preview.duplicateGroups) {
      for (const group of preview.duplicateGroups) {
        for (const file of group.toDelete) {
          try {
            // 先备份文件内容到临时目录用于恢复
            const fileContent = await fs.readFile(file.path);
            const backupPath = path.join(path.dirname(file.path), '.docorganizer_backup', `${file.id}_${file.name}`);
            await fs.mkdir(path.dirname(backupPath), { recursive: true });
            await fs.writeFile(backupPath, fileContent);
            
            // 删除文件
            await fs.unlink(file.path);
            
            changes.push({
              fileId: file.id,
              oldPath: file.path,
              newPath: backupPath, // 用备份路径标记这是删除操作
              oldName: file.name,
              newName: '', // 空名称表示删除
            });
            
            this.fileRecordRepo.delete(file.id);
            deleted++;
          } catch (error) {
            failed++;
            errors.push(`删除重复文件 ${file.name}: ${(error as Error).message}`);
          }
        }
      }
    }

    // 再处理文件移动
    for (const file of preview.files) {
      if (!file.targetFolder) continue;
      if (file.toDelete) continue; // 跳过要删除的重复文件

      try {
        const baseDir = path.dirname(file.path);
        const targetDir = path.join(baseDir, '..', file.targetFolder);
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
      action: '文件分类与去重',
      level: failed > 0 ? 'warning' : 'info',
      message: failed > 0 ? `文件分类部分失败` : `文件分类完成`,
      filesAffected: moved + deleted,
      status: failed > 0 ? 'warning' : 'success',
      details:
        failed > 0
          ? `成功移动 ${moved} 个文件，删除重复 ${deleted} 个，失败 ${failed} 个: ${errors.join('; ')}`
          : `成功移动 ${moved} 个文件，删除重复 ${deleted} 个`,
      snapshotId: snapshot.id,
    });

    return {
      success: failed === 0,
      moved,
      deleted,
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

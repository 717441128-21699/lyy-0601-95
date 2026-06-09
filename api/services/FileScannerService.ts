import fs from 'fs/promises';
import path from 'path';
import type { FileInfo, FileType, IgnoreRule, ScanResult } from '../../shared/types';
import { FileRecordRepository } from '../repositories/FileRecordRepository';
import { IgnoreRuleRepository } from '../repositories/IgnoreRuleRepository';

export class FileScannerService {
  private fileRecordRepo: FileRecordRepository;
  private ignoreRuleRepo: IgnoreRuleRepository;

  constructor() {
    this.fileRecordRepo = new FileRecordRepository();
    this.ignoreRuleRepo = new IgnoreRuleRepository();
  }

  private isIgnored(filePath: string, ignoreRules: IgnoreRule[], isDirectory: boolean = false): boolean {
    const fileName = path.basename(filePath);
    const ext = path.extname(filePath).toLowerCase();

    for (const rule of ignoreRules) {
      if (!rule.isActive) continue;

      switch (rule.type) {
        case 'filename':
          if (!isDirectory && (fileName === rule.pattern || fileName.includes(rule.pattern))) {
            return true;
          }
          break;
        case 'extension':
          if (!isDirectory && ext === rule.pattern.toLowerCase()) {
            return true;
          }
          break;
        case 'folder':
          if (filePath.includes(rule.pattern)) {
            return true;
          }
          break;
      }
    }
    return false;
  }

  private detectFileType(fileName: string, content?: string): FileType {
    const lowerName = fileName.toLowerCase();
    
    const invoicePatterns = ['发票', 'invoice', 'receipt', '账单', '费用单', '报销单'];
    const contractPatterns = ['合同', 'contract', '协议', 'agreement', '合约'];
    const noticePatterns = ['通知', '公告', '通告', 'notice', '公告栏', '通知函'];

    for (const pattern of invoicePatterns) {
      if (lowerName.includes(pattern.toLowerCase())) {
        return 'invoice';
      }
    }

    for (const pattern of contractPatterns) {
      if (lowerName.includes(pattern.toLowerCase())) {
        return 'contract';
      }
    }

    for (const pattern of noticePatterns) {
      if (lowerName.includes(pattern.toLowerCase())) {
        return 'notice';
      }
    }

    return 'other';
  }

  private extractDeadline(fileName: string, content?: string): string | undefined {
    const patterns = [
      /截止[日期]*[：:]\s*(\d{4}[-/年]\d{1,2}[-/月]\d{1,2}日?)/,
      /[到截]期[：:]\s*(\d{4}[-/年]\d{1,2}[-/月]\d{1,2}日?)/,
      /deadline[：:]\s*(\d{4}[-/]\d{1,2}[-/]\d{1,2})/i,
      /(\d{4}[-/年]\d{1,2}[-/月]\d{1,2}日?)\s*前/,
    ];

    for (const pattern of patterns) {
      const match = fileName.match(pattern);
      if (match) {
        return this.normalizeDate(match[1]);
      }
    }

    if (content) {
      for (const pattern of patterns) {
        const match = content.match(pattern);
        if (match) {
          return this.normalizeDate(match[1]);
        }
      }
    }

    return undefined;
  }

  private normalizeDate(dateStr: string): string {
    let normalized = dateStr
      .replace(/年/g, '-')
      .replace(/月/g, '-')
      .replace(/日/g, '')
      .replace(/\//g, '-');
    
    const parts = normalized.split('-');
    if (parts.length === 3) {
      const year = parts[0].padStart(4, '20');
      const month = parts[1].padStart(2, '0');
      const day = parts[2].padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    
    return new Date().toISOString().split('T')[0];
  }

  private extractSource(filePath: string): string | undefined {
    const folders = path.dirname(filePath).split(path.sep);
    const commonSources = ['邮件', '微信', 'QQ', '下载', '桌面', '收件箱', 'Downloads', 'Desktop'];
    
    for (const folder of folders) {
      for (const source of commonSources) {
        if (folder.includes(source) || folder.toLowerCase().includes(source.toLowerCase())) {
          return source;
        }
      }
    }
    
    return undefined;
  }

  private async checkDuplicates(files: FileInfo[]): Promise<FileInfo[]> {
    const sizeMap = new Map<number, FileInfo[]>();
    
    for (const file of files) {
      if (!sizeMap.has(file.size)) {
        sizeMap.set(file.size, []);
      }
      sizeMap.get(file.size)!.push(file);
    }

    let groupCounter = 0;
    for (const [, group] of sizeMap) {
      if (group.length > 1) {
        const processed = new Set<string>();
        for (let i = 0; i < group.length; i++) {
          if (processed.has(group[i].id)) continue;
          
          const duplicates: FileInfo[] = [group[i]];
          for (let j = i + 1; j < group.length; j++) {
            if (processed.has(group[j].id)) continue;
            
            try {
              const content1 = await fs.readFile(group[i].path);
              const content2 = await fs.readFile(group[j].path);
              
              if (content1.equals(content2)) {
                duplicates.push(group[j]);
                processed.add(group[j].id);
              }
            } catch {
              // 忽略读取错误
            }
          }
          
          if (duplicates.length > 1) {
            groupCounter++;
            const groupId = `dup_${Date.now()}_${groupCounter}`;
            // 按修改时间排序，保留最新的文件
            duplicates.sort((a, b) => new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime());
            duplicates.forEach((file, idx) => {
              file.duplicateGroupId = groupId;
              if (idx > 0) {
                file.isDuplicate = true;
                file.duplicateOf = duplicates[0].id;
              }
            });
            processed.add(group[i].id);
          }
        }
      }
    }

    return files;
  }

  private detectMissingAttachments(files: FileInfo[]): FileInfo[] {
    const mainFilePatterns = [
      /(申请|报告|请示|项目|方案|计划|总结|汇报).*\.(doc|docx|pdf)$/i,
    ];

    for (const file of files) {
      const missing: string[] = [];
      
      for (const pattern of mainFilePatterns) {
        if (pattern.test(file.name)) {
          const baseName = file.name.replace(/\.[^.]+$/, '');
          
          const expectedPatterns = ['附件', '附表', '附图', '相关材料', '证明材料'];
          
          for (const ep of expectedPatterns) {
            if (file.name.includes(ep)) {
              continue;
            }
            
            const hasAttachment = files.some(f => {
              if (f.id === file.id) return false;
              const fBaseName = f.name.replace(/\.[^.]+$/, '');
              return (
                fBaseName.includes(baseName) && 
                f.name.includes(ep)
              );
            });
            
            if (!hasAttachment) {
              missing.push(ep);
            }
          }

          if (missing.length > 0) {
            file.missingAttachments = missing;
          }
        }
      }
    }

    return files;
  }

  async scanDirectory(dirPath: string, recursive: boolean = true): Promise<ScanResult> {
    if (!await fs.stat(dirPath).catch(() => false)) {
      throw new Error(`目录不存在: ${dirPath}`);
    }

    const ignoreRules = this.ignoreRuleRepo.findAllEnabled();
    const files: FileInfo[] = [];

    const scan = async (currentPath: string) => {
      const entries = await fs.readdir(currentPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name);
        const isDir = entry.isDirectory();

        if (this.isIgnored(fullPath, ignoreRules, isDir)) {
          continue;
        }

        if (isDir) {
          if (recursive) {
            await scan(fullPath);
          }
        } else if (entry.isFile()) {
          const stats = await fs.stat(fullPath);
          const ext = path.extname(entry.name).toLowerCase();
          
          let content: string | undefined;
          if (['.txt', '.md', '.json', '.csv', '.xml'].includes(ext)) {
            try {
              content = await fs.readFile(fullPath, 'utf8');
            } catch {
              // 忽略读取错误
            }
          }

          const fileInfo: FileInfo = {
            id: crypto.randomUUID(),
            name: entry.name,
            path: fullPath,
            originalPath: fullPath,
            size: stats.size,
            extension: ext,
            createdAt: stats.birthtime.toISOString(),
            modifiedAt: stats.mtime.toISOString(),
            type: this.detectFileType(entry.name, content),
            source: this.extractSource(fullPath),
            deadline: this.extractDeadline(entry.name, content),
          };

          files.push(fileInfo);
        }
      }
    };

    await scan(dirPath);

    const filesWithDuplicates = await this.checkDuplicates(files);
    const filesWithAttachments = this.detectMissingAttachments(filesWithDuplicates);

    for (const file of filesWithAttachments) {
      try {
        this.fileRecordRepo.create(file);
      } catch (e) {
        // 忽略数据库错误，继续处理
      }
    }

    const duplicates = filesWithAttachments.filter(f => f.isDuplicate).length;
    const missingAttachments = filesWithAttachments.filter(f => 
      f.missingAttachments && f.missingAttachments.length > 0
    ).length;

    return {
      files: filesWithAttachments,
      totalCount: filesWithAttachments.length,
      duplicates,
      missingAttachments,
    };
  }
}

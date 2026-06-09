import fs from 'fs/promises';
import path from 'path';
import type { OperationSnapshot } from '../../shared/types';
import { SnapshotRepository } from '../repositories/SnapshotRepository';
import { FileRecordRepository } from '../repositories/FileRecordRepository';
import { ExecutionLogRepository } from '../repositories/ExecutionLogRepository';

export class UndoService {
  private snapshotRepo: SnapshotRepository;
  private fileRecordRepo: FileRecordRepository;
  private executionLogRepo: ExecutionLogRepository;

  constructor() {
    this.snapshotRepo = new SnapshotRepository();
    this.fileRecordRepo = new FileRecordRepository();
    this.executionLogRepo = new ExecutionLogRepository();
  }

  async getLatestSnapshot(): Promise<OperationSnapshot | undefined> {
    return this.snapshotRepo.findLatest();
  }

  async getSnapshots(limit: number = 10): Promise<OperationSnapshot[]> {
    return this.snapshotRepo.findAll().slice(0, limit);
  }

  async undo(snapshotId: string): Promise<{
    success: boolean;
    restored: number;
    failed: number;
  }> {
    const snapshot = this.snapshotRepo.findById(snapshotId);
    if (!snapshot) {
      throw new Error('快照不存在');
    }

    let restored = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const change of snapshot.changes) {
      try {
        const targetDir = path.dirname(change.oldPath);
        await fs.mkdir(targetDir, { recursive: true });

        // 处理被删除的文件（从备份恢复）
        if (change.newName === '' && change.newPath.includes('.docorganizer_backup')) {
          try {
            if (await fs.stat(change.newPath).catch(() => false)) {
              // 从备份中恢复文件
              const fileContent = await fs.readFile(change.newPath);
              await fs.writeFile(change.oldPath, fileContent);
              
              // 重新创建文件记录
              const fileState = snapshot.fileStates.find(f => f.id === change.fileId);
              if (fileState) {
                this.fileRecordRepo.create(fileState);
              }
              
              // 删除备份文件
              await fs.unlink(change.newPath).catch(() => {});
              
              restored++;
            } else {
              failed++;
              errors.push(`备份文件已不存在: ${change.newPath}`);
            }
          } catch (error) {
            failed++;
            errors.push(`恢复删除文件 ${change.oldName}: ${(error as Error).message}`);
          }
          continue;
        }

        // 处理被移动的文件
        if (await fs.stat(change.newPath).catch(() => false)) {
          await fs.rename(change.newPath, change.oldPath);

          this.fileRecordRepo.update(change.fileId, {
            path: change.oldPath,
            name: change.oldName,
          });

          restored++;
        } else {
          const record = this.fileRecordRepo.findById(change.fileId);
          if (record) {
            this.fileRecordRepo.update(change.fileId, {
              path: change.oldPath,
              name: change.oldName,
            });
            restored++;
          } else {
            failed++;
            errors.push(`文件已不存在: ${change.newPath}`);
          }
        }
      } catch (error) {
        failed++;
        errors.push(`${change.oldName}: ${(error as Error).message}`);
      }
    }

    this.executionLogRepo.create({
      action: '撤销操作',
      level: failed > 0 ? 'warning' : 'info',
      message: failed > 0 ? `撤销操作部分失败` : `撤销操作完成`,
      filesAffected: restored,
      status: failed > 0 ? 'warning' : 'success',
      details:
        failed > 0
          ? `成功恢复 ${restored} 个文件，失败 ${failed} 个: ${errors.join('; ')}`
          : `成功恢复 ${restored} 个文件`,
    });

    return {
      success: failed === 0,
      restored,
      failed,
    };
  }

  async undoLatest(): Promise<{
    success: boolean;
    restored: number;
    failed: number;
  }> {
    const latest = await this.getLatestSnapshot();
    if (!latest) {
      throw new Error('没有可撤销的操作');
    }
    return this.undo(latest.id);
  }
}

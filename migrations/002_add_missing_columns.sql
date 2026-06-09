-- 添加 execution_logs 表的新列
ALTER TABLE execution_logs ADD COLUMN level TEXT DEFAULT 'info';
ALTER TABLE execution_logs ADD COLUMN message TEXT;

-- 添加 classification_rules 表的新列
ALTER TABLE classification_rules ADD COLUMN type TEXT DEFAULT 'keyword';
ALTER TABLE classification_rules ADD COLUMN pattern TEXT;
ALTER TABLE classification_rules ADD COLUMN is_active INTEGER DEFAULT 1;

-- 添加 rename_rules 表的新列
ALTER TABLE rename_rules ADD COLUMN is_active INTEGER DEFAULT 1;

-- 添加 ignore_rules 表的新列
ALTER TABLE ignore_rules ADD COLUMN name TEXT;
ALTER TABLE ignore_rules ADD COLUMN is_active INTEGER DEFAULT 1;

-- 添加 operation_snapshots 表的新列
ALTER TABLE operation_snapshots ADD COLUMN action TEXT;
ALTER TABLE operation_snapshots ADD COLUMN status TEXT DEFAULT 'applied';
ALTER TABLE operation_snapshots ADD COLUMN description TEXT;
ALTER TABLE operation_snapshots ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE operation_snapshots ADD COLUMN file_count INTEGER DEFAULT 0;

-- 添加 scheduled_tasks 表的新列
ALTER TABLE scheduled_tasks ADD COLUMN type TEXT DEFAULT 'scan_and_classify';
ALTER TABLE scheduled_tasks ADD COLUMN target_path TEXT;
ALTER TABLE scheduled_tasks ADD COLUMN is_enabled INTEGER DEFAULT 1;
ALTER TABLE scheduled_tasks ADD COLUMN last_run_at DATETIME;

-- 插入新增的设置项
INSERT OR IGNORE INTO settings (id, key, value) VALUES
  ('7', 'defaultInboxPath', ''),
  ('8', 'defaultOutputPath', ''),
  ('9', 'notificationEnabled', 'true'),
  ('10', 'deadlineReminder', 'true'),
  ('11', 'confirmBeforeAction', 'true'),
  ('12', 'logRetentionDays', '30'),
  ('13', 'snapshotRetentionCount', '10');

-- 更新现有分类规则的 type 和 pattern
UPDATE classification_rules SET type = 'type', pattern = 'invoice', is_active = 1 WHERE id = '1';
UPDATE classification_rules SET type = 'type', pattern = 'contract', is_active = 1 WHERE id = '2';
UPDATE classification_rules SET type = 'keyword', pattern = '通知|公告|通告', is_active = 1 WHERE id = '3';
UPDATE classification_rules SET type = 'extension', pattern = '.jpg,.jpeg,.png,.gif,.bmp', is_active = 1 WHERE id = '4';
UPDATE classification_rules SET type = 'extension', pattern = '.doc,.docx,.xls,.xlsx,.ppt,.pptx,.pdf', is_active = 1 WHERE id = '5';

-- 更新现有忽略规则的 name 和 is_active
UPDATE ignore_rules SET name = 'Thumbs.db 文件', is_active = 1 WHERE id = '1';
UPDATE ignore_rules SET name = '.DS_Store 文件', is_active = 1 WHERE id = '2';
UPDATE ignore_rules SET name = 'desktop.ini 文件', is_active = 1 WHERE id = '3';
UPDATE ignore_rules SET name = '临时文件 .tmp', is_active = 1 WHERE id = '4';
UPDATE ignore_rules SET name = '临时文件 .temp', is_active = 1 WHERE id = '5';

-- 更新现有定时任务字段
UPDATE scheduled_tasks SET is_enabled = enabled, last_run_at = last_run, target_path = source_path;

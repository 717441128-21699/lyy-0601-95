-- 分类规则表
CREATE TABLE IF NOT EXISTS classification_rules (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  enabled INTEGER DEFAULT 1,
  priority INTEGER DEFAULT 0,
  conditions TEXT NOT NULL,
  target_folder TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 重命名规则表
CREATE TABLE IF NOT EXISTS rename_rules (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  enabled INTEGER DEFAULT 1,
  pattern TEXT NOT NULL,
  template TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 文件记录表
CREATE TABLE IF NOT EXISTS file_records (
  id TEXT PRIMARY KEY,
  original_path TEXT NOT NULL,
  current_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  extension TEXT NOT NULL,
  size INTEGER NOT NULL,
  file_type TEXT,
  source TEXT,
  deadline DATETIME,
  is_duplicate INTEGER DEFAULT 0,
  duplicate_of TEXT,
  missing_attachments TEXT,
  created_at DATETIME NOT NULL,
  modified_at DATETIME NOT NULL,
  scanned_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 待办事项表
CREATE TABLE IF NOT EXISTS todo_items (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  deadline DATETIME,
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'pending',
  related_file_id TEXT,
  related_file_name TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (related_file_id) REFERENCES file_records(id)
);

-- 执行日志表
CREATE TABLE IF NOT EXISTS execution_logs (
  id TEXT PRIMARY KEY,
  action TEXT NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  files_affected INTEGER DEFAULT 0,
  status TEXT NOT NULL,
  details TEXT,
  snapshot_id TEXT,
  FOREIGN KEY (snapshot_id) REFERENCES operation_snapshots(id)
);

-- 操作快照表（用于撤销）
CREATE TABLE IF NOT EXISTS operation_snapshots (
  id TEXT PRIMARY KEY,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  file_states TEXT NOT NULL,
  changes TEXT NOT NULL
);

-- 忽略规则表
CREATE TABLE IF NOT EXISTS ignore_rules (
  id TEXT PRIMARY KEY,
  pattern TEXT NOT NULL,
  type TEXT NOT NULL,
  enabled INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 定时任务表
CREATE TABLE IF NOT EXISTS scheduled_tasks (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  cron_expression TEXT NOT NULL,
  action TEXT NOT NULL,
  source_path TEXT NOT NULL,
  enabled INTEGER DEFAULT 1,
  last_run DATETIME,
  next_run DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 系统设置表
CREATE TABLE IF NOT EXISTS settings (
  id TEXT PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_file_records_path ON file_records(current_path);
CREATE INDEX IF NOT EXISTS idx_file_records_type ON file_records(file_type);
CREATE INDEX IF NOT EXISTS idx_todos_status ON todo_items(status);
CREATE INDEX IF NOT EXISTS idx_todos_deadline ON todo_items(deadline);
CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON execution_logs(timestamp);

-- 插入默认设置
INSERT OR IGNORE INTO settings (id, key, value) VALUES
  ('1', 'defaultSourcePath', ''),
  ('2', 'defaultTargetPath', ''),
  ('3', 'enableNotifications', 'true'),
  ('4', 'autoBackup', 'false'),
  ('5', 'backupPath', ''),
  ('6', 'theme', 'light');

-- 插入默认分类规则
INSERT OR IGNORE INTO classification_rules (id, name, enabled, priority, conditions, target_folder) VALUES
  ('1', '发票文件', 1, 10, '{"extensions":[".pdf",".jpg",".png"], "fileType": "invoice"}', '发票'),
  ('2', '合同文件', 1, 9, '{"extensions":[".pdf",".doc",".docx"], "fileType": "contract"}', '合同'),
  ('3', '通知文件', 1, 8, '{"filenamePattern":"通知|公告|通告", "fileType": "notice"}', '通知'),
  ('4', '图片文件', 1, 7, '{"extensions":[".jpg",".jpeg",".png",".gif",".bmp"]}', '图片'),
  ('5', '文档文件', 1, 6, '{"extensions":[".doc",".docx",".xls",".xlsx",".ppt",".pptx",".pdf"]}', '文档');

-- 插入默认忽略规则
INSERT OR IGNORE INTO ignore_rules (id, pattern, type, enabled) VALUES
  ('1', 'Thumbs.db', 'filename', 1),
  ('2', '.DS_Store', 'filename', 1),
  ('3', 'desktop.ini', 'filename', 1),
  ('4', '.tmp', 'extension', 1),
  ('5', '.temp', 'extension', 1);

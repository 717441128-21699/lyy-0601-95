import React from 'react';
import {
  FileText,
  FileSpreadsheet,
  FileImage,
  FileVideo,
  FileAudio,
  FileArchive,
  FileCode,
  File,
  Receipt,
  ScrollText,
  BellRing,
  FileQuestion,
} from 'lucide-react';
import type { FileType } from '../../../shared/types';

interface FileTypeIconProps {
  type: FileType;
  size?: number;
  className?: string;
}

const typeConfig: Record<FileType, { icon: React.ElementType; color: string; bg: string }> = {
  invoice: { icon: Receipt, color: 'text-accent-600', bg: 'bg-accent-50' },
  contract: { icon: ScrollText, color: 'text-primary-600', bg: 'bg-primary-50' },
  notice: { icon: BellRing, color: 'text-warning-600', bg: 'bg-warning-50' },
  document: { icon: FileText, color: 'text-slate-600', bg: 'bg-slate-50' },
  spreadsheet: { icon: FileSpreadsheet, color: 'text-green-600', bg: 'bg-green-50' },
  image: { icon: FileImage, color: 'text-purple-600', bg: 'bg-purple-50' },
  video: { icon: FileVideo, color: 'text-red-600', bg: 'bg-red-50' },
  audio: { icon: FileAudio, color: 'text-pink-600', bg: 'bg-pink-50' },
  archive: { icon: FileArchive, color: 'text-orange-600', bg: 'bg-orange-50' },
  code: { icon: FileCode, color: 'text-blue-600', bg: 'bg-blue-50' },
  other: { icon: FileQuestion, color: 'text-slate-500', bg: 'bg-slate-50' },
  unknown: { icon: File, color: 'text-slate-400', bg: 'bg-slate-50' },
};

const FileTypeIcon: React.FC<FileTypeIconProps> = ({ type, size = 20, className = '' }) => {
  const config = typeConfig[type] || typeConfig.unknown;
  const Icon = config.icon;

  return (
    <div className={`${config.bg} rounded-lg p-2 ${className}`}>
      <Icon className={config.color} size={size} />
    </div>
  );
};

export default FileTypeIcon;

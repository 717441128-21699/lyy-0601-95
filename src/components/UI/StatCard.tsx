import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  change?: string;
  changeType?: 'increase' | 'decrease';
  gradient: string;
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  change,
  changeType,
  gradient,
  onClick,
}) => {
  return (
    <div
      className={`stat-card ${gradient} ${onClick ? 'cursor-pointer' : ''} noise-overlay`}
      onClick={onClick}
    >
      <div className="relative z-10">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-white/80 text-sm font-medium mb-1">{title}</p>
            <p className="text-3xl font-bold text-white">{value}</p>
            {change && (
              <p className={`text-sm mt-2 flex items-center gap-1 ${
                changeType === 'increase' ? 'text-green-200' : 'text-red-200'
              }`}>
                {changeType === 'increase' ? '↑' : '↓'} {change}
              </p>
            )}
          </div>
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
            <Icon className="text-white" size={24} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatCard;

import React from 'react';

interface ProgressBarProps {
  progress: number; // 0 - 100
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  color?: 'emerald' | 'indigo' | 'amber';
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  showLabel = false,
  size = 'md',
  className = '',
  color = 'emerald',
}) => {
  const clamped = Math.min(Math.max(Math.round(progress), 0), 100);

  const sizeHeights = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
  };

  const barColors = {
    emerald: 'bg-gradient-to-r from-emerald-500 to-teal-400',
    indigo: 'bg-gradient-to-r from-indigo-500 to-purple-400',
    amber: 'bg-gradient-to-r from-amber-500 to-orange-400',
  };

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between items-center text-xs mb-1 font-medium text-slate-400">
          <span>Progress</span>
          <span className="text-slate-200 font-semibold">{clamped}%</span>
        </div>
      )}
      <div className={`w-full bg-slate-800/80 rounded-full overflow-hidden ${sizeHeights[size]}`}>
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${barColors[color]}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
};

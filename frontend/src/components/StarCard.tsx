import React from 'react';

interface Props {
  title: string;
  value: string | number;
  subtext?: string;
  icon: React.ReactNode;
  accentColor?: string;
}

export const StatCard: React.FC<Props> = ({ title, value, subtext, icon, accentColor = 'blue' }) => {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-sm hover:border-zinc-700 transition">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">{title}</p>
          <h3 className="text-2xl font-bold text-white mt-1">{value}</h3>
          {subtext && <p className="text-xs text-zinc-500 mt-1">{subtext}</p>}
        </div>
        <div className={`p-3 bg-${accentColor}-500/10 text-${accentColor}-400 rounded-lg border border-${accentColor}-500/20`}>
          {icon}
        </div>
      </div>
    </div>
  );
};
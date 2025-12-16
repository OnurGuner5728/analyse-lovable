import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string;
  subValue?: string;
  icon?: LucideIcon;
}

export const StatCard = ({ label, value, subValue, icon: Icon }: StatCardProps) => (
  <div className="stat-card animate-fade-in">
    <div className="flex items-center justify-between mb-2">
      <span className="text-muted-foreground text-sm">{label}</span>
      {Icon && <Icon className="w-4 h-4 text-muted-foreground" />}
    </div>
    <div className="text-2xl font-bold text-foreground">{value}</div>
    {subValue && <div className="text-xs text-muted-foreground mt-1">{subValue}</div>}
  </div>
);

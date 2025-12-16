import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  text?: string;
}

export const LoadingSpinner = ({ text = 'Yükleniyor...' }: LoadingSpinnerProps) => (
  <div className="flex items-center justify-center gap-3 p-8 animate-fade-in">
    <Loader2 className="w-6 h-6 text-primary animate-spin" />
    <span className="text-muted-foreground">{text}</span>
  </div>
);

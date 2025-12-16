interface FormBadgeProps {
  result: string;
}

export const FormBadge = ({ result }: FormBadgeProps) => {
  const baseClass = "form-badge";
  const colorClass = 
    result === 'W' ? 'form-badge-w' :
    result === 'D' ? 'form-badge-d' :
    result === 'L' ? 'form-badge-l' :
    'bg-muted text-muted-foreground';

  return (
    <span className={`${baseClass} ${colorClass}`}>
      {result || '?'}
    </span>
  );
};

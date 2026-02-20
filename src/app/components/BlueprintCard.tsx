interface BlueprintCardProps {
  children: React.ReactNode;
  label?: string;
  annotation?: string;
  className?: string;
  onClick?: () => void;
}

export function BlueprintCard({ 
  children, 
  label, 
  annotation, 
  className = "",
  onClick 
}: BlueprintCardProps) {
  return (
    <div 
      className={`relative bg-[var(--nm-bg-surface)] border border-[var(--nm-grid-line)] rounded-[var(--radius-technical)] p-6 ${onClick ? 'cursor-pointer hover:border-[var(--nm-text-annotation)] transition-colors duration-250' : ''} ${className}`}
      onClick={onClick}
    >
      {label && (
        <div 
          className="absolute top-3 left-3 font-[family-name:var(--font-data)] text-[10px] uppercase tracking-[0.15em] text-[var(--nm-text-annotation)]"
        >
          {label}
        </div>
      )}
      {annotation && (
        <div 
          className="absolute top-3 right-3 font-[family-name:var(--font-data)] text-[10px] uppercase tracking-[0.15em] text-[var(--nm-text-annotation)]"
        >
          {annotation}
        </div>
      )}
      <div className={label || annotation ? 'mt-6' : ''}>
        {children}
      </div>
    </div>
  );
}

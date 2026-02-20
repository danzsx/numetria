interface ActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost';
  children: React.ReactNode;
}

export function ActionButton({ 
  variant = 'primary', 
  children, 
  className = "",
  ...props 
}: ActionButtonProps) {
  const baseStyles = "px-6 py-3 rounded-[var(--radius-technical)] font-[family-name:var(--font-prose)] font-medium transition-all duration-250 ease-[cubic-bezier(0.2,0.8,0.2,1)]";
  
  const variantStyles = {
    primary: `
      bg-[var(--nm-accent-primary)] 
      text-[var(--nm-text-high)] 
      hover:bg-[#4A82FF]
      active:scale-[0.98]
    `,
    ghost: `
      bg-transparent 
      border border-[var(--nm-text-dimmed)] 
      text-[var(--nm-text-dimmed)]
      hover:border-[var(--nm-accent-primary)]
      hover:text-[var(--nm-accent-primary)]
      active:scale-[0.98]
    `
  };

  return (
    <button 
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

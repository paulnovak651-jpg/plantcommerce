interface SurfaceProps {
  elevation?: 'flat' | 'raised' | 'elevated';
  padding?: 'none' | 'compact' | 'default' | 'spacious';
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

const elevationStyles = {
  flat: 'bg-surface-primary',
  raised: 'bg-surface-raised border border-border rounded-[var(--radius-lg)]',
  elevated: 'bg-surface-raised rounded-[var(--radius-lg)] shadow-md',
};

const paddingStyles = {
  none: '',
  compact: 'p-3',
  default: 'p-5',
  spacious: 'p-8',
};

export function Surface({
  elevation = 'raised',
  padding = 'default',
  className = '',
  style,
  children,
}: SurfaceProps) {
  return (
    <div className={`${elevationStyles[elevation]} ${paddingStyles[padding]} ${className}`} style={style}>
      {children}
    </div>
  );
}

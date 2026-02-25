interface TagProps {
  type: 'availability' | 'community' | 'info' | 'pollination' | 'rootstock' | 'zone' | 'neutral';
  children: React.ReactNode;
  size?: 'sm' | 'md';
}

const typeStyles: Record<TagProps['type'], string> = {
  availability: 'bg-accent-light text-accent-hover',
  community: 'bg-community-light text-community-hover',
  info: 'bg-info-light text-info',
  pollination: 'bg-info-light text-info',
  zone: 'bg-info-light text-info',
  rootstock: 'bg-surface-inset text-text-secondary',
  neutral: 'bg-surface-inset text-text-secondary',
};

const sizeStyles = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
};

export function Tag({ type, children, size = 'sm' }: TagProps) {
  return (
    <span
      className={`inline-block rounded-full font-medium ${typeStyles[type]} ${sizeStyles[size]}`}
    >
      {children}
    </span>
  );
}

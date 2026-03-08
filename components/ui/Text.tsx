interface TextProps {
  variant: 'display' | 'h1' | 'h2' | 'h3' | 'body' | 'sm' | 'caption' | 'price';
  as?: keyof React.JSX.IntrinsicElements;
  botanical?: boolean;
  color?: 'primary' | 'secondary' | 'tertiary' | 'inverse' | 'accent';
  className?: string;
  children: React.ReactNode;
}

const variantStyles: Record<TextProps['variant'], { className: string; defaultTag: keyof React.JSX.IntrinsicElements }> = {
  display: {
    className: 'font-serif text-[2.4rem] font-semibold leading-[1.2]',
    defaultTag: 'h1',
  },
  h1: {
    className: 'font-serif text-[1.8rem] font-semibold leading-[1.2]',
    defaultTag: 'h1',
  },
  h2: {
    className: 'font-serif text-[1.25rem] font-semibold leading-[1.2]',
    defaultTag: 'h2',
  },
  h3: {
    className: 'font-serif text-[1.1rem] font-medium leading-[1.2]',
    defaultTag: 'h3',
  },
  body: {
    className: 'text-base leading-[1.6]',
    defaultTag: 'p',
  },
  sm: {
    className: 'text-sm leading-[1.6]',
    defaultTag: 'p',
  },
  caption: {
    className: 'text-xs leading-[1.4]',
    defaultTag: 'span',
  },
  price: {
    className: 'font-serif text-[1.15rem] font-semibold leading-[1.2] tabular-nums',
    defaultTag: 'span',
  },
};

const colorStyles: Record<NonNullable<TextProps['color']>, string> = {
  primary: 'text-text-primary',
  secondary: 'text-text-secondary',
  tertiary: 'text-text-tertiary',
  inverse: 'text-text-inverse',
  accent: 'text-accent',
};

export function Text({
  variant,
  as,
  botanical = false,
  color,
  className = '',
  children,
}: TextProps) {
  const config = variantStyles[variant];
  const Tag = as ?? config.defaultTag;
  const colorClass = color ? colorStyles[color] : '';
  const botanicalClass = botanical ? 'font-serif italic' : '';

  return (
    <Tag className={`${config.className} ${colorClass} ${botanicalClass} ${className}`.trim()}>
      {children}
    </Tag>
  );
}

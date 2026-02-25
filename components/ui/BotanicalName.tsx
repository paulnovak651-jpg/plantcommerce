interface BotanicalNameProps {
  children: React.ReactNode;
  className?: string;
}

export function BotanicalName({ children, className = '' }: BotanicalNameProps) {
  return (
    <em className={`font-serif italic text-inherit not-italic-[&>*] ${className}`} style={{ fontStyle: 'italic' }}>
      {children}
    </em>
  );
}

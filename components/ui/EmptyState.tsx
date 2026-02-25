import Link from 'next/link';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: { label: string; href: string };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center rounded-[var(--radius-lg)] border border-dashed border-border bg-surface-primary px-6 py-12 text-center">
      {icon && <div className="mb-3 text-text-tertiary">{icon}</div>}
      <p className="text-[1.1rem] font-medium text-text-primary">{title}</p>
      <p className="mt-1 text-sm text-text-secondary">{description}</p>
      {action && (
        <Link
          href={action.href}
          className="mt-4 rounded-[var(--radius-md)] bg-accent px-4 py-2 text-sm font-medium text-text-inverse hover:bg-accent-hover"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}

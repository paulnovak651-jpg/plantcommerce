interface BadgeProps {
  label: string;
  variant?: 'green' | 'amber' | 'gray';
}

const variantClasses = {
  green: 'bg-green-100 text-green-800',
  amber: 'bg-amber-100 text-amber-700',
  gray: 'bg-gray-100 text-gray-600',
};

export function Badge({ label, variant = 'green' }: BadgeProps) {
  return (
    <span
      className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${variantClasses[variant]}`}
    >
      {label.replace(/_/g, ' ')}
    </span>
  );
}

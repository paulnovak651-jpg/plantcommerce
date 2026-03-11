interface QuickFact {
  label: string;
  value: string;
}

interface QuickFactsRibbonProps {
  facts: QuickFact[];
}

export function QuickFactsRibbon({ facts }: QuickFactsRibbonProps) {
  if (facts.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-4 rounded-[var(--radius-lg)] border border-border-subtle bg-surface-primary px-4 py-3">
      {facts.map((fact) => (
        <div key={fact.label} className="flex items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-text-tertiary">
            {fact.label}
          </span>
          <span className="text-sm font-medium text-text-primary">{fact.value}</span>
        </div>
      ))}
    </div>
  );
}

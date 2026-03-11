'use client';

import { useState, useRef } from 'react';
import { useToast } from '@/components/ui/ToastProvider';

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
  'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY',
  'BC','ON','QC','AB','MB','SK',
];

const MATERIAL_TYPES = [
  { value: 'unknown', label: 'Not sure / Other' },
  { value: 'potted', label: 'Potted plant' },
  { value: 'bareroot', label: 'Bare root' },
  { value: 'scion', label: 'Scion wood' },
  { value: 'cutting', label: 'Cutting' },
  { value: 'seed', label: 'Seed' },
  { value: 'rootstock', label: 'Rootstock' },
];

interface SearchResult {
  canonical_name: string;
  species_common_name: string | null;
  botanical_name: string | null;
  index_source: string;
}

interface ApiResponse {
  ok: boolean;
  data: SearchResult[];
}

interface FormState {
  listing_type: 'wts' | 'wtb';
  raw_cultivar_text: string;
  raw_species_text: string;
  material_type: string;
  quantity: string;
  price_text: string;
  location_state: string;
  contact_email: string;
  notes: string;
}

const INITIAL: FormState = {
  listing_type: 'wts',
  raw_cultivar_text: '',
  raw_species_text: '',
  material_type: 'unknown',
  quantity: '',
  price_text: '',
  location_state: '',
  contact_email: '',
  notes: '',
};

export function ListingForm({ prefillCultivar }: { prefillCultivar?: string }) {
  const [form, setForm] = useState<FormState>({
    ...INITIAL,
    raw_cultivar_text: prefillCultivar ?? '',
  });
  const { addToast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function set(field: keyof FormState, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleCultivarChange(value: string) {
    set('raw_cultivar_text', value);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(value.trim())}&limit=5`);
        const json = (await res.json()) as ApiResponse;
        if (json.ok && json.data.length > 0) {
          setSuggestions(json.data);
          setShowSuggestions(true);
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } catch {
        // silently ignore autocomplete errors
      }
    }, 300);
  }

  function selectSuggestion(result: SearchResult) {
    set('raw_cultivar_text', result.canonical_name);
    const speciesText = result.species_common_name ?? result.botanical_name ?? '';
    if (speciesText) {
      set('raw_species_text', speciesText);
    }
    setSuggestions([]);
    setShowSuggestions(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const priceDollars = parseFloat(form.price_text);
    const price_cents =
      form.price_text.trim() && !isNaN(priceDollars)
        ? Math.round(priceDollars * 100)
        : null;

    const quantityNum = parseInt(form.quantity, 10);

    try {
      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listing_type: form.listing_type,
          raw_cultivar_text: form.raw_cultivar_text.trim(),
          raw_species_text: form.raw_species_text.trim() || null,
          material_type: form.material_type,
          quantity: !isNaN(quantityNum) && quantityNum > 0 ? quantityNum : null,
          price_cents,
          location_state: form.location_state,
          contact_email: form.contact_email.trim() || null,
          notes: form.notes.trim() || null,
        }),
      });

      const json = (await res.json()) as { ok: boolean; error?: { message: string } };
      if (!json.ok) {
        setError(json.error?.message ?? 'Submission failed. Please try again.');
      } else {
        setSubmitted(true);
        addToast('Listing submitted for review', 'success');
      }
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-border-subtle bg-surface-primary px-6 py-8 text-center">
        <div className="text-2xl">🌱</div>
        <p className="mt-3 text-lg font-medium text-text-primary">Listing submitted!</p>
        <p className="mt-1 text-sm text-text-secondary">
          Your listing is under review and will appear publicly once approved. Thank you
          for contributing to the community.
        </p>
        <button
          onClick={() => { setSubmitted(false); setForm(INITIAL); }}
          className="mt-4 text-sm text-accent hover:underline"
        >
          Submit another listing
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Listing type */}
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-text-primary">
          What are you doing? *
        </legend>
        <div className="flex gap-3">
          {(['wts', 'wtb'] as const).map((type) => (
            <label
              key={type}
              className={`flex cursor-pointer items-center gap-2 rounded-[var(--radius-md)] border px-4 py-2.5 text-sm font-medium transition-colors ${
                form.listing_type === type
                  ? 'border-accent bg-accent-subtle text-accent'
                  : 'border-border-subtle text-text-secondary hover:border-accent'
              }`}
            >
              <input
                type="radio"
                name="listing_type"
                value={type}
                checked={form.listing_type === type}
                onChange={() => set('listing_type', type)}
                className="sr-only"
              />
              {type === 'wts' ? 'Have to offer (WTS)' : 'Looking for (WTB)'}
            </label>
          ))}
        </div>
      </fieldset>

      {/* Plant name with autocomplete */}
      <div className="relative">
        <label className="block">
          <span className="text-sm font-medium text-text-primary">
            Cultivar or plant name *
          </span>
          <input
            type="text"
            required
            minLength={2}
            autoComplete="off"
            value={form.raw_cultivar_text}
            onChange={(e) => handleCultivarChange(e.target.value)}
            onBlur={() => setShowSuggestions(false)}
            placeholder="e.g. Jefferson hazelnut, Comice pear"
            className="mt-1.5 w-full rounded-[var(--radius-md)] border border-border bg-surface-primary px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent focus:outline-none"
          />
        </label>
        {showSuggestions && suggestions.length > 0 && (
          <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-[var(--radius-md)] border border-border-subtle bg-surface-raised shadow-lg">
            {suggestions.map((result, i) => (
              <li key={i}>
                <button
                  type="button"
                  onMouseDown={() => selectSuggestion(result)}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-surface-inset"
                >
                  <span className="font-medium text-text-primary">{result.canonical_name}</span>
                  {result.species_common_name && (
                    <span className="ml-2 text-text-tertiary">{result.species_common_name}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Species (optional) */}
      <label className="block">
        <span className="text-sm font-medium text-text-primary">
          Species{' '}
          <span className="font-normal text-text-tertiary">(optional)</span>
        </span>
        <input
          type="text"
          value={form.raw_species_text}
          onChange={(e) => set('raw_species_text', e.target.value)}
          placeholder="e.g. Corylus avellana, European Hazelnut"
          className="mt-1.5 w-full rounded-[var(--radius-md)] border border-border bg-surface-primary px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent focus:outline-none"
        />
      </label>

      {/* Material type + quantity row */}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-text-primary">Material type</span>
          <select
            value={form.material_type}
            onChange={(e) => set('material_type', e.target.value)}
            className="mt-1.5 w-full rounded-[var(--radius-md)] border border-border bg-surface-primary px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
          >
            {MATERIAL_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-medium text-text-primary">
            Quantity{' '}
            <span className="font-normal text-text-tertiary">(optional)</span>
          </span>
          <input
            type="number"
            min={1}
            value={form.quantity}
            onChange={(e) => set('quantity', e.target.value)}
            placeholder="e.g. 5"
            className="mt-1.5 w-full rounded-[var(--radius-md)] border border-border bg-surface-primary px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent focus:outline-none"
          />
        </label>
      </div>

      {/* Price + location row */}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-text-primary">
            Price per unit{' '}
            <span className="font-normal text-text-tertiary">(leave blank for trade/free)</span>
          </span>
          <div className="relative mt-1.5">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-tertiary">
              $
            </span>
            <input
              type="number"
              min={0}
              step={0.01}
              value={form.price_text}
              onChange={(e) => set('price_text', e.target.value)}
              placeholder="0.00"
              className="w-full rounded-[var(--radius-md)] border border-border bg-surface-primary py-2 pl-7 pr-3 text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent focus:outline-none"
            />
          </div>
        </label>

        <label className="block">
          <span className="text-sm font-medium text-text-primary">
            State / Province *
          </span>
          <select
            required
            value={form.location_state}
            onChange={(e) => set('location_state', e.target.value)}
            className="mt-1.5 w-full rounded-[var(--radius-md)] border border-border bg-surface-primary px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
          >
            <option value="">Select…</option>
            {US_STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Contact email */}
      <label className="block">
        <span className="text-sm font-medium text-text-primary">
          Contact email{' '}
          <span className="font-normal text-text-tertiary">(optional, not displayed publicly)</span>
        </span>
        <input
          type="email"
          value={form.contact_email}
          onChange={(e) => set('contact_email', e.target.value)}
          placeholder="you@example.com"
          className="mt-1.5 w-full rounded-[var(--radius-md)] border border-border bg-surface-primary px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent focus:outline-none"
        />
      </label>

      {/* Notes */}
      <label className="block">
        <span className="text-sm font-medium text-text-primary">
          Additional notes{' '}
          <span className="font-normal text-text-tertiary">(optional)</span>
        </span>
        <textarea
          rows={3}
          value={form.notes}
          onChange={(e) => set('notes', e.target.value)}
          placeholder="Rootstock type, grafting year, local pickup details, scion trade preferences…"
          className="mt-1.5 w-full rounded-[var(--radius-md)] border border-border bg-surface-primary px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent focus:outline-none"
        />
      </label>

      {error && (
        <p className="rounded-[var(--radius-md)] bg-surface-inset px-3 py-2 text-sm text-status-unavailable">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-[var(--radius-md)] bg-accent px-5 py-2.5 text-sm font-medium text-text-inverse hover:bg-accent-hover disabled:opacity-50"
      >
        {submitting ? 'Submitting…' : 'Submit listing'}
      </button>

      <p className="text-xs text-text-tertiary">
        Listings are reviewed before appearing publicly. No account required.
      </p>
    </form>
  );
}

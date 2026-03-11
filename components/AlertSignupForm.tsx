'use client';

import { useState } from 'react';
import { useToast } from '@/components/ui/ToastProvider';

interface AlertSignupFormProps {
  cultivarId: string;
  plantEntityId: string | null;
  cultivarName: string;
  /** When true, renders without outer border/padding (for embedding in EmptyState) */
  compact?: boolean;
}

interface AlertCreateResponse {
  ok: boolean;
  data?: {
    id: string;
    status: string;
    duplicate: boolean;
  };
  error?: {
    code: string;
    message: string;
  };
}

export function AlertSignupForm({
  cultivarId,
  plantEntityId,
  cultivarName,
  compact = false,
}: AlertSignupFormProps) {
  const { addToast } = useToast();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          cultivarId,
          plantEntityId,
        }),
      });

      const payload = (await response.json()) as AlertCreateResponse;
      if (!payload.ok) {
        setErrorMessage(payload.error?.message ?? 'Unable to create alert right now.');
        return;
      }

      const msg = payload.data?.duplicate
        ? 'You already have an active alert for this cultivar.'
        : "You're on the list. We'll email you when stock appears.";
      setSuccessMessage(msg);
      addToast('Stock alert created!', 'success');
      setEmail('');
    } catch {
      setErrorMessage('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={compact ? 'text-left' : 'rounded-[var(--radius-lg)] border border-border-subtle bg-surface-primary p-4 sm:p-5'}>
      <div className="flex items-center gap-2">
        <svg
          className="h-5 w-5 text-accent"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
          />
        </svg>
        <p className="text-base font-medium text-text-primary">
          Get notified when prices drop
        </p>
      </div>
      <p className="mt-1 text-sm text-text-secondary">
        We&apos;ll email you when {cultivarName} appears in stock or prices change. One-time
        alert, no spam.
      </p>

      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-2 sm:flex-row">
        <label className="sr-only" htmlFor="stock-alert-email">
          Email address
        </label>
        <input
          id="stock-alert-email"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="email@example.com"
          className="min-w-0 flex-1 rounded-[var(--radius-md)] border border-border bg-surface-raised px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent focus:outline-none"
        />
        <button
          type="submit"
          disabled={submitting}
          className="rounded-[var(--radius-md)] bg-accent px-4 py-2 text-sm font-medium text-text-inverse hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'Saving...' : 'Notify Me'}
        </button>
      </form>

      {successMessage && (
        <p className="mt-2 text-sm text-status-active">{successMessage}</p>
      )}
      {errorMessage && (
        <p className="mt-2 text-sm text-status-unavailable">{errorMessage}</p>
      )}
    </div>
  );
}

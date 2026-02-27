'use client';

import { useState } from 'react';

interface AlertSignupFormProps {
  cultivarId: string;
  plantEntityId: string | null;
  cultivarName: string;
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
}: AlertSignupFormProps) {
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

      setSuccessMessage(
        payload.data?.duplicate
          ? 'You already have an active alert for this cultivar.'
          : "You're on the list. We'll email you when stock appears."
      );
      setEmail('');
    } catch {
      setErrorMessage('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-[var(--radius-lg)] border border-border-subtle bg-surface-primary p-4 sm:p-5">
      <p className="text-base font-medium text-text-primary">
        Get notified when {cultivarName} is in stock
      </p>
      <p className="mt-1 text-sm text-text-secondary">
        We&apos;ll send one email when availability appears. No spam.
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

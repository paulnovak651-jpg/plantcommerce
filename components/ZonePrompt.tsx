'use client';

import { useState, useEffect } from 'react';
import { getUserZone, setUserZone, clearUserZone } from '@/lib/zone-persistence';

const ZONES = Array.from({ length: 13 }, (_, i) => i + 1);

function dispatchZoneChanged(zone: number | null) {
  window.dispatchEvent(new CustomEvent('zone-changed', { detail: zone }));
}

/**
 * Compact zone widget for the site header.
 * Shows "Zone X" button when set, or inline dropdown when editing.
 */
export function ZonePrompt() {
  const [savedZone, setSavedZone] = useState<number | null>(null);
  const [selected, setSelected] = useState<string>('');
  const [mounted, setMounted] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    setMounted(true);
    const z = getUserZone();
    setSavedZone(z);
    if (z) setSelected(String(z));
  }, []);

  // Listen for zone changes from the banner
  useEffect(() => {
    function sync() {
      const z = getUserZone();
      setSavedZone(z);
      if (z) setSelected(String(z));
      setEditing(false);
    }
    window.addEventListener('zone-changed', sync);
    return () => window.removeEventListener('zone-changed', sync);
  }, []);

  if (!mounted) return null;

  if (savedZone && !editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="text-xs text-text-tertiary hover:text-accent transition-colors"
      >
        Zone {savedZone}
      </button>
    );
  }

  if (!savedZone && !editing) return null; // Banner handles the prompt

  // Editing mode
  return (
    <div className="flex items-center gap-2 text-xs">
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        className="rounded border border-border bg-surface-primary px-1.5 py-0.5 text-xs text-text-primary"
      >
        <option value="">--</option>
        {ZONES.map((z) => (
          <option key={z} value={z}>Zone {z}</option>
        ))}
      </select>
      <button
        onClick={() => {
          if (selected) {
            const zone = Number(selected);
            setUserZone(zone);
            setSavedZone(zone);
            dispatchZoneChanged(zone);
          }
          setEditing(false);
        }}
        className="text-accent hover:underline"
      >
        Save
      </button>
      {savedZone && (
        <button
          onClick={() => {
            clearUserZone();
            setSavedZone(null);
            setSelected('');
            setEditing(false);
            dispatchZoneChanged(null);
          }}
          className="text-text-tertiary hover:text-red-500"
        >
          Clear
        </button>
      )}
    </div>
  );
}

/**
 * Full-width banner below the header.
 * - When no zone is saved: prompts the user to set their zone.
 * - When zone is saved: shows persistent "Showing plants for Zone X" with change/clear.
 */
export function ZoneBanner() {
  const [savedZone, setSavedZone] = useState<number | null>(null);
  const [selected, setSelected] = useState<string>('');
  const [mounted, setMounted] = useState(false);
  const [changing, setChanging] = useState(false);

  useEffect(() => {
    setMounted(true);
    setSavedZone(getUserZone());
  }, []);

  useEffect(() => {
    function sync() {
      const z = getUserZone();
      setSavedZone(z);
      setChanging(false);
    }
    window.addEventListener('zone-changed', sync);
    return () => window.removeEventListener('zone-changed', sync);
  }, []);

  if (!mounted) return null;

  // Zone is set — show persistent indicator
  if (savedZone && !changing) {
    return (
      <div className="border-b border-border-subtle bg-surface-raised/60 px-4 py-2">
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-3 text-sm">
          <span className="text-text-secondary">
            Showing plants for <span className="font-medium text-text-primary">Zone {savedZone}</span>
          </span>
          <button
            onClick={() => {
              setSelected(String(savedZone));
              setChanging(true);
            }}
            className="text-xs text-accent hover:underline"
          >
            Change
          </button>
          <button
            onClick={() => {
              clearUserZone();
              setSavedZone(null);
              setSelected('');
              dispatchZoneChanged(null);
            }}
            className="text-xs text-text-tertiary hover:text-text-secondary"
          >
            Clear
          </button>
        </div>
      </div>
    );
  }

  // Changing zone or no zone set — show zone selector
  return (
    <div className="border-b border-border-subtle bg-surface-raised px-4 py-3">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-3 text-sm">
        <span className="text-text-secondary">
          {changing ? 'Change your zone:' : 'What\u2019s your USDA growing zone?'}
        </span>
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="rounded border border-border bg-surface-primary px-2 py-1 text-sm text-text-primary"
        >
          <option value="">Select zone</option>
          {ZONES.map((z) => (
            <option key={z} value={z}>Zone {z}</option>
          ))}
        </select>
        <button
          onClick={() => {
            if (!selected) return;
            const zone = Number(selected);
            setUserZone(zone);
            setSavedZone(zone);
            setChanging(false);
            dispatchZoneChanged(zone);
          }}
          disabled={!selected}
          className="rounded bg-accent px-3 py-1 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
        >
          Set Zone
        </button>
        {changing && (
          <button
            onClick={() => setChanging(false)}
            className="text-xs text-text-tertiary hover:text-text-secondary"
          >
            Cancel
          </button>
        )}
        {!changing && (
          <a
            href="https://planthardiness.ars.usda.gov/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-accent hover:underline"
          >
            Not sure? Find your zone
          </a>
        )}
      </div>
    </div>
  );
}

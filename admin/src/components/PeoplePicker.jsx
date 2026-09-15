import { useId, useState } from 'react';
import { isValidEmail } from '../lib/contact.js';

// Type part of a name or an email, pick a person from what matches.
//
// A <select> of every student stops working at a few dozen names, and a native
// <datalist> matches on names in some browsers and not others. This is a small
// combobox instead: arrow keys move, Enter picks, Escape closes, and the
// chosen person shows as a chip with a way to change it.
//
// `allowNew` lets a valid email that is not in the list be used as it is, for a
// counsellor who has not been assigned anyone yet.
export default function PeoplePicker({ label, placeholder, people, selected, onSelect, allowNew = false }) {
  const id = useId();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const q = query.trim().toLowerCase();
  const matches = people
    .filter((p) => !q || (p.name || '').toLowerCase().includes(q) || (p.email || '').toLowerCase().includes(q))
    .slice(0, 8);
  const options =
    allowNew && isValidEmail(q) && !people.some((p) => (p.email || '').toLowerCase() === q)
      ? [...matches, { id: q, email: q, name: null, isNew: true }]
      : matches;

  function choose(person) {
    onSelect(person);
    setQuery('');
    setOpen(false);
  }

  function onKeyDown(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, options.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && open && options[active]) {
      e.preventDefault();
      choose(options[active]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  return (
    <div className="relative">
      <label htmlFor={id} className="text-[10px] uppercase tracking-wider text-[var(--color-muted)]">
        {label}
      </label>

      {selected ? (
        <div className="mt-1 flex items-center justify-between gap-3 rounded-xl border border-[var(--color-lavender)]/50 bg-[var(--color-lavender-soft)] px-4 py-2.5">
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium">{selected.name || selected.email}</span>
            {selected.name && <span className="block truncate text-xs text-[var(--color-muted)]">{selected.email}</span>}
          </span>
          <button
            type="button"
            onClick={() => onSelect(null)}
            className="shrink-0 text-xs text-[var(--color-lavender-deep)] underline underline-offset-4"
          >
            Change
          </button>
        </div>
      ) : (
        <>
          <input
            id={id}
            role="combobox"
            aria-expanded={open}
            aria-controls={`${id}-list`}
            aria-autocomplete="list"
            aria-activedescendant={open && options[active] ? `${id}-${active}` : undefined}
            autoComplete="off"
            value={query}
            placeholder={placeholder}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
              setActive(0);
            }}
            onFocus={() => setOpen(true)}
            // Closing on blur is deferred so a click on an option lands first.
            onBlur={() => setTimeout(() => setOpen(false), 120)}
            onKeyDown={onKeyDown}
            className="input-soft mt-1 w-full"
          />
          {open && (
            <ul
              id={`${id}-list`}
              role="listbox"
              className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-xl border border-[var(--line-2)] bg-white py-1 shadow-[0_18px_40px_-18px_rgba(0,0,0,0.35)]"
            >
              {options.length === 0 ? (
                <li className="px-4 py-2.5 text-sm text-[var(--color-muted)]">
                  {q ? 'Nobody matches that.' : 'Nobody to choose yet.'}
                </li>
              ) : (
                options.map((p, i) => (
                  <li
                    key={p.id}
                    id={`${id}-${i}`}
                    role="option"
                    aria-selected={i === active}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      choose(p);
                    }}
                    onMouseEnter={() => setActive(i)}
                    className={`cursor-pointer px-4 py-2 ${i === active ? 'bg-[var(--color-lavender-soft)]' : ''}`}
                  >
                    {p.isNew ? (
                      <span className="text-sm text-[var(--color-lavender-deep)]">Use {p.email}</span>
                    ) : (
                      <>
                        <span className="block truncate text-sm">{p.name || p.email}</span>
                        {p.name && <span className="block truncate text-xs text-[var(--color-muted)]">{p.email}</span>}
                      </>
                    )}
                  </li>
                ))
              )}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Header from '../../layouts/Header.jsx';
import PageShell from '../../layouts/PageShell.jsx';
import LoadError from '../../shared/LoadError.jsx';
import CrisisContacts from '../../shared/CrisisContacts.jsx';
import { useSession } from '../auth/useSession.js';
import { getPath, updatePath } from '../../shared/api.js';
import { accent, alpha } from '../../shared/accents.js';

// One path, day by day.
//
// The layout is a list rather than a wizard on purpose. A wizard implies the
// days are gated and that falling behind means starting again; a list lets
// someone see the whole shape, jump to day four because that is the one they
// need today, and come back on day nine without being told off.
//
// The one screen in this app where a number could be badly misread is the
// before/after comparison at the bottom, so the caveat the backend sends is
// rendered next to it and is not collapsible.

function DayRow({ day, path, done, isNext, onToggle, busy }) {
  const { base, bright } = accent(path.accent);

  return (
    <li
      className="card flex items-start gap-4 p-4"
      style={isNext && !done ? { borderColor: alpha(base, 0.4) } : undefined}
    >
      <button
        type="button"
        onClick={() => onToggle(day.day, done)}
        disabled={busy}
        aria-pressed={done}
        aria-label={done ? `Mark day ${day.day} not done` : `Mark day ${day.day} done`}
        className="press mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-colors disabled:opacity-50"
        style={{
          borderColor: done ? bright : 'rgba(255,255,255,0.18)',
          background: done ? bright : 'transparent',
          color: done ? '#07080a' : 'var(--color-muted)',
        }}
      >
        {done ? (
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        ) : (
          <span className="num text-xs">{day.day}</span>
        )}
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
          <p className={`font-display text-lg leading-snug ${done ? 'text-[var(--color-muted)]' : ''}`}>
            {day.title}
          </p>
          {isNext && !done && (
            <span className="text-[0.6875rem]" style={{ color: bright }}>
              next
            </span>
          )}
        </div>
        <p className="mt-1.5 text-sm leading-relaxed text-[var(--color-ink-soft)]">{day.note}</p>

        <Link
          to={`/grounding/${day.technique}`}
          className="press mt-3 inline-flex items-center gap-1.5 rounded-full border border-[var(--line-2)] px-3.5 py-1.5 text-xs transition-colors hover:border-[var(--line-4)]"
        >
          Open the practice
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </Link>
      </div>
    </li>
  );
}

// The before/after panel. Everything about this is deliberately understated:
// the caveat sits directly under the numbers, and a change smaller than the
// instrument can resolve is reported as "no measurable change" rather than as
// a direction, because a 1-point GAD-7 move is noise.
function Bookend({ path, scores, change }) {
  const { base, bright } = accent(path.accent);
  if (!path.closesWith) return null;

  const before = scores?.before;
  const after = scores?.after;

  return (
    <section className="stack-section">
      <p className="marginalia">Before and after</p>

      {!before ? (
        <div className="card mt-3 p-5">
          <p className="text-sm leading-relaxed text-[var(--color-ink-soft)]">
            This path suggests taking the {path.closesWith.toUpperCase()} now and again at the end,
            so you have something to look back at. It is optional.
          </p>
          <Link
            to={`/assessments/${path.closesWith}`}
            className="press mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm text-[#07080a]"
            style={{ background: bright }}
          >
            Take it now
          </Link>
        </div>
      ) : (
        <div className="card mt-3 p-5">
          <div className="flex flex-wrap items-end gap-x-8 gap-y-4">
            <div>
              <p className="text-xs text-[var(--color-muted)]">At the start</p>
              <p className="num mt-1 text-3xl">{before.score}</p>
              <p className="mt-0.5 text-xs text-[var(--color-muted)]">{before.band.label}</p>
            </div>

            {after ? (
              <>
                <div>
                  <p className="text-xs text-[var(--color-muted)]">Now</p>
                  <p className="num mt-1 text-3xl" style={{ color: bright }}>
                    {after.score}
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--color-muted)]">{after.band.label}</p>
                </div>

                {change && (
                  <p className="text-sm text-[var(--color-ink-soft)]">
                    {!change.meaningful
                      ? 'No measurable change'
                      : change.direction === 'better'
                        ? 'Moved in the better direction'
                        : change.direction === 'worse'
                          ? 'Moved the other way'
                          : 'No change'}
                    {/* Only shown when it actually applies. Printing it under
                        a change that IS above the threshold reads as though
                        that change were unreliable, which is the opposite of
                        what the number means. */}
                    {change.mcid != null && !change.meaningful && (
                      <span className="mt-1 block text-xs text-[var(--color-muted)]">
                        A difference under {change.mcid} points is smaller than this questionnaire
                        can reliably tell apart.
                      </span>
                    )}
                  </p>
                )}
              </>
            ) : (
              <div>
                <p className="text-xs text-[var(--color-muted)]">Now</p>
                <Link
                  to={`/assessments/${path.closesWith}`}
                  className="press mt-2 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm"
                  style={{ borderColor: alpha(base, 0.4), color: bright }}
                >
                  Take it again
                </Link>
              </div>
            )}
          </div>

          {/* Not collapsible, not a tooltip. See lib/paths.js. */}
          {path.closingCaveat && (
            <p className="mt-5 border-t border-[var(--line-1)] pt-4 text-xs leading-relaxed text-[var(--color-muted)]">
              {path.closingCaveat}
            </p>
          )}
        </div>
      )}
    </section>
  );
}

export default function PathRun() {
  const { pathId } = useParams();
  const navigate = useNavigate();
  const session = useSession();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!session) {
      navigate('/');
      return;
    }
    setLoading(true);
    setError(null);
    getPath(pathId)
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [pathId, session, navigate, reloadKey]);

  const act = useCallback(
    async (action, day) => {
      setBusy(true);
      setError(null);
      try {
        const res = await updatePath({ pathId, action, day });
        setData((prev) => (prev ? { ...prev, ...res } : prev));
      } catch (err) {
        setError(err);
      } finally {
        setBusy(false);
      }
    },
    [pathId],
  );

  if (!session) return null;

  const path = data?.path;
  const progress = data?.progress;
  const colors = accent(path?.accent);
  const started = Boolean(progress?.startedAt);

  return (
    <PageShell section="paths" width="wide">
      <Header eyebrow="Paths" />

      {loading && !path && (
        <p className="stack-block animate-pulse text-[var(--color-ink-soft)]">Loading…</p>
      )}
      {error && !path && (
        <LoadError error={error} retrying={loading} onRetry={() => setReloadKey((k) => k + 1)} />
      )}

      {path && (
        <>
          <div className="animate-slide-up stack-block">
            <Link
              to="/paths"
              className="press inline-flex items-center gap-1.5 text-xs text-[var(--color-muted)] transition-colors hover:text-[var(--color-ink)]"
            >
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M15 18l-6-6 6-6" />
              </svg>
              All paths
            </Link>

            <h1 className="font-display mt-4 text-[1.95rem] leading-[1.12] sm:text-[2.4rem]">
              {path.name}
            </h1>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-[var(--color-ink-soft)]">
              {path.blurb}
            </p>
            <p className="mt-2 text-sm text-[var(--color-muted)]">For: {path.forWhom}</p>

            {started && (
              <p className="mt-5 text-sm">
                <span className="num text-2xl" style={{ color: colors.bright }}>
                  {progress.done}
                </span>
                <span className="ml-2 text-[var(--color-ink-soft)]">
                  of {progress.total} days done
                  {progress.finished ? ' — that is the whole path.' : ''}
                </span>
              </p>
            )}
          </div>

          {error && <p className="mt-4 text-sm text-[var(--color-flag)]">{error.message}</p>}

          <ol className="stack-section grid gap-2.5">
            {path.days.map((day) => (
              <DayRow
                key={day.day}
                day={day}
                path={path}
                done={Boolean(progress?.completedDays?.includes(day.day))}
                isNext={progress?.nextDay === day.day}
                busy={busy}
                onToggle={(n, isDone) => act(isDone ? 'undo' : 'complete', n)}
              />
            ))}
          </ol>

          <Bookend path={path} scores={data.scores} change={data.change} />

          <div className="stack-section flex flex-wrap items-center gap-3">
            {started ? (
              <button
                type="button"
                onClick={() => act('leave')}
                disabled={busy}
                className="press rounded-full border border-[var(--line-2)] px-5 py-2.5 text-sm text-[var(--color-ink-soft)] transition-colors hover:border-[var(--line-4)] disabled:opacity-50"
              >
                Leave this path
              </button>
            ) : (
              <button
                type="button"
                onClick={() => act('start')}
                disabled={busy}
                className="press rounded-full px-6 py-3 text-sm font-medium text-[#07080a] disabled:opacity-50"
                style={{ background: colors.bright }}
              >
                Start this path
              </button>
            )}
            <CrisisContacts variant="link" />
          </div>

          <p className="stack-block pb-2 text-xs leading-relaxed text-[var(--color-muted)]">
            A path is a way to practise, not a course of treatment. Do the days in any order, skip
            what does not help, and come back whenever — nothing here is locked and a missed day
            costs you nothing.
          </p>
        </>
      )}
    </PageShell>
  );
}

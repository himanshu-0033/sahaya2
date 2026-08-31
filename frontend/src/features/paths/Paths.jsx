import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../../layouts/Header.jsx';
import PageShell from '../../layouts/PageShell.jsx';
import LoadError from '../../shared/LoadError.jsx';
import CrisisContacts from '../../shared/CrisisContacts.jsx';
import { useSession } from '../auth/useSession.js';
import { getPaths } from '../../shared/api.js';
import { accent, alpha } from '../../shared/accents.js';
import { pathPhoto } from '../../shared/photos.js';

// The paths index.
//
// Everything else in this app is a single sitting — one check-in, one
// questionnaire, one practice. A path is the only thing that knows Tuesday
// followed Monday, so the card's job is to show where you are in it, and an
// in-progress path is pulled to the top of the page.

function Pips({ total, completed, hue }) {
  return (
    <div className="flex flex-wrap items-center gap-1" aria-hidden="true">
      {Array.from({ length: total }, (_, i) => i + 1).map((day) => {
        const done = completed.includes(day);
        return (
          <span
            key={day}
            className="h-1.5 rounded-full transition-all duration-300"
            style={{ width: done ? 18 : 8, background: done ? hue : 'rgba(255,255,255,0.14)' }}
          />
        );
      })}
    </div>
  );
}

function PathCard({ path, progress, index }) {
  const { base, bright } = accent(path.accent);
  const done = progress?.done || 0;
  const started = Boolean(progress?.startedAt);

  return (
    <Link
      to={`/paths/${path.id}`}
      style={{ animationDelay: `${Math.min(index, 8) * 40}ms`, '--ph-hue': bright }}
      className="animate-slide-up card card-photo press flex flex-col"
    >
      <span className="photo-head">
        <img src={pathPhoto(path.id)} alt="" loading="lazy" decoding="async" />
      </span>
      <div className="card-photo-body flex flex-1 flex-col">
      <div className="flex items-start justify-between gap-3">
        <p className="font-display text-xl leading-snug">{path.name}</p>
        <span
          className="shrink-0 rounded-full px-2.5 py-1 text-[11px] whitespace-nowrap"
          style={{ background: alpha(base, 0.14), color: bright }}
        >
          {path.dayCount} days
        </span>
      </div>

      <p className="mt-2.5 text-sm leading-relaxed text-[var(--color-ink-soft)]">{path.blurb}</p>

      <div className="mt-auto pt-4">
        {started ? (
          <>
            <Pips total={path.dayCount} completed={progress.completedDays} hue={bright} />
            <p className="mt-2.5 text-xs" style={{ color: bright }}>
              {progress.finished
                ? 'Finished'
                : `Day ${progress.nextDay} next · ${done} of ${path.dayCount} done`}
            </p>
          </>
        ) : (
          <p className="text-xs text-[var(--color-muted)]">{path.forWhom}</p>
        )}
      </div>
      </div>
    </Link>
  );
}

export default function Paths() {
  const navigate = useNavigate();
  const session = useSession();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!session) {
      navigate('/');
      return;
    }
    setLoading(true);
    setError(null);
    getPaths()
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [session, navigate, reloadKey]);

  const progressFor = useMemo(() => {
    const map = new Map();
    for (const p of data?.progress || []) map.set(p.pathId, p);
    return map;
  }, [data]);

  // Anything already underway goes first. Someone three days into a path is
  // not browsing — they came here to continue.
  const [active, rest] = useMemo(() => {
    const all = data?.paths || [];
    const inProgress = all.filter((p) => {
      const prog = progressFor.get(p.id);
      return prog?.startedAt && !prog.finished;
    });
    return [inProgress, all.filter((p) => !inProgress.includes(p))];
  }, [data, progressFor]);

  if (!session) return null;

  return (
    <PageShell section="paths" width="wide">
      <Header eyebrow="Paths" />

      <div className="animate-slide-up stack-block">
        <h1 className="font-display text-[1.95rem] leading-[1.12] sm:text-[2.6rem]">
          7-day paths
          <span className="text-[var(--sec-paths)]">.</span>
        </h1>
        <p className="mt-4 max-w-lg text-sm leading-relaxed text-[var(--color-ink-soft)]">
          One small thing a day. Miss a day and nothing is lost.
        </p>
      </div>

      {loading && !data && (
        <p className="stack-block animate-pulse text-[var(--color-ink-soft)]">Loading…</p>
      )}
      {error && !data && (
        <LoadError error={error} retrying={loading} onRetry={() => setReloadKey((k) => k + 1)} />
      )}

      {data && (
        <>
          {active.length > 0 && (
            <section className="stack-section">
              <p className="marginalia">Carry on</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {active.map((path, i) => (
                  <PathCard key={path.id} path={path} progress={progressFor.get(path.id)} index={i} />
                ))}
              </div>
            </section>
          )}

          <section className="stack-section">
            <p className="marginalia">{active.length > 0 ? 'Everything else' : 'All paths'}</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {rest.map((path, i) => (
                <PathCard key={path.id} path={path} progress={progressFor.get(path.id)} index={i} />
              ))}
            </div>
          </section>

          <div className="card stack-section p-6">
            <details className="note-fold">
              <summary>Why a path asks you to take a questionnaire twice</summary>
              <p className="mt-3 text-xs leading-relaxed text-[var(--color-muted)]">
                Some paths suggest taking a questionnaire at the start and again at the end. That
                is there to give you a before and after to look at — not to score the path or to
                score you. A week is a short time and these scales move several points on their
                own, so a change is a snapshot of two particular days rather than evidence that
                anything worked.
              </p>
            </details>
            <div className="mt-5">
              <CrisisContacts variant="button" />
            </div>
          </div>
        </>
      )}
    </PageShell>
  );
}

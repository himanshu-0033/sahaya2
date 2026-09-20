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

// One stop on the road: the marker on the line, the curve down to the next
// stop, and the card itself, which is still the same link it always was.
function PathStop({ path, progress, index, last }) {
  const { base, bright, deep } = accent(path.accent);
  const done = progress?.done || 0;
  const started = Boolean(progress?.startedAt);
  const side = index % 2 === 0 ? 'left' : 'right';
  // Bulge away from the card, so the road curves into the space the card is
  // not using instead of running underneath it.
  const bulge = side === 'left' ? 82 : 18;
  const finished = Boolean(progress?.finished);

  return (
    <li className="silk-stop" data-side={side} style={{ '--silk-ink': alpha(base, 0.34) }}>
      {/* preserveAspectRatio="none" is the whole trick: the segment stretches
          to whatever height this row turns out to be, so rows with longer
          blurbs still join up. */}
      {!last && (
        <svg
          className="silk-stop-rail"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d={`M50,0 C${bulge},26 ${bulge},74 50,100`}
            fill="none"
            stroke={alpha(base, 0.34)}
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="7 9"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      )}

      {/* The stop. Filled once the path has been started, so the road shows
          at a glance which ones have been walked. */}
      <span
        className="silk-stop-marker flex h-7 w-7 items-center justify-center rounded-full border-2"
        aria-hidden="true"
        style={{
          borderColor: started ? bright : alpha(base, 0.5),
          background: started ? bright : 'var(--color-cream)',
          color: started ? '#07080a' : deep,
          boxShadow: started && !finished ? `0 0 0 5px ${alpha(base, 0.15)}` : 'none',
        }}
      >
        {finished ? (
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        ) : (
          <span className="num text-[0.6875rem]">{index + 1}</span>
        )}
      </span>

    <Link
      to={`/paths/${path.id}`}
      style={{ animationDelay: `${Math.min(index, 8) * 40}ms`, '--ph-hue': bright }}
      className="silk-stop-card animate-slide-up card card-photo press flex flex-col"
    >
      <span className="photo-head">
        <img src={pathPhoto(path.id)} alt="" loading="lazy" decoding="async" />
      </span>
      <div className="card-photo-body flex flex-1 flex-col">
      <div className="flex items-start justify-between gap-3">
        <p className="font-display text-xl leading-snug">{path.name}</p>
        <span
          className="shrink-0 rounded-full px-2.5 py-1 text-[0.6875rem] whitespace-nowrap"
          style={{ background: alpha(base, 0.14), color: deep }}
        >
          {path.dayCount} days
        </span>
      </div>

      <p className="mt-2.5 text-sm leading-relaxed text-[var(--color-ink-soft)]">{path.blurb}</p>

      <div className="mt-auto pt-4">
        {started ? (
          <>
            <Pips total={path.dayCount} completed={progress.completedDays} hue={bright} />
            <p className="mt-2.5 text-xs" style={{ color: deep }}>
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
    </li>
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

  // The order the road is walked in.
  const ordered = useMemo(() => [...active, ...rest], [active, rest]);

  if (!session) return null;

  return (
    <PageShell section="paths" width="wide">
      <Header eyebrow="Paths" />

      <div className="animate-slide-up stack-block">
        {/* Not "7-day paths": three of the five are not. They run 7, 5, 7, 6
            and 5 days, and each card states its own length, so the heading
            was contradicted by the first two cards under it. */}
        <h1 className="font-display text-[1.95rem] leading-[1.12] sm:text-[2.6rem]">
          Paths, day by day
          <span className="text-[var(--sec-paths-deep)]">.</span>
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
          {/* One road, not two. The in-progress paths still come first, but
              they are no longer a separate section: a road cut in half is
              just a list again, and a started path already says so on the
              page through its filled marker and its day count. */}
          <section className="stack-section">
            <p className="marginalia">
              {active.length > 0 ? 'Carry on, then everything else' : 'All paths'}
            </p>
            <ol className="silk-road mt-4">
              {ordered.map((path, i) => (
                <PathStop
                  key={path.id}
                  path={path}
                  progress={progressFor.get(path.id)}
                  index={i}
                  last={i === ordered.length - 1}
                />
              ))}
            </ol>
          </section>

          <div className="card stack-section p-6">
            <details className="note-fold">
              <summary>Why a path asks you to take a questionnaire twice</summary>
              <p className="mt-3 text-xs leading-relaxed text-[var(--color-muted)]">
                Some paths suggest taking a questionnaire at the start and again at the end. That
                is there to give you a before and after to look at, not to score the path or to
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

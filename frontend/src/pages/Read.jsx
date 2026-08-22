import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header.jsx';
import PageShell from '../components/PageShell.jsx';
import CrisisContacts from '../components/CrisisContacts.jsx';
import { useSession } from '../lib/useSession.js';
import { ARTICLES, TOPICS } from '../lib/articles.js';

// The reading index.
//
// Every other section of the app asks something of you — answer this, practise
// that, do today's day. This one asks nothing, which is the point: someone who
// is not ready to be measured should still have a reason to be here, and
// somewhere to go that is not a questionnaire.
//
// No fetch, no loading state, no error state. The articles ship with the app.

function ArticleCard({ article, index }) {
  const topic = TOPICS[article.topic] || TOPICS.calm;

  return (
    <Link
      to={`/read/${article.id}`}
      style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
      className="animate-slide-up card press flex flex-col p-6"
    >
      <div className="flex items-center gap-2.5">
        <span
          className="rounded-full px-2.5 py-1 text-[11px]"
          style={{ background: `color-mix(in srgb, ${topic.hue} 15%, transparent)`, color: topic.hue }}
        >
          {topic.label}
        </span>
        <span className="text-xs text-[var(--color-muted)]">
          <span className="num">{article.minutes}</span> min read
        </span>
      </div>

      <p className="font-display mt-3.5 text-2xl leading-snug">{article.title}</p>
      <p className="mt-2.5 text-sm leading-relaxed text-[var(--color-ink-soft)]">
        {article.standfirst}
      </p>

      <span className="mt-5 inline-flex items-center gap-1.5 text-xs" style={{ color: topic.hue }}>
        Read
        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </span>
    </Link>
  );
}

export default function Read() {
  const navigate = useNavigate();
  const session = useSession();

  if (!session) {
    navigate('/');
    return null;
  }

  return (
    <PageShell section="read" width="wide">
      <Header eyebrow="Read" />

      <div className="animate-slide-up stack-block">
        <h1 className="font-display text-[1.95rem] leading-[1.12] sm:text-[2.6rem]">
          The reasoning behind
          <br />
          everything else here
          <span className="text-[var(--sec-read)]">.</span>
        </h1>
        <p className="mt-4 max-w-lg text-sm leading-relaxed text-[var(--color-ink-soft)]">
          What the inkblots actually measure, why a long exhale calms you down in seconds, and what
          a score out of twenty-one does and does not mean. Where the evidence is thin, these say
          so.
        </p>
      </div>

      <div className="stack-section grid gap-3 sm:grid-cols-2">
        {ARTICLES.map((article, i) => (
          <ArticleCard key={article.id} article={article} index={i} />
        ))}
      </div>

      <div className="card stack-section p-6">
        <p className="marginalia">One caveat for all of it</p>
        <p className="mt-3 text-xs leading-relaxed text-[var(--color-muted)]">
          These are written to explain what this app does and why, not to give you medical advice
          or to stand in for talking to someone. Where a claim comes from a particular study, the
          study is named at the end of the piece so you can go and disagree with it.
        </p>
        <div className="mt-5">
          <CrisisContacts variant="button" />
        </div>
      </div>
    </PageShell>
  );
}

import { Link, useNavigate } from 'react-router-dom';
import Header from '../../layouts/Header.jsx';
import PageShell from '../../layouts/PageShell.jsx';
import CrisisContacts from '../../shared/CrisisContacts.jsx';
import { useSession } from '../auth/useSession.js';
import { ARTICLES, TOPICS } from './articles.js';
import { TEST_INDEX } from './testIndex.js';
import { topicPhoto } from '../../shared/photos.js';

// The reading index.
//
// Every other section of the app asks something of you — answer this, practise
// that, do today's day. This one asks nothing, which is the point: someone who
// is not ready to be measured should still have a reason to be here, and
// somewhere to go that is not a questionnaire.
//
// No fetch, no loading state, no error state. The articles ship with the app.

// Grouped by domain, in the order the instruments are declared, so this list
// and the Tests tab present the questionnaires in the same sequence.
const DOMAINS = TEST_INDEX.reduce((groups, test) => {
  const existing = groups.find(([domain]) => domain === test.domain);
  if (existing) existing[1].push(test);
  else groups.push([test.domain, [test]]);
  return groups;
}, []);

function ArticleCard({ article, index }) {
  const topic = TOPICS[article.topic] || TOPICS.calm;

  return (
    <Link
      to={`/read/${article.id}`}
      className="animate-slide-up card card-photo press flex flex-col"
      style={{ animationDelay: `${Math.min(index, 8) * 45}ms`, '--ph-hue': topic.hue }}
    >
      <span className="photo-head">
        <img src={topicPhoto(article.topic)} alt="" loading="lazy" decoding="async" />
      </span>
      <div className="card-photo-body flex flex-1 flex-col">
      <div className="flex items-center gap-2.5">
        <span
          className="rounded-full px-2.5 py-1 text-[0.6875rem]"
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
      </div>
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
          Reading
          <span className="text-[var(--sec-read)]">.</span>
        </h1>
        <p className="mt-4 max-w-lg text-sm leading-relaxed text-[var(--color-ink-soft)]">
          Why any of this works, and where it doesn&apos;t.
        </p>
      </div>

      <div className="stack-section grid gap-3 sm:grid-cols-2">
        {ARTICLES.map((article, i) => (
          <ArticleCard key={article.id} article={article} index={i} />
        ))}
      </div>

      {/* Every questionnaire in the Tests tab, grouped the way that tab groups
          them. A list rather than twenty-one more cards: these are reference
          pages you arrive at with a specific questionnaire in mind, not things
          to browse, and giving them the same visual weight as the essays would
          bury the essays. */}
      <section className="stack-section">
        <p className="marginalia">The questionnaires, one by one</p>
        <p className="mt-3 max-w-lg text-sm leading-relaxed text-[var(--color-ink-soft)]">
          What each one measures — and what it is bad at.
        </p>

        <div className="mt-5 grid gap-6">
          {DOMAINS.map(([domain, tests]) => (
            <div key={domain}>
              <p className="text-xs text-[var(--color-muted)]">{domain}</p>
              <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
                {tests.map((test) => (
                  <li key={test.id}>
                    <Link
                      to={`/read/tests/${test.id}`}
                      className="press card flex items-baseline justify-between gap-3 px-4 py-3"
                    >
                      <span className="min-w-0">
                        <span className="text-sm">{test.name}</span>
                        <span className="block truncate text-xs text-[var(--color-muted)]">
                          {test.fullName}
                        </span>
                      </span>
                      <span className="num shrink-0 text-xs text-[var(--color-muted)]">
                        {test.itemCount}q
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <div className="card stack-section p-6">
        <details className="note-fold">
          <summary>One caveat for all of it</summary>
          <p className="mt-3 text-xs leading-relaxed text-[var(--color-muted)]">
            These are written to explain what this app does and why, not to give you medical
            advice or to stand in for talking to someone. Where a claim comes from a particular
            study, the study is named at the end of the piece so you can go and disagree with it.
          </p>
        </details>
        <div className="mt-5">
          <CrisisContacts variant="button" />
        </div>
      </div>
    </PageShell>
  );
}

import { Link, useNavigate, useParams } from 'react-router-dom';
import Header from '../components/Header.jsx';
import PageShell from '../components/PageShell.jsx';
import CrisisContacts from '../components/CrisisContacts.jsx';
import { useSession } from '../lib/useSession.js';
import { getArticle, TOPICS } from '../lib/articles.js';

// One article.
//
// Measure is the whole design here. The rest of the app is cards and controls,
// but this is prose that someone is meant to read to the end of, so the column
// is narrow, the type is larger than the app's default, and nothing animates
// while you are trying to read a sentence.
//
// The two blocks that are not plain paragraphs both exist to stop something
// being missed: `note` for a caveat that must not be scrolled past, and
// `practice` for a link straight into the thing being described, so reading
// about a technique and doing it are one tap apart rather than a navigation
// exercise.

function Note({ children }) {
  return (
    <div className="my-7 border-l-2 border-white/20 pl-5">
      <p className="text-sm leading-relaxed text-[var(--color-ink-soft)]">{children}</p>
    </div>
  );
}

function PracticeLink({ id, label, hue }) {
  return (
    <Link
      to={`/grounding/${id}`}
      className="press my-4 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors"
      style={{ borderColor: `color-mix(in srgb, ${hue} 45%, transparent)`, color: hue }}
    >
      {label}
      <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M5 12h14M13 6l6 6-6 6" />
      </svg>
    </Link>
  );
}

function Block({ block, hue }) {
  if (block.p) {
    return <p className="mt-5 text-[1.02rem] leading-[1.75] text-[var(--color-ink-soft)]">{block.p}</p>;
  }
  if (block.list) {
    return (
      <ul className="mt-5 grid gap-3">
        {block.list.map((item) => (
          <li key={item} className="flex gap-3 text-[1.02rem] leading-[1.7] text-[var(--color-ink-soft)]">
            <span aria-hidden="true" className="mt-2.5 h-1 w-1 shrink-0 rounded-full" style={{ background: hue }} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    );
  }
  if (block.note) return <Note>{block.note}</Note>;
  if (block.practice) return <PracticeLink id={block.practice} label={block.label} hue={hue} />;
  return null;
}

export default function ReadArticle() {
  const { articleId } = useParams();
  const navigate = useNavigate();
  const session = useSession();

  if (!session) {
    navigate('/');
    return null;
  }

  const article = getArticle(articleId);
  const topic = TOPICS[article?.topic] || TOPICS.calm;

  if (!article) {
    return (
      <PageShell section="read" width="narrow">
        <Header eyebrow="Read" />
        <div className="stack-block">
          <h1 className="font-display text-2xl">That piece isn’t here.</h1>
          <Link to="/read" className="press mt-5 inline-block text-sm text-[var(--sec-read)]">
            Back to everything else
          </Link>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell section="read" width="narrow">
      <Header eyebrow="Read" />

      <article className="animate-slide-up">
        <Link
          to="/read"
          className="press inline-flex items-center gap-1.5 text-xs text-[var(--color-muted)] transition-colors hover:text-[var(--color-ink)]"
        >
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          All reading
        </Link>

        <header className="mt-5">
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

          <h1 className="font-display mt-4 text-[2.1rem] leading-[1.1] sm:text-[2.6rem]">
            {article.title}
          </h1>
          <p className="mt-4 text-[1.05rem] leading-relaxed text-[var(--color-ink-soft)]">
            {article.standfirst}
          </p>
        </header>

        <div className="mt-10 border-t border-white/8 pt-2">
          {article.sections.map((section) => (
            <section key={section.heading} className="mt-10 first:mt-6">
              <h2 className="font-display text-[1.35rem] leading-snug">{section.heading}</h2>
              {section.blocks.map((block, i) => (
                <Block key={i} block={block} hue={topic.hue} />
              ))}
            </section>
          ))}
        </div>

        {article.sources.length > 0 && (
          <section className="mt-12 border-t border-white/8 pt-6">
            <p className="marginalia">Where this comes from</p>
            <ul className="mt-4 grid gap-4">
              {article.sources.map((source) => (
                <li key={source.label} className="text-xs leading-relaxed text-[var(--color-muted)]">
                  {source.url ? (
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="underline decoration-white/20 underline-offset-2 transition-colors hover:text-[var(--color-ink-soft)]"
                    >
                      {source.label}
                    </a>
                  ) : (
                    <span>{source.label}</span>
                  )}
                  {source.detail && <span className="block opacity-80">{source.detail}</span>}
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="mt-10 flex flex-wrap items-center gap-3 pb-2">
          <Link
            to="/read"
            className="press rounded-full border border-white/12 px-5 py-2.5 text-sm text-[var(--color-ink-soft)] transition-colors hover:border-white/25"
          >
            Read something else
          </Link>
          <CrisisContacts variant="link" />
        </div>
      </article>
    </PageShell>
  );
}

import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../../layouts/Header.jsx';
import PageShell from '../../layouts/PageShell.jsx';
import CrisisContacts from '../../shared/CrisisContacts.jsx';
import { useSession } from '../auth/useSession.js';
import { ARTICLES, TOPICS } from './articles.js';
import { PAPERS, SHELVES } from './books.js';
import { TEST_INDEX } from './testIndex.js';
import { articlePhoto } from '../../shared/photos.js';
import { getGroundingCatalog, getPaths } from '../../shared/api.js';

// The reading index.
//
// Every other section of the app asks something of you: answer this, practise
// that, do today's day. This one asks nothing, which is the point: someone who
// is not ready to be measured should still have a reason to be here, and
// somewhere to go that is not a questionnaire.
//
// The articles ship with the app, so nothing here waits on the network except
// two numbers in the band at the foot of the page, the practice and path
// counts, and the band simply leaves out a number it could not get.

// Grouped by domain, in the order the instruments are declared, so this list
// and the Tests tab present the questionnaires in the same sequence.
const DOMAINS = TEST_INDEX.reduce((groups, test) => {
  const existing = groups.find(([domain]) => domain === test.domain);
  if (existing) existing[1].push(test);
  else groups.push([test.domain, [test]]);
  return groups;
}, []);

// The ten Rorschach plates. A fixed set, so a constant rather than a fetch.
const PLATE_COUNT = 10;

function dayOfYear() {
  const d = new Date();
  return Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 86400000);
}

// Worth reading: one essay as a pull-quote card.
//
// The quote is a sentence from the essay itself, never a testimonial. There
// are no user stories in this app to quote, and a named face saying the app
// helped them would be invented.
function StoryCard({ article }) {
  const topic = TOPICS[article.topic] || TOPICS.calm;
  return (
    <Link to={`/read/${article.id}`} className="press block">
      <span className="story-frame" style={{ '--ph-hue': topic.hue }}>
        <span className="photo-head">
          <img src={articlePhoto(article)} alt="" loading="lazy" decoding="async" />
        </span>
        <span className="story-quote">&ldquo;{article.pull}&rdquo;</span>
      </span>
      <span className="mt-3.5 flex flex-wrap gap-1.5">
        <span className="story-chip" style={{ background: topic.deep }}>{topic.label}</span>
        <span className="story-chip" style={{ background: 'var(--sec-read-deep)' }}>Reading</span>
      </span>
      <span className="font-display mt-3 block text-xl leading-snug sm:text-2xl">{article.title}</span>
      <span className="mt-2 block text-xs text-[var(--color-muted)]">
        <span className="num">{article.minutes}</span> min read
      </span>
    </Link>
  );
}

function ArticleCard({ article, index }) {
  const topic = TOPICS[article.topic] || TOPICS.calm;

  return (
    <Link
      to={`/read/${article.id}`}
      className="animate-slide-up card card-photo press flex flex-col"
      style={{ animationDelay: `${Math.min(index, 8) * 45}ms`, '--ph-hue': topic.hue }}
    >
      <span className="photo-head">
        <img src={articlePhoto(article)} alt="" loading="lazy" decoding="async" />
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
  // Practice and path counts for the numbers band. They live on the server.
  const [counts, setCounts] = useState({});

  useEffect(() => {
    if (!session) return;
    getGroundingCatalog()
      .then((data) => setCounts((c) => ({ ...c, practices: (data.techniques || []).length })))
      .catch(() => {});
    getPaths()
      .then((data) => setCounts((c) => ({ ...c, paths: (data.paths || []).length })))
      .catch(() => {});
  }, [session]);

  if (!session) {
    navigate('/');
    return null;
  }

  // One essay leads each day and the next four sit beside it, so a week of
  // opening this page walks the whole shelf. The rest follow as cards, so no
  // essay is shown twice.
  const lead = dayOfYear() % ARTICLES.length;
  const order = ARTICLES.map((_, i) => ARTICLES[(lead + i) % ARTICLES.length]);
  const [featured, ...others] = order;
  const nextFour = others.slice(0, 4);
  const moreEssays = others.slice(4);

  // Every number in the band is counted from what the app holds. No users
  // served, no outcomes: a prototype has none to report, and a mental-health
  // app that rounds up is the last place anyone should find an invented
  // statistic. Essays and books are on this page, so those two jump down it.
  const stats = [
    { value: TEST_INDEX.filter((t) => t.available).length, label: 'published questionnaires', to: '/assessments' },
    { value: counts.practices, label: 'grounding practices', to: '/grounding' },
    { value: counts.paths, label: 'guided paths', to: '/paths' },
    { value: PLATE_COUNT, label: 'inkblot plates', to: '/inkblot-test' },
    { value: ARTICLES.length, label: 'short essays', href: '#essays' },
    { value: SHELVES.reduce((n, s) => n + s.books.length, 0), label: 'books worth the time', href: '#books' },
  ].filter((s) => s.value);

  return (
    <PageShell section="read" width="wide">
      <Header eyebrow="Read" />

      <div className="animate-slide-up stack-block">
        <h1 className="font-display text-[1.95rem] leading-[1.12] sm:text-[2.6rem]">
          Reading
          <span className="text-[var(--sec-read-deep)]">.</span>
        </h1>
        <p className="mt-4 max-w-lg text-sm leading-relaxed text-[var(--color-ink-soft)]">
          Why any of this works, and where it doesn&apos;t.
        </p>
      </div>

      {/* Worth reading. Today's essay as a pull-quote card, and the next four
          as a list beside it on a laptop, below it on a phone. */}
      <section id="essays" className="animate-slide-up stack-section scroll-mt-24" style={{ animationDelay: '60ms' }}>
        <h2 className="home-section-title border-l-[3px] border-[var(--sec-read)] pl-3">Worth reading</h2>

        <div className="mt-4 grid gap-7 lg:grid-cols-[1.55fr_1fr] lg:gap-6">
          <StoryCard article={featured} />

          <div>
            <p className="marginalia">Also worth reading</p>
            <ul className="mt-3 grid gap-3">
              {nextFour.map((a) => (
                <li key={a.id}>
                  <Link to={`/read/${a.id}`} className="press flex items-center gap-3.5">
                    <span className="photo-head story-thumb" style={{ '--ph-hue': (TOPICS[a.topic] || TOPICS.calm).hue }}>
                      <img src={articlePhoto(a)} alt="" loading="lazy" decoding="async" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-medium leading-snug">{a.title}</span>
                      <span className="mt-1 block text-xs text-[var(--color-muted)]">
                        <span className="num">{a.minutes}</span> min read
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {moreEssays.length > 0 && (
        <section className="stack-section">
          <p className="marginalia">More essays</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {moreEssays.map((article, i) => (
              <ArticleCard key={article.id} article={article} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* Books, above the questionnaire index and below the essays.

          The essays explain this app; nothing here pointed anywhere outside it.
          These are the books people have gone on recommending to each other for
          decades, which is a harder test than being new. A student who
          reads one of them gets more out of it than out of anything we could
          write. Shelved rather than listed flat: "I cannot sleep and my chest
          is tight" and "something happened to me" do not want the same book. */}
      <section id="books" className="stack-section scroll-mt-24">
        <p className="marginalia">Books, if you want to go further</p>
        <p className="mt-3 max-w-lg text-sm leading-relaxed text-[var(--color-ink-soft)]">
          Not a syllabus. Six shelves, and the reason each one is here.
        </p>
        {/* How the list was built, said out loud. "Recommended reading" usually
            means "books somebody liked", and a reader has no way to tell the
            difference from the outside. */}
        <p className="mt-2 max-w-lg text-xs leading-relaxed text-[var(--color-muted)]">
          Chosen three ways: some are on Reading Well Books on Prescription, picked by health
          experts and people with lived experience and endorsed by the British Psychological
          Society. Some have been through trials as books: reading them, on their own, was the
          thing tested. And where one is famous and also disputed, the dispute is in the entry.
        </p>

        <div className="mt-6 grid gap-7">
          {SHELVES.map((shelf) => (
            <div key={shelf.id}>
              <h2 className="font-display text-lg leading-snug">{shelf.title}</h2>
              <p className="mt-1 text-xs leading-relaxed text-[var(--color-muted)]">
                {shelf.blurb}
              </p>

              <ul className="mt-3.5 grid gap-2.5">
                {shelf.books.map((book) => (
                  <li key={book.title} className="card p-4">
                    <p className="text-sm leading-snug">
                      {book.title}
                      {book.year && (
                        <span className="num ml-1.5 text-xs text-[var(--color-muted)]">
                          {book.year}
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 text-xs text-[var(--sec-read-deep)]">{book.author}</p>
                    <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-soft)]">
                      {book.why}
                    </p>
                    {/* What is actually known, where anyone has checked. Set
                        apart from the blurb because it is a different kind of
                        claim: the blurb is our opinion, this is somebody's
                        finding. */}
                    {book.evidence && (
                      <p className="mt-2 rounded-xl bg-[var(--surface-2)] px-3 py-2 text-xs leading-relaxed text-[var(--color-ink-soft)]">
                        {book.evidence}
                      </p>
                    )}
                    {/* The caution rides with the book, not in a footnote that
                        can be scrolled past. */}
                    {book.note && (
                      <p className="mt-2 border-l-2 border-[var(--color-amber)] pl-3 text-xs leading-relaxed text-[var(--color-muted)]">
                        {book.note}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="mt-6 max-w-lg text-xs leading-relaxed text-[var(--color-muted)]">
          Nobody pays to be on this list and nothing here is a shop link. A book is also not
          treatment. Several of these are memoirs of being seriously unwell, and they can be
          heavy in a bad week. Put one down if it is not helping.
        </p>
      </section>

      {/* The studies the exercises came out of.

          The essays cite their sources at the foot of the piece, which is the
          right place for a source and the wrong place for an invitation. This
          says plainly that the breathing screen and the writing box came from
          particular experiments, names them, and gives their limits the same
          type size as their findings. Someone who suspects we are making it up
          can go and check, which is the only answer to that suspicion worth
          giving. */}
      <section className="stack-section">
        <p className="marginalia">The studies behind the exercises</p>
        <p className="mt-3 max-w-lg text-sm leading-relaxed text-[var(--color-ink-soft)]">
          Three papers this app leans on, and what each one does not show.
        </p>

        <div className="mt-5 grid gap-2.5">
          {PAPERS.map((paper) => (
            <div key={paper.citation} className="card p-5">
              <p className="font-display text-lg leading-snug">{paper.claim}</p>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-soft)]">
                {paper.finding}
              </p>
              <p className="mt-3 border-l-2 border-[var(--color-amber)] pl-3 text-xs leading-relaxed text-[var(--color-muted)]">
                <span className="text-[var(--color-amber-deep)]">What it does not show. </span>
                {paper.limits}
              </p>
              <p className="mt-3 text-[0.6875rem] leading-relaxed text-[var(--color-muted)]">
                {paper.citation}
              </p>
              {paper.practice && (
                <Link
                  to={paper.practice.to}
                  className="press mt-3 inline-flex items-center gap-1.5 text-xs text-[var(--sec-read-deep)]"
                >
                  Try it: {paper.practice.label}
                  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </Link>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Every questionnaire in the Tests tab, grouped the way that tab groups
          them. A list rather than twenty-one more cards: these are reference
          pages you arrive at with a specific questionnaire in mind, not things
          to browse, and giving them the same visual weight as the essays would
          bury the essays. */}
      <section className="stack-section">
        <p className="marginalia">The questionnaires, one by one</p>
        <p className="mt-3 max-w-lg text-sm leading-relaxed text-[var(--color-ink-soft)]">
          What each one measures, and what it is bad at.
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

      {/* Everything in here, counted. Big numbers on a lavender band, each one
          a way in. */}
      <section className="impact-band animate-slide-up stack-section">
        <h2 className="font-display text-center text-[1.5rem] leading-tight text-[var(--sec-calm-deep)] sm:text-[1.9rem]">
          Everything in here, counted
        </h2>
        <p className="mt-2 text-center text-sm text-[var(--color-ink)]">
          Counted from what the app holds, not rounded up.
        </p>
        <ul className="mt-7 grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3">
          {stats.map((s) => {
            const figure = (
              <>
                <span className="impact-num num block">{s.value}</span>
                <span className="mx-auto mt-2 block max-w-[9rem] text-sm leading-snug text-[var(--color-ink)]">
                  {s.label}
                </span>
              </>
            );
            return (
              <li key={s.label}>
                {s.href ? (
                  <a href={s.href} className="press block text-center">
                    {figure}
                  </a>
                ) : (
                  <Link to={s.to} className="press block text-center">
                    {figure}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
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

import { Link } from 'react-router-dom';
import Header from '../../layouts/Header.jsx';
import PageShell from '../../layouts/PageShell.jsx';
import { PHOTO } from '../../shared/photos.js';

// Everything the app does that is not the daily loop.
//
// The tab bar used to carry all of this — Paths, Tests, Read and Inkblot each
// with a tab of their own, alongside Home and Calm. Six equal tabs is a claim
// that all six matter equally on the first screen, and they do not. Someone
// opening this app at eleven at night wants to check in or to calm down; the
// seven-day paths and the questionnaire library are for a different, calmer
// moment.
//
// So they moved one tap deeper. Nothing was removed and every route still
// works — a bookmark straight to /assessments/phq-9 is unaffected. What
// changed is that the front door now has two doors in it instead of six.
//
// Each entry says what it is FOR and roughly how long it takes, because the
// old tab labels ("Tests", "Paths") said neither, and a person deciding
// whether they have the energy for something needs both.

const SECTIONS = [
  {
    to: '/paths',
    photo: PHOTO.paths,
    eyebrow: 'Over days',
    title: 'Guided paths',
    body: 'A practice a day for a week, in an order that builds. For when the same thing keeps coming back rather than one bad evening.',
    meta: '5 paths · about 5 minutes a day',
    hue: 'var(--sec-paths)',
  },
  {
    to: '/assessments',
    photo: PHOTO.tests,
    eyebrow: 'Where you are',
    title: 'Questionnaires',
    body: 'Published, self-scoring questionnaires — the same ones a clinic uses, scored the same way, with the citation and licence for each. A score is not a diagnosis.',
    meta: '21 questionnaires · 1 to 3 minutes each',
    hue: 'var(--sec-tests)',
  },
  {
    to: '/read',
    photo: PHOTO.read,
    eyebrow: 'Background',
    title: 'Reading',
    body: 'What the questionnaires actually measure, what the numbers can and cannot tell you, and what the research says underneath the practices.',
    meta: 'Essays and per-questionnaire notes',
    hue: 'var(--sec-read)',
  },
  {
    to: '/inkblot-test',
    photo: PHOTO.inkblot,
    eyebrow: 'Longer',
    title: 'The ten-plate inkblot',
    body: 'Ten plates, in your own words, typed or spoken. A reflective exercise — it is not scored and it is not a clinical assessment.',
    hue: 'var(--sec-inkblot)',
    meta: '10 plates · about 10 minutes',
  },
];

export default function More() {
  return (
    <PageShell section="read">
      <Header eyebrow="More" />

      <div className="animate-slide-up stack-block">
        <h1 className="font-display text-[2rem] leading-tight sm:text-[2.6rem]">
          When you have
          <br />
          more than a minute.
        </h1>
        <p className="stack-item max-w-md text-sm leading-relaxed text-[var(--color-ink-soft)]">
          The daily check-in and the calm practices live a tap away on the bar below. Everything
          else is here.
        </p>
      </div>

      <div className="stack-section flex flex-col gap-3">
        {SECTIONS.map((section, i) => (
          <Link
            key={section.to}
            to={section.to}
            className="card card-photo card-photo-side press animate-slide-up relative"
            style={{ animationDelay: `${60 + i * 55}ms`, '--ph-hue': section.hue }}
          >
            {/* On a phone the picture is a band across the top; from `sm` up it
                becomes the left third, so four of these stacked do not turn the
                page into a column of postcards you have to scroll past. */}
            <span className="photo-head">
              <img src={section.photo} alt="" loading="lazy" decoding="async" />
            </span>
            <div className="card-photo-body min-w-0 flex-1">
              <span className="marginalia" style={{ color: section.hue }}>
                {section.eyebrow}
              </span>
              <p className="font-display mt-2 text-[1.45rem] leading-snug">{section.title}</p>
              <p className="mt-2 max-w-lg text-sm leading-relaxed text-[var(--color-ink-soft)]">
                {section.body}
              </p>
              <p className="mt-3 text-xs text-[var(--color-muted)]">{section.meta}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="rule-fade stack-section" />

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 pb-2">
        <p className="max-w-md text-[11px] leading-relaxed text-[var(--color-muted)]">
          DP Sahay AI is a reflective prototype, not a medical device. Nothing here is a diagnosis.
        </p>
        {/* Was "Who can see this" at 11px in the muted ink — accurate when this
            page was only about sharing, but it is now also where the profile
            and the sign-out live, and "sign out" is not something anyone should
            have to guess is hiding behind a privacy footnote. Named for the
            destination, at the size of a link someone is meant to find. */}
        <Link
          to="/account"
          className="press text-xs text-[var(--color-ink-soft)] underline underline-offset-4 transition-colors hover:text-[var(--color-ink)]"
        >
          Your account
        </Link>
      </div>
    </PageShell>
  );
}

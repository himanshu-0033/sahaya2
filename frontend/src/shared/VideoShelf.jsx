import { useState } from 'react';
import { accent, alpha } from './accents.js';

// Guided videos for a practice.
//
// Nothing from YouTube loads until someone actually asks for a video: the
// thumbnail is a plain <img>, and the iframe is only mounted on click. That is
// partly weight — a YouTube iframe is well over a megabyte and there are up to
// four on a page — and partly that a wellbeing app should not hand a resident's
// visit to Google's ad cookies for a video they never played. `youtube-nocookie`
// is used for the same reason once they do.
//
// These are other people's videos on someone else's platform. They can be
// deleted, made private, or region-blocked without warning, so a failed
// thumbnail degrades to a titled link rather than a broken box.

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true">
      <path d="M8 5.14v13.72a.5.5 0 0 0 .76.43l11.02-6.86a.5.5 0 0 0 0-.86L8.76 4.71A.5.5 0 0 0 8 5.14Z" />
    </svg>
  );
}

function VideoCard({ video, accentName }) {
  const { base, bright } = accent(accentName);
  const [playing, setPlaying] = useState(false);
  const [thumbFailed, setThumbFailed] = useState(false);

  if (playing) {
    return (
      <div
        className="overflow-hidden rounded-2xl border"
        style={{ borderColor: alpha(base, 0.35) }}
      >
        <div className="relative w-full" style={{ aspectRatio: '16 / 9' }}>
          <iframe
            className="absolute inset-0 h-full w-full"
            src={`https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&rel=0&modestbranding=1`}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
        <div className="px-4 py-3">
          <p className="text-sm leading-snug">{video.title}</p>
          <p className="mt-1 text-xs text-[var(--color-muted)]">{video.channel}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="group lift overflow-hidden rounded-2xl border transition-colors"
      style={{ borderColor: alpha(base, 0.18) }}
    >
      <button
        type="button"
        onClick={() => setPlaying(true)}
        className="press relative block w-full text-left"
        style={{ aspectRatio: '16 / 9' }}
        aria-label={`Play "${video.title}" by ${video.channel} on YouTube`}
      >
        {thumbFailed ? (
          <div
            className="flex h-full w-full items-center justify-center"
            style={{ background: alpha(base, 0.12) }}
          >
            <span className="px-4 text-center text-xs text-[var(--color-muted)]">
              Preview unavailable — tap to open
            </span>
          </div>
        ) : (
          <img
            src={`https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`}
            alt=""
            loading="lazy"
            onError={() => setThumbFailed(true)}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        )}

        <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />

        <span
          className="absolute top-1/2 left-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full pl-1 text-white shadow-lg transition-transform duration-300 group-hover:scale-110"
          style={{ background: alpha(base, 0.92) }}
        >
          <PlayIcon />
        </span>

        <span className="absolute right-3 bottom-3 left-3">
          <span className="block text-sm leading-snug text-white drop-shadow">{video.title}</span>
          <span className="mt-0.5 block text-[11px] text-white/70">{video.channel}</span>
        </span>
      </button>

      <div className="flex items-center justify-between gap-3 px-4 py-2.5">
        <span className="text-[11px] text-[var(--color-muted)]">Plays here, on YouTube</span>
        <a
          href={`https://www.youtube.com/watch?v=${video.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] underline underline-offset-4"
          style={{ color: bright }}
        >
          Open on YouTube
        </a>
      </div>
    </div>
  );
}

export default function VideoShelf({ videos, accentName, title = 'Guided versions' }) {
  if (!videos || videos.length === 0) return null;

  return (
    <section>
      <p className="marginalia">{title}</p>
      <p className="mt-3 text-sm leading-relaxed text-[var(--color-ink-soft)]">
        If you would rather be talked through it than read it. These are other people's videos on
        YouTube — nothing loads until you press play.
      </p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {videos.map((video) => (
          <VideoCard key={video.id} video={video} accentName={accentName} />
        ))}
      </div>
    </section>
  );
}

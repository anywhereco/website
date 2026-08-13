import { useEffect, useRef, useState } from 'react';

interface Slide {
  img: string;
  caption: string;
  sub: string;
  label: string;
}

const SLIDES: Slide[] = [
  { img: '/assets/screenshot-1945.png', caption: 'December 3rd, 1945', sub: 'Germany is really upset, apparently', label: '1945: Testing map' },
  { img: '/assets/screenshot-front.png', caption: 'The Rhineland', sub: 'Hatched red shows demilitarized territory', label: 'Contested fronts' },
  { img: '/assets/screenshot-poland-chat.png', caption: 'Poland Fan Club convention', sub: 'You should join the fanclub', label: 'Chat & diplomacy' },
  { img: '/assets/screenshot-tools.png', caption: 'Brush tools & palette', sub: 'Paint borders and found cities', label: 'Brush tools' },
  { img: '/assets/screenshot-map.png', caption: 'Caucasus map', sub: 'Woah, Artsakh is back', label: 'Caucasus map' },
];

const PERIOD = 5500;

export default function PreviewShowcase() {


  const [idx, setIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const rootRef = useRef<HTMLElement>(null);
  const thumbRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    startTimer();
    const onVis = () => {
      if (document.hidden) stopTimer();
      else startTimer();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      stopTimer();
      document.removeEventListener('visibilitychange', onVis);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setProgress(0);
  }, [idx]);

  useEffect(() => {
    thumbRefs.current[idx]?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [idx]);

  function startTimer() {
    stopTimer();
    timer.current = setInterval(() => {
      setProgress((p) => {
        const next = p + 80;
        if (next >= PERIOD) {
          setIdx((i) => (i + 1) % SLIDES.length);
          return 0;
        }
        return next;
      });
    }, 80);
  }
  function stopTimer() {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
  }

  function goto(i: number) {
    setIdx((i + SLIDES.length) % SLIDES.length);
    setProgress(0);
    startTimer();
  }

  function openLightbox() {
    const url = SLIDES[idx].img;
    const lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.innerHTML = `<button class="close" aria-label="Close">✕</button><img alt="${SLIDES[idx].caption}" src="${url}" />`;
    const close = () => lb.remove();
    lb.addEventListener('click', (e) => {
      if (e.target === lb || (e.target as HTMLElement).classList.contains('close')) close();
    });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close();
        document.removeEventListener('keydown', onKey);
      }
    };
    document.addEventListener('keydown', onKey);
    document.body.appendChild(lb);
  }

  return (
    <section
      id="previewShowcase"
      ref={rootRef}
      className="chalk-card preview-showcase reveal"
      tabIndex={0}
      aria-label="Preview footage carousel"
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') goto(idx - 1);
        if (e.key === 'ArrowRight') goto(idx + 1);
      }}
    >
      <div
        className="preview-stage"
        aria-live="polite"
        onClick={(e) => {
          if ((e.target as HTMLElement).closest('.stage-nav')) return;
          openLightbox();
        }}
        onMouseEnter={stopTimer}
        onMouseLeave={startTimer}
      >
        {SLIDES.map((s, i) => (
          <div
            key={i}
            className={'slide' + (i === idx ? ' active' : '')}
            style={{ backgroundImage: `url('${s.img}')` }}
            data-full={s.img}
          ></div>
        ))}

        <button className="stage-nav prev" aria-label="Previous slide" onClick={() => goto(idx - 1)}>
          ‹
        </button>
        <button className="stage-nav next" aria-label="Next slide" onClick={() => goto(idx + 1)}>
          ›
        </button>

        <div className="stage-overlay">
          <p className="caption">{SLIDES[idx].caption}</p>
          <p className="sub">{SLIDES[idx].sub}</p>
        </div>

        <div className="preview-progress">
          <div className="bar" style={{ width: Math.min(100, (progress / PERIOD) * 100) + '%' }}></div>
        </div>
      </div>

      <div className="preview-thumbs" role="tablist" aria-label="Footage chapters">
        {SLIDES.map((s, i) => (
          <div
            key={i}
            ref={(el) => (thumbRefs.current[i] = el)}
            className={'thumb' + (i === idx ? ' active' : '')}
            style={{ backgroundImage: `url('${s.img}')` }}
            data-caption={s.caption}
            data-sub={s.sub}
            tabIndex={0}
            onClick={() => goto(i)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                goto(i);
              }
            }}
          >
            <span className="label">{s.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

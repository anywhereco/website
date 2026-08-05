import { useEffect, useRef, useState } from 'react';
import { useSession, useAvatar } from './hooks';
import { getTier, TIER_LABEL } from '../lib/store';
import { buildBallSVG } from '../lib/countryballs';
import { FiIcon } from './icons';

interface NavItem {
  href: string;
  label: string;
}

const NAV: NavItem[] = [
  { href: '/home', label: 'Home' },
  { href: '/play', label: 'Play' },
  { href: '/store', label: 'Store' },
  { href: '/avatar', label: 'Avatar' },
  { href: '/updates', label: 'Updates' },
  { href: '/about', label: 'About' },
];

const SOCIAL = [
  { href: '/friends', label: 'Friends', sub: 'Manage your roster', icon: 'friends' },
  { href: '/chat', label: 'Chat', sub: 'Town Square & DMs', icon: 'chat' },
  { href: '/search', label: 'Find player', sub: 'Search by username', icon: 'search' },
];

const SETTINGS_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>';

export default function TopBar({ active = '' }: { active?: string }) {
  const session = useSession();
  const avatar = useAvatar();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [socialOpen, setSocialOpen] = useState(false);
  const popRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  const tier = getTier();
  const name = session?.username || 'Guest';
  const brandHref = active === 'play' ? '/play' : '/home';

  function normalize(route: string) {
    const parts = route.split('/').filter(Boolean);
    return '/' + (parts.pop() || 'home');
  }
  const current = normalize(typeof window !== 'undefined' ? window.location.pathname : '/home');
  const socialActive = SOCIAL.some((s) => s.href === current);

  useEffect(() => {
    if (!socialOpen) return;
    function onDoc(e: MouseEvent) {
      const t = e.target as HTMLElement;
      if (popRef.current?.contains(t) || toggleRef.current?.contains(t)) return;
      setSocialOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setSocialOpen(false);
    }
    document.addEventListener('click', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [socialOpen]);

  // Position the popover under the toggle, centered.
  useEffect(() => {
    if (!socialOpen || !popRef.current || !toggleRef.current) return;
    const rect = toggleRef.current.getBoundingClientRect();
    const pop = popRef.current;
    pop.style.left = '0px';
    pop.style.top = '0px';
    const popRect = pop.getBoundingClientRect();
    const width = popRect.width || 260;
    const margin = 8;
    const center = rect.left + rect.width / 2;
    let left = center - width / 2;
    const maxLeft = window.innerWidth - width - margin;
    if (left < margin) left = margin;
    if (left > maxLeft) left = maxLeft;
    const top = rect.bottom + 12;
    pop.style.left = left + 'px';
    pop.style.top = top + 'px';
    const arrowX = Math.max(14, Math.min(width - 14, center - left));
    pop.style.setProperty('--arrow-x', arrowX + 'px');
  }, [socialOpen]);

  const avatarMarkup = avatar
    ? buildBallSVG(avatar, { size: 30 })
    : null;

  return (
    <header className={'topbar' + (mobileOpen ? ' mobile-open' : '')}>
      <div className="inner">
        <div className="topbar-left">
          <a className="brand" href={active === 'home' ? '/home' : brandHref} aria-label="Heredita — Home">
            <img src="/assets/heredita-icon.webp" alt="" />
            <span className="brand-name">Heredita</span>
          </a>
          <button
            className="nav-toggle"
            aria-label="Toggle navigation"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
          >
            Menu
          </button>
          <nav aria-label="Primary">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} className={current === n.href ? 'active' : undefined}>
                {n.label}
              </a>
            ))}
            <button
              ref={toggleRef}
              type="button"
              className={'social-toggle' + (socialActive ? ' has-active' : '')}
              aria-haspopup="true"
              aria-expanded={socialOpen}
              onClick={(e) => {
                e.stopPropagation();
                setSocialOpen((v) => !v);
              }}
            >
              <span>Social</span>
              <svg className="caret" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="2,4 6,8 10,4" />
              </svg>
            </button>
          </nav>
        </div>
        <div className="topbar-right">
          <div className="coin-chip" title="In-game currency — coming soon">
            <span className="coin" aria-hidden="true"></span>
            <span>0</span>
            <span className="soon">coming soon</span>
          </div>
          <div className="user-chip">
            <span
              className={'avatar' + (avatarMarkup ? ' countryball' : '')}
              dangerouslySetInnerHTML={avatarMarkup ? { __html: avatarMarkup } : undefined}
            >
              {avatarMarkup ? null : name.charAt(0).toUpperCase()}
            </span>
            <div className="user-block">
              <span className="name">{name}</span>
              <a
                href="/membership"
                className="tier-badge"
                data-tier={tier}
                aria-label={'Membership tier: ' + TIER_LABEL[tier] || tier}
              >
                {tier === 'emperor' ? <span className="crown" aria-hidden="true"></span> : null}
                {TIER_LABEL[tier] || tier}
              </a>
            </div>
          </div>
          <a
            className={'btn-icon' + (current === '/settings' ? ' active' : '')}
            href="/settings"
            aria-label="Settings"
            dangerouslySetInnerHTML={{ __html: SETTINGS_ICON }}
          />
        </div>
      </div>

      {socialOpen && (
        <div ref={popRef} id="socialPopover" className="social-popover open" role="menu">
          {SOCIAL.map((s) => (
            <a
              key={s.href}
              role="menuitem"
              href={s.href}
              className={current === s.href ? 'active' : undefined}
              aria-current={current === s.href ? 'page' : undefined}
            >
              <span className="sp-icon">
                <FiIcon name={s.icon} />
              </span>
              <span className="sp-label">
                {s.label}
                <span className="sp-sub">{s.sub}</span>
              </span>
            </a>
          ))}
        </div>
      )}
    </header>
  );
}

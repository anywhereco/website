import { useCallback, useEffect, useRef, useState } from 'react';
import { useSession } from './hooks';
import { TIER_LABEL, clearSession } from '../lib/store';

const USER_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="3.6"/><path d="M4.6 20.6a7.4 7.4 0 0 1 14.8 0"/></svg>';

interface NavTab {
  label: string;
  href?: string;
}
const BASE_TABS: NavTab[] = [
  { label: 'Home', href: '/home' },
  { label: 'Play', href: '/play' },
  // Store and Avatar pages are removed for now - keep the tabs in the source
  // as a record but don't render them (they no longer have a page behind them).
  // { label: 'Store', href: '/store' },
  // { label: 'Avatar', href: '/avatar' },
];

type IconName =
  | 'home' | 'play' | 'store' | 'avatar' | 'social' | 'updates' | 'about'
  | 'friends' | 'chat' | 'search'
  | 'membership' | 'countryball' | 'settings' | 'signin' | 'signout';

const ICON: Record<IconName, string> = {
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 10.4 12 3.2l9 7.2"/><path d="M5.6 9.4V20.8h12.8V9.4"/><path d="M10 20.8v-5.2h4v5.2"/></svg>',
  play: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="7 3.6 20 12 7 20.4"/></svg>',
  store: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4.2 8h15.6l-1.3 12.4H5.5z"/><path d="M9 8V6.2a3 3 0 0 1 6 0V8"/></svg>',
  avatar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="3.8"/><path d="M4.4 20.6a7.6 7.6 0 0 1 15.2 0"/></svg>',
  social: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9.2" cy="8" r="3.5"/><path d="M2.8 20.4a6.4 6.4 0 0 1 12.8 0"/><path d="M16.4 4.9a3.5 3.5 0 0 1 0 6.6"/><path d="M18.2 14.6a6.4 6.4 0 0 1 3 5.4"/></svg>',
  updates: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5.4 3.6h9.8L19 7.4v13H5.4z"/><path d="M14.8 3.6v4h4"/><path d="M8.6 12.4h7M8.6 16.2h4.6"/></svg>',
  about: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8.8"/><path d="M12 11.2v5.4"/><path d="M12 7.6h.01"/></svg>',
  friends: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 20.6v-1.8a4 4 0 0 0-4-4H5.6a4 4 0 0 0-4 4v1.8"/><circle cx="8.8" cy="7.2" r="3.8"/><path d="M19.4 8v5.4M22.1 10.7h-5.4"/></svg>',
  chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.6 14.6a2 2 0 0 1-2 2H7.4l-4 4V5.4a2 2 0 0 1 2-2h13.2a2 2 0 0 1 2 2z"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="6.8"/><path d="M20.6 20.6 16 16"/></svg>',
  membership: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.4 18.4 5.2 8.2l4.8 3.8L12 5.4l2 6.6 4.8-3.8 1.8 10.2z"/><path d="M3.8 21.2h16.4"/></svg>',
  countryball: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="3.8"/><path d="M4.4 20.6a7.6 7.6 0 0 1 15.2 0"/></svg>',
  settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.1 14.8a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5v.2a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.2a1.6 1.6 0 0 0 1.4-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.2a1.6 1.6 0 0 0 1 1.4 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1h.2a2 2 0 1 1 0 4h-.2a1.6 1.6 0 0 0-1.4 1z"/></svg>',
  signin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.4 3.6h4.2a2 2 0 0 1 2 2v12.8a2 2 0 0 1-2 2h-4.2"/><path d="M8.2 16.6 3.6 12l4.6-4.6"/><path d="M3.6 12h11.2"/></svg>',
  signout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9.6 20.4H5.4a2 2 0 0 1-2-2V5.6a2 2 0 0 1 2-2h4.2"/><path d="M15.8 16.6 20.4 12l-4.6-4.6"/><path d="M20.4 12H9.2"/></svg>',
};

const SOCIAL_ITEMS = [
  //{ href: '/friends', label: 'Friends', sub: 'Requests and your roster', icon: 'friends' as IconName },
  { href: '/chat', label: 'Chat', sub: 'Town Square and DMs', icon: 'chat' as IconName },
  //{ href: '/search', label: 'Find a player', sub: 'Look someone up by name', icon: 'search' as IconName },
];

function pageName(): string {
  return (window.location.pathname.split('/').pop() || '').toLowerCase();
}

export default function TopBar() {
  const session = useSession();
  const [openGroup, setOpenGroup] = useState<'social' | 'account' | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [markerLive, setMarkerLive] = useState(false);
  const [here, setHere] = useState('');
  const navRef = useRef<HTMLElement>(null);
  const markerRef = useRef<HTMLSpanElement>(null);
  const scrollLock = useRef<string | null>(null);

  useEffect(() => {
    setHere(pageName());
  }, []);

  const signedIn = !!(session && session.token && !session.guest && session.username);
  const tier = session ? session.tier || (session.guest ? 'guest' : 'regular') : 'guest';
  const name = session?.username || 'Guest';

  const isSocialPage = SOCIAL_ITEMS.some((s) => s.href.split('/').pop() === here);

  // ---- sliding chalk dash ----
  const moveMarker = useCallback((el: HTMLElement | null, hovering: boolean) => {
    const nav = navRef.current;
    const marker = markerRef.current;
    if (!nav || !marker) return;
    if (window.matchMedia('(max-width: 900px)').matches) return;
    if (!el) {
      marker.style.width = '0px';
      return;
    }
    const navBox = nav.getBoundingClientRect();
    const tabBox = el.getBoundingClientRect();
    const inset = 9;
    marker.style.width = Math.max(0, tabBox.width - inset * 2) + 'px';
    marker.style.transform = 'translateX(' + (tabBox.left - navBox.left + inset) + 'px)';
    nav.classList.toggle('marker-hover', hovering);
  }, []);

  const settle = useCallback(
    (instant: boolean) => {
      const nav = navRef.current;
      if (!nav) return;
      if (instant && markerRef.current) markerRef.current.style.transition = 'none';
      moveMarker(nav.querySelector<HTMLElement>('.nav-tab.active'), false);
      if (instant && markerRef.current) {
        void markerRef.current.offsetWidth;
        markerRef.current.style.transition = '';
      }
    },
    [moveMarker]
  );

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const onEnter = (e: PointerEvent) => {
      const tab = (e.target as HTMLElement).closest<HTMLElement>('.nav-tab');
      if (tab) moveMarker(tab, true);
    };
    const onFocus = (e: FocusEvent) => {
      const tab = (e.target as HTMLElement).closest<HTMLElement>('.nav-tab');
      if (tab) moveMarker(tab, true);
    };
    const onLeave = () => settle(false);
    nav.addEventListener('pointerenter', onEnter, true);
    nav.addEventListener('focusin', onFocus);
    nav.addEventListener('pointerleave', onLeave);
    nav.addEventListener('focusout', () => {
      setTimeout(() => {
        if (nav && !nav.contains(document.activeElement)) settle(false);
      }, 0);
    });
    window.addEventListener('resize', () => settle(true));
    settle(true);
    setMarkerLive(true);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => settle(true));
    }
    return () => {
      nav.removeEventListener('pointerenter', onEnter, true);
      nav.removeEventListener('focusin', onFocus);
      nav.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('resize', settle);
    };
  }, [moveMarker, settle]);

  // ---- close menus on outside click / Escape ----
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!document.querySelector('.topbar')?.contains(e.target as Node)) {
        setOpenGroup(null);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpenGroup(null);
        setMenuOpen(false);
      }
    }
    document.addEventListener('click', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  function toggleGroup(g: 'social' | 'account') {
    setOpenGroup((cur) => (cur === g ? null : g));
  }

  function toggleDrawer() {
    setMenuOpen((open) => {
      const next = !open;
      document.body.classList.toggle('nav-open', next);
      if (next) {
        scrollLock.current = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
      } else {
        if (scrollLock.current !== null) document.body.style.overflow = scrollLock.current;
        scrollLock.current = null;
        setOpenGroup(null);
      }
      return next;
    });
  }
  function closeDrawer() {
    if (!menuOpen) return;
    document.body.classList.remove('nav-open');
    if (scrollLock.current !== null) document.body.style.overflow = scrollLock.current;
    scrollLock.current = null;
    setOpenGroup(null);
    setMenuOpen(false);
  }

  function onSignout() {
    clearSession();
    window.location.href = '/';
  }

  const tabActive = (href?: string) => href && href.split('/').pop() === here;

  return (
    <header className={'topbar' + (menuOpen ? ' menu-open' : '')}>
      <div className="topbar-inner">
        <a className="brand" href="/home" aria-label="Heredita — home">
          <img className="brand-mark" src="/assets/heredita-icon.webp" alt="" />
          <span className="brand-text">
            <span className="brand-name">H<span className="brand-small-name">EREDIT</span>A</span>
          </span>
        </a>

        <button
          className="nav-toggle"
          type="button"
          aria-label="Menu"
          aria-controls="primaryNav"
          aria-expanded={menuOpen}
          onClick={toggleDrawer}
        >
          <span></span>
        </button>

        <nav className={'primary-nav' + (markerLive ? ' marker-live' : '')} id="primaryNav" aria-label="Primary" ref={navRef}>
          {BASE_TABS.map((t) => (
            <a
              key={t.href}
              className={'nav-tab' + (tabActive(t.href) ? ' active' : '')}
              href={t.href}
              aria-current={tabActive(t.href) ? 'page' : undefined}
            >
              <span dangerouslySetInnerHTML={{ __html: ICON[t.label.toLowerCase() as IconName] }} />
              <span>{t.label}</span>
            </a>
          ))}

          <div className={'nav-group' + (openGroup === 'social' ? ' open' : '')}>
            <button
              className={'nav-tab' + (isSocialPage ? ' active' : '')}
              type="button"
              aria-haspopup="true"
              aria-expanded={openGroup === 'social'}
              onClick={(e) => {
                e.stopPropagation();
                toggleGroup('social');
              }}
            >
              <span dangerouslySetInnerHTML={{ __html: ICON.social }} />
              <span>Social</span>
              <svg className="caret" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="4 6.5 8 10.5 12 6.5" />
              </svg>
            </button>
            <div className="nav-menu" id="socialMenu" role="menu">
              {SOCIAL_ITEMS.map((s) => (
                <a
                  key={s.href}
                  role="menuitem"
                  href={s.href}
                  className={tabActive(s.href) ? 'active' : undefined}
                  aria-current={tabActive(s.href) ? 'page' : undefined}
                >
                  <span className="sp-icon" dangerouslySetInnerHTML={{ __html: ICON[s.icon] }} />
                  <span className="sp-label">
                    {s.label}
                    <span className="sp-sub">{s.sub}</span>
                  </span>
                </a>
              ))}
            </div>
          </div>

          <a className={'nav-tab' + (tabActive('/updates') ? ' active' : '')} href="/updates" aria-current={tabActive('/updates') ? 'page' : undefined}>
            <span dangerouslySetInnerHTML={{ __html: ICON.updates }} />
            <span>Updates</span>
          </a>
          <a className={'nav-tab' + (tabActive('/about') ? ' active' : '')} href="/about" aria-current={tabActive('/about') ? 'page' : undefined}>
            <span dangerouslySetInnerHTML={{ __html: ICON.about }} />
            <span>About</span>
          </a>

          <span className={'nav-marker' + (markerLive ? '' : '')} aria-hidden="true" ref={markerRef}></span>
        </nav>

        <div className="topbar-right">
          <span className="coin-chip" title="you can't get these yet">
            <span className="coin" aria-hidden="true"></span>0
          </span>

          <div className={'nav-group' + (openGroup === 'account' ? ' open' : '')}>
            <button
              className="user-chip"
              type="button"
              aria-haspopup="true"
              aria-label="Your account"
              aria-expanded={openGroup === 'account'}
              onClick={(e) => {
                e.stopPropagation();
                toggleGroup('account');
              }}
            >
              <span className="avatar" dangerouslySetInnerHTML={{ __html: USER_ICON }}></span>
              <span className="user-block">
                <span className="name">{name}</span>
                <span className="tier-badge" data-tier={tier} hidden={tier === 'guest'}>
                  {TIER_LABEL[tier] || tier}
                </span>
              </span>
            </button>
            <div className="nav-menu align-right" id="accountMenu" role="menu">
              <span className="menu-head">Your account</span>
              <span className="menu-rule" aria-hidden="true"></span>
              <a role="menuitem" href="/" data-account-signin hidden={signedIn}>
                <span className="mi-icon" dangerouslySetInnerHTML={{ __html: ICON.signin }} />
                Sign in
              </a>
              <button role="menuitem" type="button" data-account-signout hidden={!signedIn} onClick={onSignout}>
                <span className="mi-icon" dangerouslySetInnerHTML={{ __html: ICON.signout }} />
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

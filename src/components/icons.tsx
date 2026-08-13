/* Small inline SVG icons used across the site. */

interface IconDef {
  name: string;
  svg: string;
}

function path(d: string, extra = '') {
  return `<path d="${d}"${extra}/>`;
}

const ICONS: Record<string, string> = {
  friends: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/>${path('M20 8v6M23 11h-6')}</svg>`,
  chat: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
  search: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/>${path('M21 21l-4.3-4.3')}</svg>`,
};

export function FiIcon({ name, size = 18 }: { name: string; size?: number }) {
  const markup = ICONS[name] || '';
  return <span className="fi-icon" dangerouslySetInnerHTML={{ __html: markup }} aria-hidden="true" />;
}

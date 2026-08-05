import { useMemo, useState } from 'react';
import {
  FLAGS,
  MODERN_IDS,
  ALT_IDS,
  isCountryLocked,
  DEFAULT_AVATAR,
  getAvatar as loadAvatar,
  buildBallSVG,
  buildFlagPreviewSVG,
  sanitizeToUnlocked,
} from '../lib/countryballs';
import { saveAvatar as persistAvatar, clearAvatar, avatarStore, toast } from '../lib/store';
import { useAvatar } from './hooks';

export default function AvatarCustomizer() {
  const currentAvatar = useAvatar();
  const initial = useMemo(() => currentAvatar || { ...DEFAULT_AVATAR }, [currentAvatar]);
  const [country, setCountry] = useState(initial.country);
  const [tab, setTab] = useState<'modern' | 'alt'>('modern');
  const [search, setSearch] = useState('');
  const [flash, setFlash] = useState<string | null>(null);

  const pool = tab === 'modern' ? MODERN_IDS : ALT_IDS;
  const visible = search
    ? pool.filter((id) => FLAGS[id].name.toLowerCase().includes(search.toLowerCase()))
    : pool;

  const state = {
    country,
    hat: initial.hat || 'none',
    eyes: initial.eyes || 'default',
    mouth: initial.mouth || 'none',
    prop: initial.prop || 'none',
  };

  function flashLockMsg(msg: string) {
    toast('🔒 ' + msg, 1800);
    setFlash(msg);
    setTimeout(() => setFlash(null), 1800);
  }

  function onSave() {
    persistAvatar(sanitizeToUnlocked(state));
    avatarStore.notify();
    toast('✓ Avatar saved!');
  }

  function onReset(e: React.MouseEvent) {
    e.preventDefault();
    clearAvatar();
    avatarStore.notify();
    setCountry(DEFAULT_AVATAR.country);
    toast('Avatar reset.');
  }

  function onRandomize() {
    flashLockMsg('Randomize unlocks with the rest of the customizer.');
  }

  return (
    <section id="avatarRoot" className="avatar-layout reveal">
      {/* COLUMN A: country picker */}
      <aside className="chalk-card avatar-col reveal delay-1">
        <h3>Country</h3>
        <input
          id="countrySearch"
          type="search"
          className="country-search"
          placeholder="Search countries…"
          aria-label="Search countries"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="country-tabs" role="tablist" aria-label="Country category">
          <button type="button" className={tab === 'modern' ? 'active' : ''} onClick={() => setTab('modern')}>
            Modern
          </button>
          <button type="button" className={tab === 'alt' ? 'active' : ''} onClick={() => setTab('alt')}>
            Alt-History
          </button>
        </div>
        <div id="countryGrid" className="country-grid" role="listbox" aria-label="Countries">
          {visible.length === 0 && (
            <p className="muted" style={{ gridColumn: '1/-1', textAlign: 'center', padding: 14 }}>
              No countries match "{search}".
            </p>
          )}
          {visible.map((id) => {
            const locked = isCountryLocked(id);
            const cls = ['country-chip'];
            if (id === country) cls.push('active');
            if (locked) cls.push('locked');
            return (
              <button
                key={id}
                type="button"
                className={cls.join(' ')}
                title={locked ? 'Locked — coming soon' : FLAGS[id].name}
                aria-disabled={locked || undefined}
                onClick={() => {
                  if (locked) {
                    flashLockMsg('That country is locked — coming soon.');
                    return;
                  }
                  setCountry(id);
                }}
              >
                <span dangerouslySetInnerHTML={{ __html: buildFlagPreviewSVG(id, { size: 56 }) }} />
                <span className="name">
                  {FLAGS[id].name}
                  {locked ? ' 🔒' : ''}
                </span>
              </button>
            );
          })}
        </div>
      </aside>

      {/* COLUMN B: live preview */}
      <section className="chalk-card avatar-col avatar-preview reveal delay-2">
        <h2 id="previewName" className="country-name">
          {FLAGS[country].name}
        </h2>
        <div id="previewStage" className="avatar-stage" aria-live="polite">
          <span dangerouslySetInnerHTML={{ __html: buildBallSVG(state, { size: 360 }) }} />
        </div>
        <div className="avatar-actions">
          <button id="saveAvatar" type="button" className="btn btn-primary" onClick={onSave}>
            💾 Save Avatar
          </button>
          <button id="randomAvatar" type="button" className="btn" onClick={onRandomize}>
            🎲 Randomize
          </button>
          <a id="resetAvatar" href="#" className="muted" style={{ alignSelf: 'center' }} onClick={onReset}>
            reset
          </a>
        </div>
        <p className="muted" style={{ fontSize: '.95rem', maxWidth: '36ch' }}>
          Your countryball appears in the top-right of every page across Heredita.
        </p>
      </section>

      <aside className="chalk-card avatar-col reveal delay-3">
        <h3>Accessories</h3>
        <p className="muted" style={{ fontSize: '.9rem' }}>
          Accessory picker arrives with the paid release — the free seasonal top hat is applied
          automatically for Regular members.
        </p>
      </aside>
    </section>
  );
}

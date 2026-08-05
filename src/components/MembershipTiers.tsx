import { getTier, canSwitchTier, toast } from '../lib/store';
import { setTier as applyTier } from '../lib/modals';
import { useSession } from './hooks';

export default function MembershipTiers() {
  useSession();
  const current = getTier();

  function onClick(tier: string, e: React.MouseEvent) {
    e.preventDefault();
    if (tier === current) return;
    const ok = applyTier(tier);
    if (ok) {
      toast('✓ Switched to ' + tier.charAt(0).toUpperCase() + tier.slice(1) + ' tier.');
    }
  }

  return (
    <div className="tier-grid">
      {/* GUEST */}
      <article className="chalk-card tier-card reveal delay-1">
        <h3 className="tier-name">Guest</h3>
        <p className="tier-tagline">No account. Jump in and paint.</p>
        <p className="tier-price">
          Free <small>no sign-up required</small>
        </p>
        <ul>
          <li>Full Sandbox &amp; Alternate History modes</li>
          <li>All 30 modern countryballs</li>
          <li>All 12 alt-history flags</li>
          <li>Avatar customization (basic accessories)</li>
          <li>Unlimited saves (for now)</li>
          <li className="muted-perk">No monthly currency drops</li>
          <li className="muted-perk">No free seasonal items</li>
        </ul>
        <div className="tier-cta">
          <button
            type="button"
            className={current === 'guest' ? 'btn current-tier' : 'btn'}
            data-tier-target="guest"
            onClick={(e) => onClick('guest', e)}
          >
            {current === 'guest' ? '✓ Your current tier' : 'Stay as Guest'}
          </button>
        </div>
      </article>

      {/* REGULAR (featured) */}
      <article className="chalk-card tier-card featured reveal delay-2">
        <span className="ribbon">Most popular</span>
        <h3 className="tier-name">Regular</h3>
        <p className="tier-tagline">Make an account, get more stuff.</p>
        <p className="tier-price">
          Free <small>account required</small>
        </p>
        <ul>
          <li>Everything in Guest</li>
          <li>
            <strong>Monthly Heredita Coins drop</strong>
          </li>
          <li>
            <strong>🎩 Free top-hat accessory</strong> — every Regular member gets it, until{' '}
            <strong>Aug 28, 2026</strong>
          </li>
          <li>Profile saved across devices</li>
          <li>Unlimited saves (will become 5 later for non-Emperor)</li>
          <li className="muted-perk">Private servers</li>
          <li className="muted-perk">Sign-in bonus + lottery spin</li>
        </ul>
        <div className="tier-cta">
          <button
            type="button"
            className={current === 'regular' ? 'btn btn-primary current-tier' : 'btn btn-primary'}
            data-tier-target="regular"
            onClick={(e) => onClick('regular', e)}
          >
            {current === 'regular' ? '✓ Your current tier' : 'Become Regular'}
          </button>
        </div>
      </article>

      {/* EMPEROR */}
      <article className="chalk-card tier-card reveal delay-3">
        <h3 className="tier-name">Emperor</h3>
        <p className="tier-tagline">Run your own corner of the timeline.</p>
        <p className="tier-price">
          Pricing TBA <small>coming this year</small>
        </p>
        <ul>
          <li>Everything in Regular</li>
          <li>
            <strong>Larger monthly Coins drop</strong>
          </li>
          <li>
            <strong>Sign-in bonus currency</strong> on every login
          </li>
          <li>
            <strong>One-time accessory lottery spin</strong> — rare items only
          </li>
          <li>
            <strong>Rare title banner</strong> + custom name color + chat tag
          </li>
          <li>
            <strong>Host private servers</strong> with <strong>30+ players</strong>
          </li>
          <li>
            <strong>Unlimited saves</strong> — permanently
          </li>
          <li>Early access to new features</li>
        </ul>
        <div className="tier-cta">
          <button
            type="button"
            className={current === 'emperor' ? 'btn current-tier' : 'btn emperor-locked'}
            data-tier-target="emperor"
            title={current === 'emperor' ? "You're already on this tier" : 'Emperor unlocks with the paid release'}
            onClick={(e) => onClick('emperor', e)}
          >
            {current === 'emperor' ? '✓ Your current tier' : 'Notify me when Emperor opens'}
          </button>
        </div>
      </article>
    </div>
  );
}

/* Heredita — top navigation behaviour.
 *
 * Three things live here:
 *   1. the chalk dash that slides between tabs
 *   2. the dropdown panels (Social, account)
 *   3. the mobile drawer
 *
 * The markup itself is plain HTML in every page — this file only
 * enhances it, so the nav still works with JS off.
 */
(function () {
  'use strict';

  var MOBILE = '(max-width: 900px)';
  var nav, marker, topbar;
  var groups = [];
  var scrollLock = null;

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    topbar = document.querySelector('.topbar');
    if (!topbar) return;
    nav = topbar.querySelector('.primary-nav');

    markActiveTab();
    initMarker();
    initDropdowns();
    initDrawer();
    initAccountMenu();
  }

  function isMobile() { return window.matchMedia(MOBILE).matches; }

  // ---------------------------------------------------------
  // Active tab — derived from the URL so no page can get it wrong
  // ---------------------------------------------------------
  function markActiveTab() {
    if (!nav) return;
    var here = (location.pathname.split('/').pop() || 'index.html').toLowerCase();

    nav.querySelectorAll('a.nav-tab').forEach(function (a) {
      var target = (a.getAttribute('href') || '').split('/').pop().toLowerCase();
      var on = target === here;
      a.classList.toggle('active', on);
      if (on) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });

    // A dropdown's toggle lights up when you're on one of its pages.
    nav.querySelectorAll('.nav-group').forEach(function (group) {
      var toggle = group.querySelector(':scope > .nav-tab');
      var hit = null;
      group.querySelectorAll('.nav-menu a').forEach(function (a) {
        var target = (a.getAttribute('href') || '').split('/').pop().toLowerCase();
        if (target === here) {
          a.classList.add('active');
          a.setAttribute('aria-current', 'page');
          hit = a;
        }
      });
      if (toggle) toggle.classList.toggle('active', !!hit);
    });
  }

  // ---------------------------------------------------------
  // Sliding chalk dash
  // ---------------------------------------------------------
  function initMarker() {
    if (!nav) return;
    marker = nav.querySelector('.nav-marker');
    if (!marker) return;

    // `instant` places the dash without sliding it in from x=0, which is what
    // we want for the initial placement and after a resize.
    function settle(instant) {
      if (instant) marker.style.transition = 'none';
      moveMarker(nav.querySelector('.nav-tab.active'), false);
      if (instant) {
        void marker.offsetWidth; // flush, so the next move animates again
        marker.style.transition = '';
      }
    }

    nav.addEventListener('pointerenter', function (e) {
      var tab = e.target.closest ? e.target.closest('.nav-tab') : null;
      if (tab) moveMarker(tab, true);
    }, true);

    nav.addEventListener('focusin', function (e) {
      var tab = e.target.closest('.nav-tab');
      if (tab) moveMarker(tab, true);
    });

    nav.addEventListener('pointerleave', settle);
    nav.addEventListener('focusout', function () {
      // Let focus land somewhere before deciding where the dash goes.
      setTimeout(function () {
        if (!nav.contains(document.activeElement)) settle();
      }, 0);
    });

    window.addEventListener('resize', function () { settle(true); });

    // Place it synchronously. requestAnimationFrame never fires while the tab
    // is in the background, and a nav that only appears once you've looked at
    // it is worse than one that appears a frame early.
    settle(true);
    nav.classList.add('marker-live');

    // Web fonts land after first paint and change every tab's width.
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { settle(true); });
    }
  }

  function moveMarker(tab, hovering) {
    if (!marker || !nav) return;
    if (isMobile()) return;
    if (!tab) { marker.style.width = '0px'; return; }

    var navBox = nav.getBoundingClientRect();
    var tabBox = tab.getBoundingClientRect();
    // Inset a little so the dash reads as an underline, not a bar.
    var inset = 9;
    marker.style.width = Math.max(0, tabBox.width - inset * 2) + 'px';
    marker.style.transform = 'translateX(' + (tabBox.left - navBox.left + inset) + 'px)';
    nav.classList.toggle('marker-hover', !!hovering);
  }

  // ---------------------------------------------------------
  // Dropdowns
  // ---------------------------------------------------------
  function initDropdowns() {
    groups = Array.prototype.slice.call(topbar.querySelectorAll('.nav-group'));

    groups.forEach(function (group) {
      var toggle = group.querySelector(':scope > .nav-tab, :scope > .user-chip');
      var menu = group.querySelector(':scope > .nav-menu');
      if (!toggle || !menu) return;

      toggle.setAttribute('aria-expanded', 'false');
      if (menu.id) toggle.setAttribute('aria-controls', menu.id);

      toggle.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        // The account chip stays reachable while the drawer is open, and two
        // panels down the same edge is one too many.
        if (isMobile() && nav && !nav.contains(toggle)) closeDrawer();
        toggleGroup(group, !group.classList.contains('open'));
      });

      toggle.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          toggleGroup(group, true);
          focusItem(menu, 0);
        }
      });

      menu.addEventListener('keydown', function (e) {
        var items = itemsOf(menu);
        var i = items.indexOf(document.activeElement);
        if (e.key === 'ArrowDown') { e.preventDefault(); focusItem(menu, i + 1); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); focusItem(menu, i - 1); }
        else if (e.key === 'Escape') { closeAll(); toggle.focus(); }
        else if (e.key === 'Tab' && !e.shiftKey && i === items.length - 1) closeAll();
      });
    });

    document.addEventListener('click', function (e) {
      if (!topbar.contains(e.target)) closeAll();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeAll();
    });
  }

  function toggleGroup(group, open) {
    groups.forEach(function (g) {
      if (g !== group) setOpen(g, false);
    });
    setOpen(group, open);
  }

  function setOpen(group, open) {
    group.classList.toggle('open', open);
    var toggle = group.querySelector(':scope > .nav-tab, :scope > .user-chip');
    if (toggle) toggle.setAttribute('aria-expanded', String(open));
    if (open) pointNotch(group);
  }

  function closeAll() { groups.forEach(function (g) { setOpen(g, false); }); }

  // Aim the little chalk notch at the middle of whatever opened the menu.
  function pointNotch(group) {
    var toggle = group.querySelector(':scope > .nav-tab, :scope > .user-chip');
    var menu = group.querySelector(':scope > .nav-menu');
    if (!toggle || !menu) return;
    // Menus inside the drawer flatten into accordions on mobile and have no
    // notch to aim; the account menu stays a real dropdown, so it still does.
    if (getComputedStyle(menu).position === 'static') return;
    var t = toggle.getBoundingClientRect();
    var m = menu.getBoundingClientRect();
    var x = Math.max(16, Math.min(m.width - 16, t.left + t.width / 2 - m.left));
    menu.style.setProperty('--notch', x + 'px');
  }

  function itemsOf(menu) {
    return Array.prototype.slice.call(menu.querySelectorAll('a, button'))
      .filter(function (el) { return el.offsetParent !== null; });
  }

  function focusItem(menu, i) {
    var items = itemsOf(menu);
    if (!items.length) return;
    items[(i + items.length) % items.length].focus();
  }

  // ---------------------------------------------------------
  // Mobile drawer
  // ---------------------------------------------------------
  function initDrawer() {
    var btn = topbar.querySelector('.nav-toggle');
    if (!btn) return;

    btn.setAttribute('aria-expanded', 'false');
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      setDrawer(btn, !topbar.classList.contains('menu-open'));
    });

    // Tapping a destination closes the drawer.
    if (nav) {
      nav.addEventListener('click', function (e) {
        if (e.target.closest('a')) closeDrawer(btn);
      });
    }

    document.addEventListener('click', function (e) {
      if (!topbar.contains(e.target)) closeDrawer(btn);
    });

    // Esc closes it too, same as the dropdowns.
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeDrawer(btn);
    });

    window.addEventListener('resize', function () {
      if (!isMobile()) closeDrawer(btn);
    });

    // Belt and braces on the one that matters: the drawer holds a scroll lock
    // on <body>, so if a rotation or a window drag crosses 900px while it's
    // open and the resize event gets coalesced away, the desktop layout is
    // left unable to scroll. This fires on the breakpoint itself.
    var mq = window.matchMedia(MOBILE);
    var onChange = function (e) { if (!e.matches) closeDrawer(btn); };
    if (mq.addEventListener) mq.addEventListener('change', onChange);
    else if (mq.addListener) mq.addListener(onChange);
  }

  function setDrawer(btn, open) {
    topbar.classList.toggle('menu-open', open);
    if (btn) btn.setAttribute('aria-expanded', String(open));
    if (!open) closeAll();

    // The scrim is a body::after, so the class has to live on <body>.
    document.body.classList.toggle('nav-open', open);

    // Without this the page keeps scrolling under the open drawer, which on a
    // phone reads as the menu having come loose from the page. Restored to
    // whatever the page had rather than a hardcoded '', so pages that set
    // their own overflow (chat) aren't clobbered.
    if (open) {
      scrollLock = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    } else if (scrollLock !== null) {
      document.body.style.overflow = scrollLock;
      scrollLock = null;
    }
  }

  function closeDrawer(btn) {
    if (!topbar.classList.contains('menu-open')) return;
    setDrawer(btn || topbar.querySelector('.nav-toggle'), false);
  }

  // ---------------------------------------------------------
  // Account menu — swaps sign-in / sign-out to match the session
  // ---------------------------------------------------------
  function initAccountMenu() {
    var menu = topbar.querySelector('#accountMenu');
    if (!menu) return;
    var S = window.HereditaSession;
    var signedIn = !!(S && S.isSignedIn && S.isSignedIn());

    var out = menu.querySelector('[data-account-signout]');
    var into = menu.querySelector('[data-account-signin]');
    if (out)  out.hidden  = !signedIn;
    if (into) into.hidden = signedIn;

    if (out) {
      out.addEventListener('click', function () {
        if (!S) return;
        S.clear();
        try { localStorage.removeItem('heredita.avatar'); } catch (_) {}
        location.href = 'index.html';
      });
    }
  }
})();

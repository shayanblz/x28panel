/* X28 Mobile — boot */
(function (global) {
  'use strict';
  const X28 = global.X28;
  const S = X28.store, U = X28.util, ui = X28.ui;

  const $ = (id) => document.getElementById(id);
  const splash = $('splash');
  const splashState = $('splash-state');

  function say(text) { if (splashState) splashState.textContent = text; }

  function showApp() {
    const app = $('app');
    if (app) app.hidden = false;
  }

  function hideSplash() {
    showApp();
    if (!splash) return;
    splash.classList.add('hide');
    setTimeout(() => { splash.hidden = true; }, 550);
  }

  function withTimeout(promise, ms, fallback) {
    return Promise.race([
      promise,
      new Promise((resolve) => setTimeout(() => resolve(fallback), ms))
    ]);
  }

  function applyKeepAwake() {
    if (U.bridge.has('setKeepAwake')) {
      try { global.Android.setKeepAwake(!!S.state.settings.keepAwake); } catch (e) {}
    }
  }

  function boot() {
    document.documentElement.classList.toggle('native', U.bridge.isNative());
    say('بارگذاری تنظیمات…');
    S.init();

    say('آماده‌سازی رابط…');
    ui.init();
    applyKeepAwake();

    /* hardware back: keep onboarding open, defer everything else to shell */
    const shellBack = global.__x28Back;
    global.__x28Back = function () {
      const ob = $('onboarding');
      if (ob && !ob.hidden) return true;
      return shellBack ? shellBack() : false;
    };

    /* keep theme + digits in sync when changed elsewhere */
    S.subscribe((state) => {
      const theme = state.settings.theme;
      if (document.documentElement.getAttribute('data-theme') !== theme) S.applyTheme(theme);
      applyKeepAwake();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (ui.sheetOpen()) ui.closeSheet();
        else if (ui.modalOpen()) document.querySelector('#modal-root [data-modal="cancel"]') && document.querySelector('#modal-root [data-modal="cancel"]').click();
      }
    });

    const fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();

    withTimeout(fontsReady, 1800, null).then(() => {
      say('شروع…');
      setTimeout(() => {
        hideSplash();
        if (!S.state.settings.onboarded) {
          X28.onboarding.show({
            onDone(settings) {
              if (settings.mode === 'device') S.switchMode('device');
              else { S.switchMode('demo'); }
              setTimeout(() => {
                ui.activate('dashboard', { force: true, silent: true });
                ui.toast('خوش آمدید! داشبورد آماده است', 'ok', 2600);
              }, 150);
            }
          });
        }
      }, 380);
    });

    /* expose for debugging in the WebView console */
    global.X28.debug = {
      state: () => S.state,
      device: X28.device,
      version: ui.version
    };

    window.addEventListener('error', (e) => {
      if (global.console) console.error('X28 error', e.message);
    });
    window.addEventListener('unhandledrejection', (e) => {
      if (global.console) console.error('X28 promise', e.reason);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})(typeof window !== 'undefined' ? window : globalThis);

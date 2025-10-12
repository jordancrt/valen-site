// === utils localStorage sécurisé ===
const LS = {
  get: (k, d=null) => {
    try { const v = localStorage.getItem(k); return v===null?d:JSON.parse(v); }
    catch { return d; }
  },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  del: (k) => { try { localStorage.removeItem(k); } catch {} },
};

// === consentement (localStorage uniquement) ===
const consentKey = 'vh-consent';
function initConsent() {
  const bar = document.getElementById('vh-consent');
  if (!bar) return;
  const consent = LS.get(consentKey, null);
  if (consent === 'accepted' || consent === 'declined') return; // déjà choisi
  bar.hidden = false;

  document.getElementById('vh-accept')?.addEventListener('click', () => {
    LS.set(consentKey, 'accepted'); bar.hidden = true;
  });
  document.getElementById('vh-decline')?.addEventListener('click', () => {
    // on n’enregistre rien d’autre, on cache juste l’info
    LS.set(consentKey, 'declined'); bar.hidden = true;
  });
}

// === préférences (devise, langue, thème) ===
const prefKey = 'vh-prefs';
function applyPrefs(prefs) {
  // thème
  const dark = !!prefs.dark;
  document.documentElement.classList.toggle('theme-dark', dark);

  // langue très simple (FR/EN) sur quelques libellés
 const dict = {
    fr: {
        start: 'Commencer maintenant',
        discover: 'Découvrir',
        badge: 'Gratuit · Local · Intelligent',
        intro: "ValenHub t’aide à suivre ton budget, visualiser ton patrimoine et comprendre tes dépenses — sans abonnement, sans cloud.",
    },
    en: {
        start: 'Get started',
        discover: 'Discover',
        badge: 'Free · Local · Smart',
        intro: "ValenHub helps you track your budget, view your assets and understand your expenses — no subscription, no cloud.",
    }
};
  };
  const lang = (prefs.lang || 'fr');
  const t = dict[lang] || dict.fr;
  (document.querySelector('[data-i18n="badge"]')||{}).textContent = t.badge;
  (document.querySelector('[data-i18n="start"]')||{}).textContent = t.start;
  (document.querySelector('[data-i18n="discover"]')||{}).textContent = t.discover; (document.querySelector('[data-i18n="intro"]')||{}).textContent = t.intro;}

function initPrefs() {
  const curEl = document.getElementById('vh-currency');
  const langEl = document.getElementById('vh-lang');
  const darkEl = document.getElementById('vh-dark');
  const saveBtn = document.getElementById('vh-save');

  if (!curEl || !langEl || !darkEl || !saveBtn) return;

  // charger
  const prefs = LS.get(prefKey, { currency:'EUR', lang:'fr', dark:true });
  curEl.value = prefs.currency || 'EUR';
  langEl.value = prefs.lang || 'fr';
  darkEl.checked = !!prefs.dark;

  applyPrefs(prefs);

  // enregistrer
  saveBtn.addEventListener('click', () => {
    const updated = {
      currency: curEl.value,
      lang: langEl.value,
      dark: darkEl.checked,
    };
    LS.set(prefKey, updated);
    applyPrefs(updated);
    saveBtn.textContent = (updated.lang === 'en') ? 'Saved' : 'Enregistré';
    setTimeout(()=>{ saveBtn.textContent = (updated.lang === 'en') ? 'Save preferences' : 'Enregistrer mes préférences'; }, 1200);
  });
}

// === modales légales (ouverture/fermeture) ===
function initModals() {
  const openTerms = document.getElementById('open-terms');
  const openPrivacy = document.getElementById('open-privacy');
  const mTerms = document.getElementById('modal-terms');
  const mPriv = document.getElementById('modal-privacy');

  function wireModal(trigger, modal) {
    if (!trigger || !modal) return;
    trigger.addEventListener('click', (e) => { e.preventDefault(); modal.hidden = false; });
    modal.querySelectorAll('[data-close]').forEach(btn =>
      btn.addEventListener('click', ()=> modal.hidden = true)
    );
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.hidden = true; });
  }

  wireModal(openTerms, mTerms);
  wireModal(openPrivacy, mPriv);
}

// === boot ===
document.addEventListener('DOMContentLoaded', () => {
  initConsent();
  initPrefs();
  initModals();
});

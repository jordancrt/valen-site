// Ombre nav au scroll
const nav=document.querySelector('.navbar');
function onScroll(){ if(!nav) return; nav.style.boxShadow=window.scrollY>4?'0 8px 24px rgba(0,0,0,.25)':'none'; }
document.addEventListener('scroll',onScroll,{passive:true}); onScroll();

// Enregistrement service worker
if('serviceWorker' in navigator){ navigator.serviceWorker.register('/sw.js').catch(()=>{}); }
// Menu burger
(function(){
  const btn = document.getElementById('navToggle');
  const drawer = document.getElementById('navDrawer');
  const backdrop = document.getElementById('navBackdrop');
  if(!btn || !drawer || !backdrop) return;

  const open = () => { drawer.classList.add('open'); backdrop.classList.add('show'); };
  const close = () => { drawer.classList.remove('open'); backdrop.classList.remove('show'); };

  btn.addEventListener('click', () => {
    drawer.classList.contains('open') ? close() : open();
  });
  backdrop.addEventListener('click', close);
  drawer.querySelectorAll('a').forEach(a => a.addEventListener('click', close));
})();

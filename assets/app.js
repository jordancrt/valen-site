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
// Apparition progressive au scroll
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if(entry.isIntersecting){
      entry.target.style.opacity = 1;
      entry.target.style.animationPlayState = 'running';
    }
  });
}, { threshold: 0.2 });

document.querySelectorAll('.hero, .cta, .risk-card').forEach(el => {
  el.style.animationPlayState = 'paused';
  observer.observe(el);
});

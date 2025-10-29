// Ombre nav au scroll
const nav=document.querySelector('.navbar');
function onScroll(){ if(!nav) return; nav.style.boxShadow=window.scrollY>4?'0 8px 24px rgba(0,0,0,.25)':'none'; }
document.addEventListener('scroll',onScroll,{passive:true}); onScroll();

// Enregistrement service worker
if('serviceWorker' in navigator){ navigator.serviceWorker.register('/sw.js').catch(()=>{}); }

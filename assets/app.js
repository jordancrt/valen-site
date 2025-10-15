// Petite ombre sous la nav après scroll
const nav = document.querySelector('.navbar');
let last = 0;
addEventListener('scroll', () => {
  const y = scrollY;
  nav.style.boxShadow = y > 6 ? '0 10px 30px rgba(0,0,0,.25)' : 'none';
  last = y;
});

// Révélation douce des sections
const io = new IntersectionObserver((entries)=>{
  entries.forEach(e=>{
    if(e.isIntersecting){
      e.target.classList.add('is-in');
      io.unobserve(e.target);
    }
  });
},{threshold:.12});
document.querySelectorAll('.reveal').forEach(el=>io.observe(el));

// Ancre “Découvrir”
document.querySelectorAll('a[href^="#"]').forEach(a=>{
  a.addEventListener('click', (e)=>{
    const id = a.getAttribute('href').slice(1);
    const target = document.getElementById(id);
    if(target){
      e.preventDefault();
      target.scrollIntoView({behavior:'smooth', block:'start'});
    }
  });
});

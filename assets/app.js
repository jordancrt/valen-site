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
// === ValenHub v2: stockage local minimal ===
const store = {
  get: (k, def=null) => { try { return JSON.parse(localStorage.getItem(k)) ?? def; } catch { return def; } },
  set: (k, v) => localStorage.setItem(k, JSON.stringify(v))
};

// Données initiales si vide
const data = store.get('vh-data', { assets: [], expenses: [], goals: [] });

// Exemple d’affichage rapide (placeholder)
const elSolde = document.getElementById('kpi-solde');
const elDep = document.getElementById('kpi-depenses');
if (elSolde) elSolde.textContent = (data.assets.reduce((s,a)=>s+(a.amount||0),0)).toLocaleString('fr-FR', {style:'currency',currency:'EUR'});
if (elDep) elDep.textContent = (data.expenses.reduce((s,e)=>s+(e.amount||0),0)).toLocaleString('fr-FR', {style:'currency',currency:'EUR'});

// Boutons (basiques)
const addIncome = document.getElementById('btn-add-income');
const addExpense = document.getElementById('btn-add-expense');
const importCsv = document.getElementById('btn-import-csv');

addIncome?.addEventListener('click', (e)=>{
  e.preventDefault();
  const amount = parseFloat(prompt("Montant du revenu (€) ?", "1000").replace(',', '.'));
  if (!isNaN(amount)) {
    data.assets.push({ type:'cash', label:'Revenu', amount });
    store.set('vh-data', data);
    location.reload();
  }
});

addExpense?.addEventListener('click', (e)=>{
  e.preventDefault();
  const amount = parseFloat(prompt("Montant de la dépense (€) ?", "25").replace(',', '.'));
  if (!isNaN(amount)) {
    data.expenses.push({ label:'Dépense', amount });
    store.set('vh-data', data);
    location.reload();
  }
});

importCsv?.addEventListener('click', (e)=>{
  e.preventDefault();
  alert("Import CSV à venir : format universel (date, libellé, montant, catégorie).");
});

// Activer un slot pub (plus tard via consentement CMP)
const ad = document.getElementById('ad-slot');
// ad.style.display = 'block'; // décommente quand tu veux tester l’emplacement

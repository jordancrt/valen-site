// === ValenHub Demo Data + KPIs + Charts ==========================

// Utilitaires format
const € = (n) => new Intl.NumberFormat('fr-FR', { style:'currency', currency:'EUR', maximumFractionDigits:0 }).format(n);

// Démo: si pas de data locale, on génère un portefeuille plausible
function ensureDemoData(){
  const has = localStorage.getItem('vh-demo');
  if (has) return JSON.parse(has);

  const data = {
    // montants actuels
    epargne: 8200,
    actions: 15250,
    crypto : 4200,
    immo   : 78000,
    // dépenses catégories (mois courant)
    depenses: { Logement: 950, Alimentation: 420, Transport: 160, Loisirs: 130, Divers: 90 },
    // historique patrimoine (12 mois)
    histo: Array.from({length:12}, (_,i)=> 85000 + i*1200 + (Math.random()*1500-750)),
    // objectif simplifié
    objectif: 120000
  };
  localStorage.setItem('vh-demo', JSON.stringify(data));
  return data;
}

// Rafraîchir aléatoirement (bouton)
function randomize(){
  const d = ensureDemoData();
  const mul = 0.95 + Math.random()*0.1; // +/-5%
  d.epargne = Math.round(d.epargne*mul);
  d.actions = Math.round(d.actions*(0.93 + Math.random()*0.14));
  d.crypto  = Math.round(d.crypto *(0.85 + Math.random()*0.3));
  d.immo    = Math.round(d.immo   *(0.995 + Math.random()*0.02));
  // dépenses
  Object.keys(d.depenses).forEach(k => d.depenses[k] = Math.round(d.depenses[k]*(0.9 + Math.random()*0.2)));
  // histo
  d.histo = d.histo.slice(1).concat(d.histo.at(-1)*(0.98 + Math.random()*0.05));
  localStorage.setItem('vh-demo', JSON.stringify(d));
  render();
}

// KPIs + UI
function render(){
  const d = ensureDemoData();
  const total = d.epargne + d.actions + d.crypto + d.immo;

  // KPIs
  const totalEl = document.getElementById('kpi-total');
  const varEl   = document.getElementById('kpi-variation');
  const depEl   = document.getElementById('kpi-depenses');
  const objEl   = document.getElementById('kpi-objectif');

  if (totalEl){
    totalEl.textContent = €(total);
    const prev = d.histo.at(-2) || total*0.98;
    const delta = ((total - prev) / prev) * 100;
    varEl.textContent = (delta>=0?'+':'') + delta.toFixed(1) + ' %';
    depEl.textContent = €(Object.values(d.depenses).reduce((a,b)=>a+b,0));
    const pct = Math.min(100, Math.round((total / d.objectif) * 100));
    objEl.textContent = pct + ' %';
  }

  // Actifs
  const ids = [['a-epargne','epargne'], ['a-actions','actions'], ['a-crypto','crypto'], ['a-immo','immo']];
  ids.forEach(([id,key])=>{
    const el = document.getElementById(id);
    if (el) el.textContent = €(d[key]);
  });

  // Conseils très simples
  const tip = document.getElementById('ai-tip');
  if (tip){
    const dep = Object.values(d.depenses).reduce((a,b)=>a+b,0);
    if (dep/total < 0.01) tip.textContent = "Excellent contrôle des dépenses 👏 Tu peux augmenter l’épargne automatique.";
    else if (d.crypto > d.actions*0.7) tip.textContent = "Crypto trop dominante ? Pense à rééquilibrer vers des ETF diversifiés.";
    else tip.textContent = "Objectif à portée. Réduis ‘Loisirs’ de 5% ce mois-ci pour accélérer.";
  }

  // Graphiques
  makeCharts(d);
}

// Charts
let ch1, ch2, ch3;
function makeCharts(d){
  // Détruire si existent
  [ch1,ch2,ch3].forEach(ch => ch && ch.destroy());

  const ctx1 = document.getElementById('chartPatrimoine');
  if (ctx1){
    ch1 = new Chart(ctx1, {
      type:'line',
      data:{
        labels:['-11','-10','-9','-8','-7','-6','-5','-4','-3','-2','-1','Now'],
        datasets:[{
          label:'Patrimoine',
          data:d.histo,
          tension:.35,
          borderColor:'rgba(167,139,250,1)',
          backgroundColor:'rgba(167,139,250,.18)',
          fill:true
        }]
      },
      options:{
        plugins:{ legend:{display:false}},
        scales:{ x:{ grid:{display:false}}, y:{ grid:{color:'rgba(255,255,255,.05)'}}}
      }
    });
  }

  const ctx2 = document.getElementById('chartRepartition');
  if (ctx2){
    ch2 = new Chart(ctx2, {
      type:'doughnut',
      data:{
        labels:['Épargne','Actions & ETF','Crypto','Immo'],
        datasets:[{
          data:[d.epargne, d.actions, d.crypto, d.immo],
          backgroundColor:[
            'rgba(167,139,250,.9)',
            'rgba(99,102,241,.9)',
            'rgba(59,130,246,.9)',
            'rgba(16,185,129,.9)'
          ],
          borderWidth:0
        }]
      },
      options:{ plugins:{legend:{position:'bottom'}} }
    });
  }

  const ctx3 = document.getElementById('chartDepenses');
  if (ctx3){
    const labels = Object.keys(d.depenses);
    const values = Object.values(d.depenses);
    ch3 = new Chart(ctx3, {
      type:'bar',
      data:{
        labels,
        datasets:[{
          data:values,
          backgroundColor:'rgba(167,139,250,.8)'
        }]
      },
      options:{
        plugins:{legend:{display:false}},
        scales:{ x:{grid:{display:false}}, y:{grid:{color:'rgba(255,255,255,.05)'}}}
      }
    });
  }
}

// Bouton de démo
document.addEventListener('click', (e)=>{
  if (e.target && e.target.id === 'btn-randomize') randomize();
});

// Init
document.addEventListener('DOMContentLoaded', render);

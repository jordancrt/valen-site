// ====== Helpers
const € = n => new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR'}).format(n);
function revealCanvas(id){
  const el = document.getElementById(id);
  if(!el) return;
  // supprime le skeleton (l'élément juste avant)
  const prev = el.previousElementSibling;
  if (prev && prev.classList.contains('skeleton')) prev.remove();
  el.hidden = false; // affiche le canvas
}

// ====== Données démo (tu pourras brancher plus tard)
const demo = {
  wealth: [15000,15200,15500,15800,16200,16800,17200,17800,18500,19100,19700,20500],
  expenses: [
    {label:'Logement', value: 900},
    {label:'Courses',  value: 320},
    {label:'Transport',value: 150},
    {label:'Loisirs',  value: 180},
    {label:'Santé',    value:  60}
  ],
  alloc: [
    {label:'Cash',       value:20},
    {label:'ETF',        value:50},
    {label:'Crypto',     value:15},
    {label:'Immobilier', value:15}
  ]
};

// ====== KPIs
function updateKPIs(){
  const last = demo.wealth.at(-1), prev = demo.wealth.at(-2);
  const varPct = ((last - prev) / prev) * 100;
  const spend  = demo.expenses.reduce((s,e)=>s+e.value,0);
  document.getElementById('kpi-wealth').textContent   = €(last);
  document.getElementById('kpi-change').textContent   = `${varPct>=0?'+':''}${varPct.toFixed(1)} %`;
  document.getElementById('kpi-expenses').textContent = €(spend);
  document.getElementById('kpi-goal').textContent     = Math.min(100, Math.round(last/30000*100)) + ' %';
}

// ====== Charts (Chart.js v4)
function initCharts(){
  const months = ['J','F','M','A','M','J','J','A','S','O','N','D'];

  // Ligne : Évolution patrimoine
  revealCanvas('chartWealth');
  new Chart(document.getElementById('chartWealth'), {
    type:'line',
    data:{
      labels: months,
      datasets:[{
        data: demo.wealth,
        borderColor:'#8b5cf6',
        backgroundColor:'rgba(139,92,246,.18)',
        pointRadius:0,
        tension:.35,
        fill:true
      }]
    },
    options:{
      plugins:{legend:{display:false}},
      scales:{
        x:{grid:{display:false}},
        y:{grid:{color:'rgba(255,255,255,.06)'}}
      }
    }
  });

  // Barres : Dépenses
  revealCanvas('chartExpenses');
  new Chart(document.getElementById('chartExpenses'), {
    type:'bar',
    data:{
      labels: demo.expenses.map(e=>e.label),
      datasets:[{
        data: demo.expenses.map(e=>e.value),
        backgroundColor:'rgba(99,102,241,.9)',
        borderRadius:8
      }]
    },
    options:{
      plugins:{legend:{display:false}},
      scales:{y:{beginAtZero:true}}
    }
  });

  // Doughnut : Allocation
  revealCanvas('chartAllocation');
  new Chart(document.getElementById('chartAllocation'), {
    type:'doughnut',
    data:{
      labels: demo.alloc.map(a=>a.label),
      datasets:[{
        data: demo.alloc.map(a=>a.value),
        backgroundColor:['#8b5cf6','#6366f1','#10b981','#f59e0b']
      }]
    },
    options:{
      plugins:{legend:{position:'bottom'}},
      cutout:'60%'
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  updateKPIs();
  initCharts();
});

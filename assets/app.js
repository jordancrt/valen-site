// Utilitaires
const fmt = (n)=> new Intl.NumberFormat('fr-FR',{maximumFractionDigits:0}).format(n);
const fmtMoney = (n)=> new Intl.NumberFormat('fr-FR',{style:'currency', currency:'EUR', maximumFractionDigits:0}).format(n);

// Intersection Observer pour révéler & lazy init des charts
const io = new IntersectionObserver((entries)=>{
  entries.forEach(e=>{
    if(e.isIntersecting){
      e.target.classList.add('is-in');
      // Si section chart : on initialise le canvas et on enlève le skeleton
      const canvas = e.target.querySelector('canvas');
      if(canvas && canvas.hidden){ initChart(canvas.id); }
      io.unobserve(e.target);
    }
  });
},{ threshold: .15 });

document.querySelectorAll('.reveal').forEach(el=> io.observe(el));

// Données DEMO (remplace par tes données locales plus tard)
const demo = {
  wealthSeries: Array.from({length:12}, (_,i)=> 20000 + i*1500 + Math.random()*2200),
  expensesSeries: Array.from({length:30}, ()=> 200 + Math.random()*150),
  allocation: [
    {label:'Actions', value: 45},
    {label:'Immobilier', value: 25},
    {label:'Crypto', value: 15},
    {label:'Livrets', value: 10},
    {label:'Autres', value: 5},
  ]
};

// KPIs (calculs rapides)
(function setKPIs(){
  const total = demo.wealthSeries.at(-1);
  const prev  = demo.wealthSeries.at(-2) ?? total;
  const change = ((total - prev)/prev)*100;

  document.getElementById('kpi-wealth').textContent   = fmtMoney(total);
  document.getElementById('kpi-change').textContent   = (change>=0?'+':'')+change.toFixed(1)+' %';
  document.getElementById('kpi-expenses').textContent = fmtMoney(demo.expensesSeries.reduce((a,b)=>a+b,0));
  document.getElementById('kpi-goal').textContent     = '72 %';
})();

// Init Chart on demand (Chart.js)
let _Chart;
async function initChart(id){
  if(!_Chart){
    // charge Chart.js si pas déjà là (lazy)
    const m = await import('https://cdn.jsdelivr.net/npm/chart.js');
    _Chart = m.Chart;
  }

  const canvas  = document.getElementById(id);
  const skel    = canvas.previousElementSibling;
  if(skel?.classList.contains('skeleton')) skel.remove();
  canvas.hidden = false;

  const baseOpts = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 600, easing: 'easeOutQuad' },
    plugins: {
      legend: { display: false },
      tooltip: { mode: 'index', intersect: false, displayColors: false }
    },
    scales: {
      x: { ticks: { color: 'rgba(255,255,255,.7)'}, grid:{ color:'rgba(255,255,255,.06)'} },
      y: { ticks: { color: 'rgba(255,255,255,.7)'}, grid:{ color:'rgba(255,255,255,.06)'} },
    }
  };

  if(id === 'chartWealth'){
    new _Chart(canvas.getContext('2d'), {
      type: 'line',
      data: {
        labels: Array.from({length: demo.wealthSeries.length},(_,i)=> `M${i+1}`),
        datasets: [{
          data: demo.wealthSeries,
          tension: .35,
          borderWidth: 2,
          fill: true,
          backgroundColor: 'rgba(155,89,182,.15)', // léger violet
          borderColor: 'rgba(155,89,182,1)'
        }]
      },
      options: baseOpts
    });
  }

  if(id === 'chartExpenses'){
    new _Chart(canvas.getContext('2d'), {
      type: 'bar',
      data: {
        labels: Array.from({length: demo.expensesSeries.length},(_,i)=> i+1),
        datasets: [{
          data: demo.expensesSeries,
          borderWidth: 0,
          backgroundColor: 'rgba(128,156,255,.7)'
        }]
      },
      options: {
        ...baseOpts,
        scales: { 
          ...baseOpts.scales,
          x: { ...baseOpts.scales.x, ticks: { display: false } }
        }
      }
    });
  }

  if(id === 'chartAllocation'){
    new _Chart(canvas.getContext('2d'), {
      type: 'doughnut',
      data: {
        labels: demo.allocation.map(d=>d.label),
        datasets: [{
          data: demo.allocation.map(d=>d.value),
          borderWidth: 0,
          hoverOffset: 4,
          backgroundColor: [
            'rgba(155,89,182,.9)','rgba(52,152,219,.9)','rgba(46,204,113,.9)',
            'rgba(241,196,15,.9)','rgba(231,76,60,.9)'
          ]
        }]
      },
      options: {
        plugins: { legend: { display: true, position: 'bottom', labels: { color:'rgba(255,255,255,.8)'} }},
        cutout: '62%'
      }
    });
  }
}

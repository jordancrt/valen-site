<!doctype html><html lang="fr">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>ValenHub — Profil investisseur</title>
<link rel="stylesheet" href="assets/style.css">
<script src="https://cdn.jsdelivr.net/npm/chart.js@4"></script>
</head>
<body>
<header class="navbar">
  <div class="container nav-container">
    <a class="nav-brand" href="index.html"><img src="assets/icon-192.png" alt=""><span>VALENHUB</span></a>
    <nav><ul class="nav-links">
      <li><a href="index.html">Accueil</a></li>
      <li><a href="dashboard.html">Tableau de bord</a></li>
      <li><a href="comparateur.html">Comparateur</a></li>
      <li><a class="active" href="profil.html">Profil</a></li>
    </ul></nav>
  </div>
</header>

<main class="container" style="padding:24px 0 64px">
  <section class="card">
    <div class="card-head"><h3>Questionnaire express (2 minutes)</h3></div>
    <div id="quiz">
      <p><strong>1.</strong> Si ton portefeuille perd 20 %, tu…</p>
      <div><label><input type="radio" name="q1" value="0"> réduis vite le risque</label></div>
      <div><label><input type="radio" name="q1" value="1"> attends et observes</label></div>
      <div><label><input type="radio" name="q1" value="2"> renforces la position</label></div>
      <hr style="border-color:rgba(255,255,255,.06)">
      <p><strong>2.</strong> Horizon d’investissement principal ?</p>
      <div><label><input type="radio" name="q2" value="0"> < 3 ans</label></div>
      <div><label><input type="radio" name="q2" value="1"> 3–7 ans</label></div>
      <div><label><input type="radio" name="q2" value="2"> > 7 ans</label></div>

      <div style="margin-top:12px"><button id="btnEval" class="btn btn-primary">Évaluer mon profil</button></div>
    </div>
  </section>

  <section class="card" id="result" style="display:none;margin-top:16px">
    <div class="card-head"><h3>Ton profil</h3><span class="badge" id="badge"></span></div>
    <p class="muted" id="desc"></p>
    <div class="grid-cards" style="margin-top:10px">
      <div class="card"><h3>Allocation modèle</h3><ul class="assets" id="alloc"></ul></div>
      <div class="card"><h3>Projection</h3><canvas id="proj" height="220"></canvas></div>
    </div>
    <div style="margin-top:10px"><button id="btnPush" class="btn">Ajouter au Dashboard</button></div>
  </section>
</main>

<footer class="footer"><div class="container">© 2025 ValenHub</div></footer>
<script src="assets/profil.js"></script>
</body></html>
const badge=document.getElementById('badge'),desc=document.getElementById('desc'),alloc=document.getElementById('alloc');
const btn=document.getElementById('btnEval'),res=document.getElementById('result');let chart;
function val(n){const r=document.querySelector(`input[name="${n}"]:checked`);return r?+r.value:0}
btn.addEventListener('click',()=>{const score=val('q1')+val('q2');let profil,al,txt;
if(score<=1){profil='Faible';al=[['ETF Monde',70],['Monétaire',20],['Obligations',10]];txt='Tolérance au risque faible, priorité stabilité.'}
else if(score<=3){profil='Modéré';al=[['ETF Monde',60],['ETF Thématiques',20],['Obligations',20]];txt='Équilibre rendement/risque avec horizon intermédiaire.'}
else {profil='Dynamique';al=[['ETF Monde',40],['Tech/Thématiques',30],['Crypto',30]];txt='Recherche de performance avec forte volatilité.'}
badge.textContent=profil;desc.textContent=txt;
alloc.innerHTML=al.map(([k,v])=>`<li><span>${k}</span><strong>${v}%</strong></li>`).join('');
res.style.display='block'; renderProj(al)});
function renderProj(al){const c=document.getElementById('proj').getContext('2d');const months=60;const base=10000;const dca=200;
const growth=al.reduce((s,[k,v])=>s+v*(k.includes('Crypto')?0.14:k.includes('Tech')?0.10:k.includes('Thématiques')?0.08:k.includes('Obligations')?0.03:0.07),0)/100;
const labels=[...Array(months).keys()].map(i=>`M${i+1}`);let total=base;const data=[];for(let i=0;i<months;i++){total=(total+dca)*(1+growth/12);data.push(Math.round(total))}
if(chart)chart.destroy(); chart=new Chart(c,{type:'line',data:{labels,datasets:[{data,fill:true,tension:.35,borderWidth:2}]},options:{plugins:{legend:{display:false}}})}
document.getElementById('btnPush').addEventListener('click',()=>{const favs=JSON.parse(localStorage.getItem('valenhub-favs')||'[]');favs.push({name:'Portefeuille modèle',ticker:'',type:'alloc',note:badge.textContent});localStorage.setItem('valenhub-favs',JSON.stringify(favs));alert('Ajouté au Dashboard ✔')});

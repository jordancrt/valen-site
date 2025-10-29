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

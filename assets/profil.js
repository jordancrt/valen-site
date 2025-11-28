// assets/profil.js

document.addEventListener("DOMContentLoaded", () => {

  const username   = document.getElementById("username");
  const userEmail  = document.getElementById("userEmail");
  const userCountry = document.getElementById("userCountry");
  const userRisk   = document.getElementById("userRisk");
  const userStyle  = document.getElementById("userStyle");

  // Charger les données existantes
  const data = JSON.parse(localStorage.getItem("vh-profile") || "{}");

  username.value    = data.username  || "";
  userEmail.value   = data.email     || "";
  userCountry.value = data.country   || "";
  userRisk.value    = data.risk      || "mid";
  userStyle.value   = data.style     || "diversified";

  function save(){
    localStorage.setItem("vh-profile", JSON.stringify({
      username: username.value.trim(),
      email: userEmail.value.trim(),
      country: userCountry.value,
      risk: userRisk.value,
      style: userStyle.value
    }));
  }

  [username,userEmail,userCountry,userRisk,userStyle].forEach(el => {
    el.addEventListener("input", save);
    el.addEventListener("change", save);
  });

  // reset
  document.getElementById("resetData").addEventListener("click", () => {
    if(confirm("Supprimer toutes les données ?")){
      localStorage.clear();
      location.reload();
    }
  });

  // thème (placeholder)
  document.getElementById("toggleTheme").addEventListener("click", () => {
    alert("Le mode sombre/clair sera ajouté plus tard 😄");
  });
});

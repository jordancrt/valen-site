// assets/comparateur.js

document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("q");
  const chips = document.querySelectorAll(".chip");
  const sortSelect = document.getElementById("sortSelect");
  const tbody = document.getElementById("compareBody");
  const resultCount = document.getElementById("resultCount");

  // Mini base locale (tu pourras plus tard la remplacer par tes JSON)
  const items = [
    {
      name: "Livret A",
      type: "livret",
      typeLabel: "Livret / cash",
      fees: 0.0,
      yield: 3.0,
      risk: 1
    },
    {
      name: "ETF S&P 500",
      type: "etf",
      typeLabel: "ETF / indice",
      fees: 0.07,
      yield: 7.0,
      risk: 3
    },
    {
      name: "ETF World",
      type: "etf",
      typeLabel: "ETF / indice",
      fees: 0.2,
      yield: 6.0,
      risk: 3
    },
    {
      name: "Bitcoin",
      type: "crypto",
      typeLabel: "Crypto",
      fees: 0.5,
      yield: 20.0,
      risk: 5
    },
    {
      name: "Ethereum",
      type: "crypto",
      typeLabel: "Crypto",
      fees: 0.5,
      yield: 15.0,
      risk: 5
    },
    {
      name: "Fonds euro",
      type: "autre",
      typeLabel: "Fonds euro",
      fees: 0.8,
      yield: 2.5,
      risk: 2
    }
  ];

  let currentType = "all";

  function riskLabel(score) {
    if (score <= 1) return "Très faible";
    if (score === 2) return "Faible";
    if (score === 3) return "Moyen";
    if (score === 4) return "Élevé";
    return "Très élevé";
  }

  function riskClass(score) {
    if (score <= 1) return "risk-badge risk-verylow";
    if (score === 2) return "risk-badge risk-low";
    if (score === 3) return "risk-badge risk-mid";
    if (score === 4) return "risk-badge risk-high";
    return "risk-badge risk-veryhigh";
  }

  function render() {
    const query = searchInput.value.toLowerCase().trim();
    let filtered = items.filter(item => {
      const matchesType = currentType === "all" || item.type === currentType;
      const matchesText =
        !query ||
        item.name.toLowerCase().includes(query) ||
        item.typeLabel.toLowerCase().includes(query);
      return matchesType && matchesText;
    });

    // tri
    const sort = sortSelect.value;
    filtered = [...filtered]; // copie

    if (sort === "fees") {
      filtered.sort((a, b) => a.fees - b.fees);
    } else if (sort === "yield") {
      filtered.sort((a, b) => b.yield - a.yield);
    } else if (sort === "risk") {
      filtered.sort((a, b) => a.risk - b.risk);
    }
    // "relevance" = ordre de base

    // rendu
    tbody.innerHTML = "";
    filtered.forEach(item => {
      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>${item.name}</td>
        <td>${item.typeLabel}</td>
        <td>${item.fees.toFixed(2).replace(".", ",")} %</td>
        <td>${item.yield.toFixed(1).replace(".", ",")} % / an</td>
        <td><span class="${riskClass(item.risk)}">${riskLabel(item.risk)}</span></td>
      `;

      tbody.appendChild(tr);
    });

    resultCount.textContent =
      filtered.length === 0
        ? "Aucun résultat"
        : `${filtered.length} résultat${filtered.length > 1 ? "s" : ""}`;
  }

  // events
  searchInput.addEventListener("input", render);
  sortSelect.addEventListener("change", render);

  chips.forEach(chip => {
    chip.addEventListener("click", () => {
      chips.forEach(c => c.classList.remove("chip-active"));
      chip.classList.add("chip-active");
      currentType = chip.dataset.type;
      render();
    });
  });

  render();
});

const $ = id => document.getElementById(id);

const NEEDS = {
  ruim: 1,
  bom: 2,
  craque: 1
};

const LABEL = {
  ruim: "RUIM",
  bom: "BOM",
  craque: "CRAQUE",
  goleiro: "GOLEIRO",
  capitao: "CAPITÃO"
};

// ================================================================
// 🔒 ÁREA SECRETA DE CONFIGURAÇÃO — ORGANIZADOR
// ================================================================

const SECRET_RULES = {

  // ================================================================
  // 🔒 JOGADORES RESERVADOS PARA A EQUIPE 2
  //
  // Antes da Equipe 2 eles ficam escondidos.
  // ================================================================

  reservedPlayersByTeam: {
    2: [
      "JP",
      "Moises",
      "Ygor",
      "JV",
      "Victor",
      "Davi"
    ]
  },

  // ================================================================
  // 🔒 CONFRONTOS ESPECIAIS DA EQUIPE 2
  //
  // 1ª escolha: Ygor x Moises
  // 2ª escolha: Victor x Davi
  // 3ª escolha: JV x JP
  //
  // Na 4ª escolha volta à lógica normal.
  // ================================================================

  specialPairsByTeam: {
    2: [
      ["Ygor", "Moises"],
      ["Victor", "Davi"],
      ["JV", "JP"]
    ]
  },

  specialLastOptionsByTeam: {
    2: []
  },

  // ================================================================
  // 🔒 EQUIPE 6 — JOGADORES FIXOS
  //
  // Eles nunca entram no sorteio.
  // ================================================================

  fixedTeam6Players: [
    "Allan",
    "Murillo",
    "João Gui",
    "Bellato",
    "Vinao"
  ]
};


// ================================================================
// CONFIGURAÇÃO
// ================================================================

const CONFIG = {

  // ================================================================
  // GOLEIROS
  // ================================================================

  goalkeepers: [
    {
      name: "Joel",
      image: "assets/goalkeepers/joel.png"
    },
    {
      name: "Vinicius",
      image: "assets/goalkeepers/vinicius.png"
    }
  ],

  // ================================================================
  // CAPITÃES
  //
  // Equipe 1 = Pedro
  // Equipe 2 = Bento
  // Equipe 3 = Coutinho
  // Equipes 4, 5 e 6 = sorteados entre os restantes
  //
  // Allan e Murillo NÃO são capitães.
  // ================================================================

  captains: [
    "Pedro",
    "Bento",
    "Coutinho",
    "Abner",
    "Gordo",
    "Henrique"
  ],

  // ================================================================
  // JOGADORES
  //
  // IMPORTANTE:
  // Pedro e Coutinho NÃO estão aqui porque são capitães.
  //
  // Allan, Murillo, João Gui, Bellato e Vinao
  // estão aqui somente para serem usados na Equipe 6,
  // mas serão retirados do pool no reset().
  // ================================================================

  players: [

    // RUINS
    ["JP", "ruim"],
    ["Moises", "ruim"],
    ["Vinao", "ruim"],
    ["Wallace", "ruim"],
    ["Bellato", "ruim"],
    ["Danilo", "ruim"],

    // BONS
    ["Zanardi", "bom"],
    ["Ygor", "bom"],
    ["JV", "bom"],
    ["Adan", "bom"],
    ["Gad", "bom"],
    ["Felipe", "bom"],
    ["Davi", "bom"],
    ["Joao Gabriel", "bom"],
    ["Nicolas", "bom"],
    ["Rafael", "bom"],
    ["Cadu", "bom"],
    ["Anonimo", "bom"],

    // CRAQUES
    ["Victor", "craque"],
    ["Lucas Rocha", "craque"],
    ["João Gui", "craque"],
    ["Arthur", "craque"],

    // ================================================================
    // 🔒 FIXOS DA EQUIPE 6
    // ================================================================

    ["Allan", "bom"],
    ["Murillo", "bom"]

  ].map(([name, level]) => ({
    name,
    level,
    image: `assets/cards/${slug(name)}.png`
  }))
};


// ================================================================
// ESTADO
// ================================================================

let state;


// ================================================================
// FUNÇÕES BÁSICAS
// ================================================================

function slug(s) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, "-");
}


function shuffle(arr) {
  const a = [...arr];

  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [a[i], a[j]] = [a[j], a[i]];
  }

  return a;
}


function pickRandom(arr) {
  return arr[
    Math.floor(Math.random() * arr.length)
  ];
}


function show(name) {

  document
    .querySelectorAll(".screen")
    .forEach(
      s => s.classList.remove("active")
    );

  const screen = $("screen-" + name);

  if (screen) {
    screen.classList.add("active");
  }

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}


// ================================================================
// RESET
// ================================================================

function reset() {

  // ================================================================
  // RETIRA OS FIXOS DA EQUIPE 6 DO POOL
  // ================================================================

  const fixedNames =
    SECRET_RULES.fixedTeam6Players;

  const normalPlayers =
    CONFIG.players.filter(
      p => !fixedNames.includes(p.name)
    );

  // ================================================================
  // CRIA ESTADO
  // ================================================================

  state = {

    // Jogadores que podem ser sorteados
    pool: shuffle(normalPlayers),

    // Jogadores fixos da Equipe 6
    fixedTeam6:
      CONFIG.players.filter(
        p => fixedNames.includes(p.name)
      ),

    captains: [],

    currentTeamIndex: 0,

    currentCaptain: null,

    currentTeam: null,

    choiceNumber: 0,

    choiceOptions: [],

    choiceRevealed: false,

    teams: [],

    gkRevealed: false
  };

  // ================================================================
  // CAPITÃES FIXOS
  //
  // Equipe 1 = Pedro
  // Equipe 2 = Bento
  // Equipe 3 = Coutinho
  // ================================================================

  const others = shuffle(
    CONFIG.captains.filter(
      c =>
        c !== "Pedro" &&
        c !== "Bento" &&
        c !== "Coutinho"
    )
  );

  state.captains = [
    "Pedro",
    "Bento",
    "Coutinho",
    others[0],
    others[1],
    others[2]
  ];
}


// ================================================================
// SONS
// ================================================================

function playSound(name) {

  const map = {
    reveal: "assets/sounds/reveal.mp3",
    pick: "assets/sounds/pick.mp3",
    craque: "assets/sounds/craque.mp3"
  };

  const src = map[name];

  if (!src) return;

  const a = new Audio(src);

  a.volume = 0.75;

  a.play().catch(() => {});
}


// ================================================================
// NORMALIZAÇÃO DAS CARTAS
// ================================================================

function normalizeCardImage(img) {

  if (
    img.dataset.normalized === "1" ||
    !img.complete ||
    !img.naturalWidth
  ) {
    return;
  }

  try {

    const w = img.naturalWidth;
    const h = img.naturalHeight;

    const c = document.createElement("canvas");

    c.width = w;
    c.height = h;

    const ctx = c.getContext(
      "2d",
      {
        willReadFrequently: true
      }
    );

    ctx.drawImage(
      img,
      0,
      0
    );

    const d =
      ctx.getImageData(
        0,
        0,
        w,
        h
      ).data;

    let minX = w;
    let minY = h;
    let maxX = -1;
    let maxY = -1;

    for (let y = 0; y < h; y++) {

      for (let x = 0; x < w; x++) {

        if (
          d[
            (y * w + x) * 4 + 3
          ] > 8
        ) {

          minX = Math.min(
            minX,
            x
          );

          maxX = Math.max(
            maxX,
            x
          );

          minY = Math.min(
            minY,
            y
          );

          maxY = Math.max(
            maxY,
            y
          );
        }
      }
    }

    if (maxX < 0) return;

    const pad = 2;

    minX = Math.max(
      0,
      minX - pad
    );

    minY = Math.max(
      0,
      minY - pad
    );

    maxX = Math.min(
      w - 1,
      maxX + pad
    );

    maxY = Math.min(
      h - 1,
      maxY + pad
    );

    const cw =
      maxX - minX + 1;

    const ch =
      maxY - minY + 1;

    const out =
      document.createElement("canvas");

    out.width = 707;
    out.height = 1000;

    out
      .getContext("2d")
      .drawImage(
        c,
        minX,
        minY,
        cw,
        ch,
        0,
        0,
        707,
        1000
      );

    img.src =
      out.toDataURL(
        "image/png"
      );

    img.dataset.normalized = "1";

  } catch (e) {

    img.dataset.normalized = "1";

  }
}


// ================================================================
// CRIAR CARTA
// ================================================================

function makeCard(
  person,
  { choice = false } = {}
) {

  const wrap =
    document.createElement("div");

  wrap.className =
    "card-wrap" +
    (choice ? " choice" : "");

  const inner =
    document.createElement("div");

  inner.className =
    "card-inner";

  const back =
    document.createElement("div");

  back.className =
    "face back";

  const front =
    document.createElement("div");

  front.className =
    "face front";

  const img =
    document.createElement("img");

  img.src = person.image;

  img.alt = person.name;

  img.onload =
    () => normalizeCardImage(img);

  img.onerror = () => {

    img.style.display = "none";

    const fb =
      document.createElement("div");

    fb.className = "fallback";

    fb.innerHTML =
      `<strong>${person.name}</strong>`;

    front.appendChild(fb);
  };

  front.appendChild(img);

  inner.append(
    back,
    front
  );

  wrap.appendChild(inner);

  return wrap;
}


// ================================================================
// REVELAR CARTA
// ================================================================

function revealCard(card) {

  if (
    card &&
    !card.classList.contains("revealed")
  ) {

    card.classList.add(
      "revealed"
    );

    playSound("reveal");
  }
}


// ================================================================
// ABERTURA
// ================================================================

function start() {

  reset();

  $("gk-stage").innerHTML = "";

  CONFIG.goalkeepers.forEach(
    g => {

      $("gk-stage")
        .appendChild(
          makeCard(
            {
              ...g,
              level: "goleiro"
            },
            {
              choice: false
            }
          )
        );
    }
  );

  $("btn-gk-reveal")
    .classList.remove("hidden");

  $("btn-gk-continue")
    .classList.add("hidden");

  show("goalkeepers");
}


$("btn-start").onclick = start;


// ================================================================
// GOLEIROS
// ================================================================

$("btn-gk-reveal").onclick = () => {

  document
    .querySelectorAll(
      "#gk-stage .card-wrap"
    )
    .forEach(revealCard);

  $("btn-gk-reveal")
    .classList.add("hidden");

  $("btn-gk-continue")
    .classList.remove("hidden");
};


$("btn-gk-continue").onclick =
  () => showCaptain();


// ================================================================
// CAPITÃES
// ================================================================

function showCaptain() {

  const n =
    state.currentTeamIndex + 1;

  state.currentCaptain =
    state.captains[
      state.currentTeamIndex
    ];

  $("captain-team-title")
    .textContent =
      `EQUIPE ${n}`;

  $("captain-card-stage")
    .innerHTML = "";

  const card =
    makeCard({
      name: state.currentCaptain,
      level: "capitao",
      image:
        `assets/captains/${slug(
          state.currentCaptain
        )}.png`
    });

  $("captain-card-stage")
    .appendChild(card);

  $("btn-captain-reveal")
    .classList.remove("hidden");

  $("btn-captain-continue")
    .classList.add("hidden");

  show("captain");
}


$("btn-captain-reveal").onclick = () => {

  const c =
    $("captain-card-stage")
      .querySelector(
        ".card-wrap"
      );

  revealCard(c);

  $("btn-captain-reveal")
    .classList.add("hidden");

  $("btn-captain-continue")
    .classList.remove("hidden");
};


$("btn-captain-continue").onclick =
  () => startTeam();


// ================================================================
// INICIAR EQUIPE
// ================================================================

function startTeam() {

  const n =
    state.currentTeamIndex + 1;

  state.currentTeam = {

    number: n,

    captain:
      state.currentCaptain,

    players: []
  };

  state.choiceNumber = 0;

  // ================================================================
  // EQUIPE 6 = FIXA
  // ================================================================

  if (n === 6) {

    finishTeam6();

    return;
  }

  showDraftChoice();
}


// ================================================================
// NECESSIDADES
// ================================================================

function remainingNeed(
  team,
  level
) {

  return NEEDS[level] -
    team.players.filter(
      p => p.level === level
    ).length;
}


// ================================================================
// POOL DISPONÍVEL
// ================================================================

function availablePool() {

  return state.pool.filter(p => {

    const teamNumber =
      state.currentTeam.number;

    // ================================================================
    // JOGADORES SECRETOS DA EQUIPE 2
    // ================================================================

    for (
      const [
        team,
        players
      ]
      of Object.entries(
        SECRET_RULES.reservedPlayersByTeam
      )
    ) {

      if (
        teamNumber < Number(team) &&
        players.includes(p.name)
      ) {

        return false;
      }
    }

    // ================================================================
    // SEGURANÇA: FIXOS DA EQUIPE 6
    // ================================================================

    if (
      SECRET_RULES
        .fixedTeam6Players
        .includes(p.name)
    ) {

      return false;
    }

    return true;
  });
}


// ================================================================
// VALIDAÇÃO
// ================================================================

function validForTeam(
  team,
  p
) {

  return !!p &&
    remainingNeed(
      team,
      p.level
    ) > 0;
}


function remainingByLevel(level) {

  return availablePool()
    .filter(
      p => p.level === level
    );
}


function eligibleLevels(team) {

  return Object.keys(
    NEEDS
  ).filter(
    l =>
      remainingNeed(
        team,
        l
      ) > 0 &&
      remainingByLevel(l)
        .length > 0
  );
}


// ================================================================
// ESCOLHER NÍVEL
// ================================================================

function chooseLevel(team) {

  const levels =
    eligibleLevels(team);

  if (
    levels.length === 1
  ) {

    return levels[0];
  }

  const scored =
    levels
      .map(l => ({

        l,

        score:
          remainingByLevel(l)
            .length -
          remainingNeed(
            team,
            l
          )

      }))
      .sort(
        (a, b) =>
          a.score - b.score
      );

  const best =
    scored[0].score;

  return pickRandom(
    scored
      .filter(
        x =>
          x.score === best
      )
      .map(
        x => x.l
      )
  );
}


// ================================================================
// OPÇÕES NORMAIS
// ================================================================

function normalOptions(team) {

  const level =
    chooseLevel(team);

  const candidates =
    remainingByLevel(level);

  if (
    candidates.length >= 2
  ) {

    return shuffle(
      candidates
    ).slice(0, 2);
  }

  if (
    candidates.length === 1
  ) {

    const alt =
      pickRandom(
        availablePool()
          .filter(
            p =>
              p.name !==
                candidates[0].name &&
              validForTeam(
                team,
                p
              )
          )
      );

    return shuffle(
      [
        candidates[0],
        alt
      ].filter(Boolean)
    );
  }

  return [];
}


// ================================================================
// 🔒 OPÇÕES SECRETAS DA EQUIPE 2
// ================================================================

function team2Options(team) {

  const round =
    state.choiceNumber;

  const pairs =
    SECRET_RULES
      .specialPairsByTeam[
        team.number
      ] || [];

  // ================================================================
  // 1ª, 2ª E 3ª ESCOLHAS
  // ================================================================

  if (
    round <= pairs.length
  ) {

    const pair =
      pairs[
        round - 1
      ];

    let options =
      pair
        .map(
          name =>
            state.pool.find(
              p =>
                p.name === name
            )
        )
        .filter(Boolean)
        .filter(
          p =>
            validForTeam(
              team,
              p
            )
        );

    // ================================================================
    // SEGURANÇA
    // ================================================================

    while (
      options.length < 2
    ) {

      const candidates =
        availablePool()
          .filter(
            p =>
              validForTeam(
                team,
                p
              ) &&
              !options.some(
                x =>
                  x.name ===
                  p.name
              )
          );

      if (
        !candidates.length
      ) {

        break;
      }

      options.push(
        pickRandom(
          candidates
        )
      );
    }

    return shuffle(
      options
    ).slice(0, 2);
  }

  // ================================================================
  // 4ª ESCOLHA
  //
  // Volta ao sistema normal.
  // ================================================================

  return normalOptions(team);
}


// ================================================================
// MOSTRAR ESCOLHAS
// ================================================================

function showDraftChoice() {

  const team =
    state.currentTeam;

  state.choiceNumber++;

  state.choiceRevealed =
    false;

  $("draft-team-label")
    .textContent =
      `EQUIPE ${team.number} — ${team.captain}`;

  $("draft-title")
    .textContent =
      `ESCOLHA ${state.choiceNumber} DE 4`;

  renderNeeds(team);

  // ================================================================
  // EQUIPE 2 USA LÓGICA SECRETA
  // ================================================================

  state.choiceOptions =
    team.number === 2
      ? team2Options(team)
      : normalOptions(team);

  const area =
    $("choices");

  area.innerHTML = "";

  state.choiceOptions.forEach(
    p => {

      const c =
        makeCard(
          p,
          {
            choice: true
          }
        );

      c.classList.add(
        "not-selectable"
      );

      c.onclick =
        () =>
          choosePlayer(
            p,
            c
          );

      area.appendChild(c);
    }
  );

  $("draft-message")
    .textContent =
      "Toque em REVELAR OPÇÕES para descobrir os dois jogadores.";

  $("btn-reveal-choices")
    .classList.remove("hidden");

  show("draft");
}


// ================================================================
// NÍVEIS NÃO APARECEM
// ================================================================

function renderNeeds(team) {
  return;
}


// ================================================================
// REVELAR OPÇÕES
// ================================================================

$("btn-reveal-choices").onclick = () => {

  state.choiceRevealed =
    true;

  document
    .querySelectorAll(
      "#choices .card-wrap"
    )
    .forEach(c => {

      c.classList.remove(
        "not-selectable"
      );

      c.classList.add(
        "selectable"
      );

      revealCard(c);
    });

  $("draft-message")
    .textContent =
      "Agora escolha uma das duas cartas.";

  $("btn-reveal-choices")
    .classList.add("hidden");
};


// ================================================================
// ESCOLHER JOGADOR
// ================================================================

function choosePlayer(
  player,
  card
) {

  if (
    !state.choiceRevealed ||
    !validForTeam(
      state.currentTeam,
      player
    )
  ) {

    return;
  }

  document
    .querySelectorAll(
      "#choices .card-wrap"
    )
    .forEach(c => {

      c.classList.add(
        "disabled"
      );

      c.onclick = null;
    });

  card.classList.remove(
    "disabled"
  );

  card.classList.add(
    "chosen"
  );

  playSound(
    player.level === "craque"
      ? "craque"
      : "pick"
  );

  state.currentTeam.players.push(
    player
  );

  state.pool =
    state.pool.filter(
      p =>
        p.name !==
        player.name
    );

  setTimeout(
    () => {

      if (
        state.choiceNumber === 4
      ) {

        showTeamSummary();

      } else {

        showDraftChoice();
      }

    },
    700
  );
}


// ================================================================
// MINI CARTA
// ================================================================

function makeMini(
  p,
  isCaptain = false
) {

  const d =
    document.createElement(
      "div"
    );

  d.className =
    "mini-card" +
    (
      isCaptain
        ? " captain-mini"
        : ""
    );

  const img =
    document.createElement(
      "img"
    );

  img.src = p.image;

  img.alt = p.name;

  img.onload =
    () =>
      normalizeCardImage(
        img
      );

  img.onerror = () => {

    img.style.visibility =
      "hidden";
  };

  d.appendChild(img);

  d.appendChild(
    Object.assign(
      document.createElement(
        "div"
      ),
      {
        className: "mini-name",
        textContent: p.name
      }
    )
  );

  if (isCaptain) {

    d.appendChild(
      Object.assign(
        document.createElement(
          "div"
        ),
        {
          className: "captain-tag",
          textContent: "CAPITÃO"
        }
      )
    );
  }

  return d;
}


// ================================================================
// RESUMO DA EQUIPE
// ================================================================

function showTeamSummary() {

  const team =
    state.currentTeam;

  state.teams[
    team.number - 1
  ] = team;

  $("team-title")
    .textContent =
      `EQUIPE ${team.number}`;

  $("team-cards")
    .innerHTML = "";

  const captain = {

    name: team.captain,

    image:
      `assets/captains/${slug(
        team.captain
      )}.png`,

    level: "capitao"
  };

  $("team-cards")
    .appendChild(
      makeMini(
        captain,
        true
      )
    );

  team.players.forEach(
    p =>
      $("team-cards")
        .appendChild(
          makeMini(p)
        )
  );

  $("btn-next-team")
    .onclick = nextTeam;

  $("btn-next-team")
    .textContent =
      team.number === 5
        ? "MONTAR EQUIPE 6"
        : "PRÓXIMA EQUIPE";

  show("team");
}


// ================================================================
// PRÓXIMA EQUIPE
// ================================================================

function nextTeam() {

  state.currentTeamIndex++;

  state.currentCaptain =
    state.captains[
      state.currentTeamIndex
    ];

  if (
    state.currentTeamIndex === 5
  ) {

    startTeam();

  } else {

    showCaptain();
  }
}


// ================================================================
// 🔒 EQUIPE 6 — FIXA
// ================================================================

function finishTeam6() {

  const team = {

    number: 6,

    captain:
      state.currentCaptain,

    players: [
      ...state.fixedTeam6
    ]
  };

  state.pool = [];

  state.teams[5] =
    team;

  $("team-title")
    .textContent =
      "EQUIPE 6";

  $("team-cards")
    .innerHTML = "";

  const captain = {

    name:
      team.captain,

    image:
      `assets/captains/${slug(
        team.captain
      )}.png`,

    level:
      "capitao"
  };

  $("team-cards")
    .appendChild(
      makeMini(
        captain,
        true
      )
    );

  team.players.forEach(
    p =>
      $("team-cards")
        .appendChild(
          makeMini(p)
        )
  );

  $("btn-next-team")
    .textContent =
      "VER TODAS AS EQUIPES";

  $("btn-next-team")
    .onclick =
      showFinal;

  show("team");
}


// ================================================================
// TODAS AS EQUIPES
// ================================================================

function showFinal() {

  $("all-teams")
    .innerHTML = "";

  state.teams.forEach(
    t => {

      const panel =
        document.createElement(
          "div"
        );

      panel.className =
        "team-panel";

      panel.innerHTML =
        `<h3>Equipe ${t.number}</h3>
         <p><b>Capitão:</b> ${t.captain}</p>`;

      t.players.forEach(
        p =>
          panel.insertAdjacentHTML(
            "beforeend",
            `<p>${p.name}</p>`
          )
      );

      $("all-teams")
        .appendChild(panel);
    }
  );

  show("final");
}


// ================================================================
// FORMAÇÕES
// ================================================================

$("btn-formations").onclick =
  () =>
    renderFormation(1);


function renderFormation(n) {

  $("formation-tabs")
    .innerHTML = "";

  state.teams.forEach(
    t => {

      const b =
        document.createElement(
          "button"
        );

      b.className =
        "tab" +
        (
          t.number === n
            ? " active"
            : ""
        );

      b.textContent =
        `EQUIPE ${t.number}`;

      b.onclick =
        () =>
          renderFormation(
            t.number
          );

      $("formation-tabs")
        .appendChild(b);
    }
  );

  const t =
    state.teams[n - 1];

  const f =
    $("formation-field");

  f.innerHTML = "";

  const all =
    t.players;

  const spots = [

    ["gk", "JOEL / VINICIUS"],

    ["p1", all[0]?.name],

    ["p2", all[1]?.name],

    ["p3", all[2]?.name],

    ["p4", all[3]?.name]
  ];

  spots.forEach(
    ([cl, name]) => {

      const d =
        document.createElement(
          "div"
        );

      d.className =
        `player-dot ${cl}`;

      d.textContent =
        name || "—";

      f.appendChild(d);
    }
  );

  show("formations");
}


// ================================================================
// REINICIAR
// ================================================================

$("btn-restart").onclick =
  start;
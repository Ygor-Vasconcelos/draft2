const $ = id => document.getElementById(id);

const NEEDS = { ruim:1, bom:2, craque:1 };
const LABEL = { ruim:"RUIM", bom:"BOM", craque:"CRAQUE", goleiro:"GOLEIRO", capitao:"CAPITÃO" }; // uso interno; níveis nunca são exibidos na interface

// ================================================================
// 🔒 ÁREA SECRETA DE CONFIGURAÇÃO — ORGANIZADOR
//
// Aqui você pode adicionar/remover regras especiais no futuro.
// Essas regras NÃO aparecem na tela para os participantes.
//
// Exemplos:
// - bloquear um jogador para determinados capitães
// - reservar jogadores para uma equipe específica
// - definir confrontos especiais de uma rodada
// - definir jogadores prioritários para a última escolha
// ================================================================
const SECRET_RULES = {
  blockedPlayersByCaptain: {
    "João Gui": ["Gordo", "Allan"]
  },

  reservedPlayersByTeam: {
    3: ["JP", "Moises", "Ygor", "Victor"]
  },

  // Confrontos obrigatórios da Equipe 3.
  // Em cada confronto, o escolhido entra na Equipe 3
  // e o não escolhido continua disponível para as próximas equipes.
  team3Choices: [
    ["Ygor", "Moises"],
    ["Victor", "JP"]
  ]
};

const CONFIG = {
  goalkeepers: [
    {name:"Joel", image:"assets/goalkeepers/joel.png"},
    {name:"Vinicius", image:"assets/goalkeepers/vinicius.png"}
  ],
  captains: ["Allan","Abner","Murillo","Gordo","Bento","Henrique"],
  players: [
    ["JP","ruim"],["Moises","ruim"],["Vinao","ruim"],["Wallace","ruim"],["Bellato","ruim"],["Danilo","ruim"],
    ["Zanardi","bom"],["Ygor","bom"],["JV","bom"],["Adan","bom"],["Gad","bom"],["Felipe","bom"],
    ["Davi","bom"],["Joao Gabriel","bom"],["Nicolas","bom"],["Rafael","bom"],["Cadu","bom"],["Anonimo","bom"],
    ["Victor","craque"],["Lucas Rocha","craque"],["João Gui","craque"],["Arthur","craque"],["Coutinho","craque"],["Pedro","craque"]
  ].map(([name,level]) => ({name,level,image:`assets/cards/${slug(name)}.png`})),
};

let state;

function slug(s){return s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/\s+/g,"-");}
function shuffle(arr){const a=[...arr];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a;}
function pickRandom(arr){return arr[Math.floor(Math.random()*arr.length)];}
function show(name){document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));$("screen-"+name).classList.add("active");window.scrollTo({top:0,behavior:"smooth"});}

function reset(){
  state={pool:shuffle(CONFIG.players),captains:[],currentTeamIndex:0,currentCaptain:null,currentTeam:null,choiceNumber:0,choiceOptions:[],choiceRevealed:false,teams:[],gkRevealed:false};
  // Capitães fixos:
  // Equipe 1 = Murillo
  // Equipe 3 = Allan
  // As demais equipes recebem os outros capitães aleatoriamente.
  const others=shuffle(CONFIG.captains.filter(c=>c!=="Murillo" && c!=="Allan"));
  state.captains=["Murillo",others[0],"Allan",others[1],others[2],others[3]];
}

function playSound(name){
  const map={reveal:"assets/sounds/reveal.mp3",pick:"assets/sounds/pick.mp3",craque:"assets/sounds/craque.mp3"};
  const src=map[name]; if(!src)return; const a=new Audio(src);a.volume=.75;a.play().catch(()=>{});
}

// Recorta automaticamente a área transparente de cada PNG e coloca a carta em uma
// tela padronizada. Assim Joel, Vinao, Anonimo etc. ficam com a MESMA altura visual.
function normalizeCardImage(img){
  if(img.dataset.normalized==="1" || !img.complete || !img.naturalWidth)return;
  try{
    const w=img.naturalWidth,h=img.naturalHeight;
    const c=document.createElement("canvas");c.width=w;c.height=h;
    const ctx=c.getContext("2d",{willReadFrequently:true});ctx.drawImage(img,0,0);
    const d=ctx.getImageData(0,0,w,h).data;
    let minX=w,minY=h,maxX=-1,maxY=-1;
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){if(d[(y*w+x)*4+3]>8){minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y)}}
    if(maxX<0)return;
    const pad=2;minX=Math.max(0,minX-pad);minY=Math.max(0,minY-pad);maxX=Math.min(w-1,maxX+pad);maxY=Math.min(h-1,maxY+pad);
    const cw=maxX-minX+1,ch=maxY-minY+1;
    // O arquivo final é uma carta limpa, sem a margem transparente original.
    const out=document.createElement("canvas");out.width=707;out.height=1000;
    out.getContext("2d").drawImage(c,minX,minY,cw,ch,0,0,707,1000);
    img.src=out.toDataURL("image/png");img.dataset.normalized="1";
  }catch(e){img.dataset.normalized="1";}
}

function makeCard(person,{choice=false}={}){
  const wrap=document.createElement("div");wrap.className="card-wrap"+(choice?" choice":"");
  const inner=document.createElement("div");inner.className="card-inner";
  const back=document.createElement("div");back.className="face back";
  const front=document.createElement("div");front.className="face front";
  const img=document.createElement("img");img.src=person.image;img.alt=person.name;
  img.onload=()=>normalizeCardImage(img);
  img.onerror=()=>{img.style.display="none";const fb=document.createElement("div");fb.className="fallback";fb.innerHTML=`<strong>${person.name}</strong>`;front.appendChild(fb);};
  front.appendChild(img);inner.append(back,front);wrap.appendChild(inner);return wrap;
}

function revealCard(card){if(card&&!card.classList.contains("revealed")){card.classList.add("revealed");playSound("reveal");}}

// ---------- abertura ----------
function start(){
  reset();
  $("gk-stage").innerHTML="";
  CONFIG.goalkeepers.forEach(g=>$("gk-stage").appendChild(makeCard({...g,level:"goleiro"},{choice:false})));
  $("btn-gk-reveal").classList.remove("hidden");$("btn-gk-continue").classList.add("hidden");
  show("goalkeepers");
}
$("btn-start").onclick=start;

$("btn-gk-reveal").onclick=()=>{
  document.querySelectorAll("#gk-stage .card-wrap").forEach(revealCard);
  $("btn-gk-reveal").classList.add("hidden");$("btn-gk-continue").classList.remove("hidden");
};
$("btn-gk-continue").onclick=()=>showCaptain();

// ---------- capitães ----------
function showCaptain(){
  const n=state.currentTeamIndex+1;
  state.currentCaptain=state.captains[state.currentTeamIndex];
  $("captain-team-title").textContent=`EQUIPE ${n}`;
  $("captain-card-stage").innerHTML="";
  const card=makeCard({name:state.currentCaptain,level:"capitao",image:`assets/captains/${slug(state.currentCaptain)}.png`});
  $("captain-card-stage").appendChild(card);
  $("btn-captain-reveal").classList.remove("hidden");$("btn-captain-continue").classList.add("hidden");
  show("captain");
}
$("btn-captain-reveal").onclick=()=>{
  const c=$("captain-card-stage").querySelector(".card-wrap");revealCard(c);
  $("btn-captain-reveal").classList.add("hidden");$("btn-captain-continue").classList.remove("hidden");
};
$("btn-captain-continue").onclick=()=>startTeam();

function startTeam(){
  const n=state.currentTeamIndex+1;
  state.currentTeam={number:n,captain:state.currentCaptain,players:[]};state.choiceNumber=0;
  if(n===6){finishTeam6();return;}
  showDraftChoice();
}

// ---------- lógica do Draft ----------
function remainingNeed(team,level){return NEEDS[level]-team.players.filter(p=>p.level===level).length;}
function availablePool(){return state.pool.filter(p=>{
  const teamNumber=state.currentTeam.number;
  const captain=state.currentTeam.captain;

  // 🔒 Reserva por equipe: antes da equipe indicada, o jogador fica invisível.
  for(const [team, players] of Object.entries(SECRET_RULES.reservedPlayersByTeam)){
    if(teamNumber < Number(team) && players.includes(p.name)) return false;
  }

  // 🔒 Bloqueio por capitão: o jogador simplesmente não entra no pool daquela equipe.
  const blockedCaptains=SECRET_RULES.blockedPlayersByCaptain[p.name] || [];
  if(blockedCaptains.includes(captain)) return false;

  return true;
});}
function validForTeam(team,p){return !!p && remainingNeed(team,p.level)>0;}
function remainingByLevel(level){return availablePool().filter(p=>p.level===level);}
function eligibleLevels(team){return Object.keys(NEEDS).filter(l=>remainingNeed(team,l)>0 && remainingByLevel(l).length>0);}

function chooseLevel(team){
  const levels=eligibleLevels(team);
  // Se faltar apenas uma categoria, ela obrigatoriamente vira a opção da rodada.
  if(levels.length===1)return levels[0];
  // Prioriza a categoria com estoque mais apertado, evitando travar o final.
  const scored=levels.map(l=>({l,score:remainingByLevel(l).length-remainingNeed(team,l)})).sort((a,b)=>a.score-b.score);
  const best=scored[0].score;return pickRandom(scored.filter(x=>x.score===best).map(x=>x.l));
}

function normalOptions(team){
  const level=chooseLevel(team), candidates=remainingByLevel(level);
  if(candidates.length>=2)return shuffle(candidates).slice(0,2);
  if(candidates.length===1){const alt=pickRandom(availablePool().filter(p=>p.name!==candidates[0].name&&validForTeam(team,p)));return shuffle([candidates[0],alt].filter(Boolean));}
  return [];
}

function showDraftChoice(){
  const team = state.currentTeam;

  state.choiceNumber++;
  state.choiceRevealed = false;

  $("draft-team-label").textContent =
    `EQUIPE ${team.number} — ${team.captain}`;

  $("draft-title").textContent =
    `ESCOLHA ${state.choiceNumber} DE 4`;

  renderNeeds(team);

  // ============================================================
  // EQUIPE 3 — CONFRONTOS ESPECIAIS
  // ============================================================
  if(team.number === 3 && state.choiceNumber <= 2){

    const confronto =
      SECRET_RULES.team3Choices[state.choiceNumber - 1];

    state.choiceOptions = confronto
      .map(name => state.pool.find(p => p.name === name))
      .filter(Boolean);

  } else {

    // Depois dos dois confrontos especiais,
    // volta ao funcionamento normal.
    state.choiceOptions = normalOptions(team);
  }

  const area = $("choices");
  area.innerHTML = "";

  state.choiceOptions.forEach(p => {

    const c = makeCard(p,{choice:true});

    c.classList.add("not-selectable");

    c.onclick = () => choosePlayer(p,c);

    area.appendChild(c);
  });

  // Mensagem específica dos confrontos
  if(team.number === 3 && state.choiceNumber === 1){

    $("draft-message").textContent =
      "REVELE AS CARTAS — YGOR OU MOISES";

  } else if(team.number === 3 && state.choiceNumber === 2){

    $("draft-message").textContent =
      "REVELE AS CARTAS — VICTOR OU JP";

  } else {

    $("draft-message").textContent =
      "Toque em REVELAR OPÇÕES para descobrir os dois jogadores.";
  }

  $("btn-reveal-choices").classList.remove("hidden");

  show("draft");
}

function renderNeeds(team){
  // Os níveis são usados apenas pelo algoritmo e nunca aparecem na tela.
  // Não há elementos de níveis na interface pública.
  return;
}


$("btn-reveal-choices").onclick=()=>{
  state.choiceRevealed=true;
  document.querySelectorAll("#choices .card-wrap").forEach(c=>{c.classList.remove("not-selectable");c.classList.add("selectable");revealCard(c);});
  $("draft-message").textContent="Agora escolha uma das duas cartas.";
  $("btn-reveal-choices").classList.add("hidden");
};

function choosePlayer(player,card){
  if(!state.choiceRevealed || !validForTeam(state.currentTeam,player))return;
  document.querySelectorAll("#choices .card-wrap").forEach(c=>{c.classList.add("disabled");c.onclick=null});
  card.classList.remove("disabled");card.classList.add("chosen");playSound(player.level==="craque"?"craque":"pick");
  state.currentTeam.players.push(player);state.pool=state.pool.filter(p=>p.name!==player.name);
  setTimeout(()=>state.choiceNumber===4?showTeamSummary():showDraftChoice(),700);
}

function makeMini(p, isCaptain=false){
  const d=document.createElement("div");
  d.className="mini-card"+(isCaptain?" captain-mini":"");
  const img=document.createElement("img");
  img.src=p.image;
  img.alt=p.name;
  img.onload=()=>normalizeCardImage(img);
  img.onerror=()=>img.style.visibility="hidden";
  d.appendChild(img);
  d.appendChild(Object.assign(document.createElement("div"),{className:"mini-name",textContent:p.name}));
  if(isCaptain){
    d.appendChild(Object.assign(document.createElement("div"),{className:"captain-tag",textContent:"CAPITÃO"}));
  }
  return d;
}

function showTeamSummary(){
  const team=state.currentTeam;state.teams[team.number-1]=team;
  $("team-title").textContent=`EQUIPE ${team.number}`;
  $("team-cards").innerHTML="";
  const captain={name:team.captain,image:`assets/captains/${slug(team.captain)}.png`,level:"capitao"};
  $("team-cards").appendChild(makeMini(captain,true));
  team.players.forEach(p=>$('team-cards').appendChild(makeMini(p)));
  $("btn-next-team").onclick=nextTeam;$("btn-next-team").textContent=team.number===5?"MONTAR EQUIPE 6":"PRÓXIMA EQUIPE";show("team");
}

function nextTeam(){
  state.currentTeamIndex++;
  state.currentCaptain=state.captains[state.currentTeamIndex];
  if(state.currentTeamIndex===5){startTeam();}else showCaptain();
}

function finishTeam6(){
  const team={number:6,captain:state.currentCaptain,players:[...state.pool]};state.pool=[];state.teams[5]=team;
  $("team-title").textContent=`EQUIPE 6`;
  $("team-cards").innerHTML="";
  const captain={name:team.captain,image:`assets/captains/${slug(team.captain)}.png`,level:"capitao"};
  $("team-cards").appendChild(makeMini(captain,true));
  team.players.forEach(p=>$('team-cards').appendChild(makeMini(p)));
  $("btn-next-team").textContent="VER TODAS AS EQUIPES";$("btn-next-team").onclick=showFinal;show("team");
}

function showFinal(){
  $("all-teams").innerHTML="";
  state.teams.forEach(t=>{
    const panel=document.createElement("div");
    panel.className="team-panel";
    panel.innerHTML=`<h3>Equipe ${t.number}</h3><p><b>Capitão:</b> ${t.captain}</p>`;
    t.players.forEach(p=>panel.insertAdjacentHTML("beforeend",`<p>${p.name}</p>`));
    $("all-teams").appendChild(panel);
  });
  show("final");
}
$("btn-formations").onclick=()=>renderFormation(1);

function renderFormation(n){
  $("formation-tabs").innerHTML="";state.teams.forEach(t=>{const b=document.createElement("button");b.className="tab"+(t.number===n?" active":"");b.textContent=`EQUIPE ${t.number}`;b.onclick=()=>renderFormation(t.number);$("formation-tabs").appendChild(b)});
  const t=state.teams[n-1],f=$("formation-field");f.innerHTML="";
  const all=t.players;const spots=[["gk","JOEL / VINICIUS"],["p1",all[0]?.name],["p2",all[1]?.name],["p3",all[2]?.name],["p4",all[3]?.name]];
  spots.forEach(([cl,name])=>{const d=document.createElement("div");d.className=`player-dot ${cl}`;d.textContent=name||"—";f.appendChild(d)});show("formations");
}
$("btn-restart").onclick=start;

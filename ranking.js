import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getFirestore,
  collection,
  onSnapshot,
  doc,
  updateDoc,
  Timestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const firebaseConfig = {
  "apiKey": "AIzaSyCMSZ0eswAcitu-G5lxnrnK6EM3HX5fgnk",
  "authDomain": "controle-leads-rd.firebaseapp.com",
  "databaseURL": "https://controle-leads-rd-default-rtdb.firebaseio.com",
  "projectId": "controle-leads-rd",
  "storageBucket": "controle-leads-rd.firebasestorage.app",
  "messagingSenderId": "53144648419",
  "appId": "1:53144648419:web:67bf97a647bfbc8f69e3d6"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const PRAZO_TESTE_MS = 60 * 1000;
let leads = [];
let vendedores = [];

const params = new URLSearchParams(location.search);
const tipo = params.get("tipo") || "respondido";

const tipoConfig = {
  respondido: {
    title: "Ranking de respondidos",
    subtitle: "Vendedores com leads marcados como respondidos.",
    filter: l => l.status === "respondido" && l.resultado !== "sem_graduacao"
  },
  nao_respondeu: {
    title: "Ranking de não respondeu",
    subtitle: "Vendedores com leads que passaram do prazo.",
    filter: l => l.status === "nao_respondeu"
  },
  sem_graduacao: {
    title: "Ranking de sem graduação",
    subtitle: "Vendedores com leads classificados como sem graduação.",
    filter: l => l.resultado === "sem_graduacao"
  }
};
const cfg = tipoConfig[tipo] || tipoConfig.respondido;

function esc(v){
  return String(v ?? "")
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;")
    .replace(/'/g,"&#039;");
}
function getMillis(v){
  if(!v) return 0;
  if(v.toDate) return v.toDate().getTime();
  if(v instanceof Date) return v.getTime();
  if(typeof v === "string") return new Date(v).getTime() || 0;
  return 0;
}
function fmt(v){
  const ms = getMillis(v);
  if(!ms) return "";
  return new Date(ms).toLocaleString("pt-BR", {
    day:"2-digit", month:"2-digit", hour:"2-digit", minute:"2-digit"
  });
}
function prazoFinalMs(l){
  const criado = getMillis(l.criadoEm);
  if(!criado) return getMillis(l.prazoAte);
  return criado + PRAZO_TESTE_MS;
}
async function expirePendingLeads(){
  const expired = leads.filter(l => l.status === "pendente" && prazoFinalMs(l) > 0 && prazoFinalMs(l) <= Date.now());

  for(const l of expired){
    try{
      await updateDoc(doc(db, "leads", l.docId), {
        status: "nao_respondeu",
        resultado: "nao_respondeu",
        finalizadoEm: Timestamp.now(),
        atualizadoEm: Timestamp.now()
      });
    }catch(e){
      console.error("Erro ao expirar lead", e);
    }
  }
}
function getFiltered(){
  return leads.filter(cfg.filter);
}
function getRanking(){
  const filtered = getFiltered();
  const sellers = [...new Set([...vendedores, ...filtered.map(l => l.vendedor).filter(Boolean)])];

  return sellers.map(vendedor => {
    const group = filtered.filter(l => l.vendedor === vendedor);
    const phraseMap = new Map();

    group.forEach(l => {
      const frase = l.frase || "Frase não identificada";
      phraseMap.set(frase, (phraseMap.get(frase) || 0) + 1);
    });

    const frases = [...phraseMap.entries()]
      .map(([frase,total]) => ({ frase, total }))
      .sort((a,b) => b.total - a.total || a.frase.localeCompare(b.frase));

    return { vendedor, total: group.length, frases, leads: group };
  })
  .filter(item => item.total > 0)
  .sort((a,b) => b.total - a.total || a.vendedor.localeCompare(b.vendedor));
}
function renderHeader(){
  document.getElementById("rankingTitle").textContent = cfg.title;
  document.getElementById("rankingSubtitle").textContent = cfg.subtitle;
  document.getElementById("rankingPanelTitle").textContent = cfg.title;
}
function renderMetrics(){
  const filtered = getFiltered();
  const vendedoresComLead = new Set(filtered.map(l => l.vendedor).filter(Boolean)).size;
  const frases = new Set(filtered.map(l => l.frase).filter(Boolean)).size;

  document.getElementById("rankingMetrics").innerHTML = `
    <div class="metric total"><span>Total no ranking</span><strong>${filtered.length}</strong><small>Leads</small></div>
    <div class="metric answered"><span>Vendedores</span><strong>${vendedoresComLead}</strong><small>Com registro</small></div>
    <div class="metric pending"><span>Campanhas</span><strong>${frases}</strong><small>Frases distintas</small></div>
    <div class="metric noanswer"><span>Tipo</span><strong style="font-size:18px">${esc(cfg.title.replace("Ranking de ",""))}</strong><small>Filtro ativo</small></div>
    <div class="metric nodegree"><span>Atualização</span><strong style="font-size:18px">Tempo real</strong><small>Firebase</small></div>
  `;
}
function renderRanking(){
  const tbody = document.getElementById("rankingRows");
  const empty = document.getElementById("emptyRanking");
  const ranking = getRanking();

  if(!ranking.length){
    tbody.innerHTML = "";
    empty.hidden = false;
    return;
  }

  empty.hidden = true;

  tbody.innerHTML = ranking.map((item,index) => {
    const frases = item.frases.map(f => `
      <div class="rankPhraseLine">
        <span>${esc(f.frase)}</span>
        <strong>${f.total}</strong>
      </div>
    `).join("");

    const leadsHtml = item.leads
      .slice()
      .sort((a,b) => getMillis(b.criadoEm) - getMillis(a.criadoEm))
      .map(l => `
        <div class="rankLeadLine">
          <span class="rankPhone">${esc(l.telefone || "Sem telefone")}</span>
          <span>${esc(l.frase || "Frase não identificada")}</span>
          <span class="rankDate">${fmt(l.criadoEm)}</span>
        </div>
      `).join("");

    return `
      <tr>
        <td><span class="rankPosMini">${index + 1}</span></td>
        <td class="rankSellerCell">${esc(item.vendedor)}</td>
        <td class="rankTotalCell">${item.total}</td>
        <td class="rankPhraseCell">${frases}</td>
        <td class="rankLeadsCell">${leadsHtml}</td>
      </tr>
    `;
  }).join("");
}
function render(){
  renderHeader();
  renderMetrics();
  renderRanking();
}
function startLeads(){
  onSnapshot(collection(db, "leads"), snap => {
    leads = snap.docs.map(d => ({ docId: d.id, ...d.data() }));
    render();
    expirePendingLeads();
  }, err => {
    console.error(err);
    document.getElementById("emptyRanking").hidden = false; document.getElementById("emptyRanking").textContent = "Erro ao carregar Firebase: " + err.message;
  });
}
function startVendedores(){
  onSnapshot(collection(db,"vendedores"), snap => {
    vendedores = snap.docs
      .map(d => d.data())
      .filter(v => v.ativo !== false && v.nome)
      .sort((a,b) => Number(a.ordem || 999) - Number(b.ordem || 999) || String(a.nome).localeCompare(String(b.nome)))
      .map(v => v.nome);
    render();
  }, err => console.warn("Erro ao carregar vendedores", err));
}
document.getElementById("exportRankingPdf").onclick = () => window.print();
startVendedores();
startLeads();
setInterval(() => {
  render();
  expirePendingLeads();
}, 1000);

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

const PRAZO_TESTE_MINUTOS = 1;
const PRAZO_TESTE_MS = PRAZO_TESTE_MINUTOS * 60 * 1000;

let leads = [];
let vendedores = [];

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
    day:"2-digit", month:"2-digit", hour:"2-digit", minute:"2-digit", second:"2-digit"
  });
}
function prazoFinalMs(l){
  const criado = getMillis(l.criadoEm);
  if(!criado) return getMillis(l.prazoAte);
  return criado + PRAZO_TESTE_MS;
}
function prazoFinalFormatado(l){
  const ms = prazoFinalMs(l);
  if(!ms) return "";
  return new Date(ms).toLocaleString("pt-BR", {
    day:"2-digit", month:"2-digit", hour:"2-digit", minute:"2-digit", second:"2-digit"
  });
}
function statusLabel(l){
  if(l.status === "pendente") return "Pendente";
  if(l.status === "nao_respondeu") return "Não respondeu";
  if(l.resultado === "sem_graduacao") return "Sem graduação";
  return "Respondido";
}
function getStats(list){
  return {
    total: list.length,
    pendente: list.filter(l => l.status === "pendente").length,
    respondido: list.filter(l => l.status === "respondido").length,
    nao: list.filter(l => l.status === "nao_respondeu").length,
    sem: list.filter(l => l.resultado === "sem_graduacao").length
  };
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
function renderMetrics(){
  const s = getStats(leads);

  document.getElementById("metrics").innerHTML = `
    <div class="metric total"><span>Leads que caíram</span><strong>${s.total}</strong><small>Total registrado</small></div>
    <div class="metric pending"><span>Pendentes</span><strong>${s.pendente}</strong><small>Aguardando retorno</small></div>
    <a class="metric answered clickable" href="ranking.html?tipo=respondido"><span>Respondidos</span><strong>${s.respondido}</strong><small>Abrir ranking</small></a>
    <a class="metric noanswer clickable" href="ranking.html?tipo=nao_respondeu"><span>Não respondeu</span><strong>${s.nao}</strong><small>Abrir ranking</small></a>
    <a class="metric nodegree clickable" href="ranking.html?tipo=sem_graduacao"><span>Sem graduação</span><strong>${s.sem}</strong><small>Abrir ranking</small></a>
  `;
}
function setActiveView(view){
  document.querySelectorAll(".navBtn").forEach(btn => btn.classList.toggle("active", btn.dataset.view === view));
  document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
  document.getElementById("view-" + view)?.classList.add("active");
}
function renderFilters(){
  const select = document.getElementById("sellerFilter");
  const current = select.value || "todos";
  const sellers = [...new Set([...vendedores, ...leads.map(l => l.vendedor).filter(Boolean)])].sort((a,b) => a.localeCompare(b));

  select.innerHTML = `<option value="todos">Todos vendedores</option>` + sellers.map(s => `<option value="${esc(s)}">${esc(s)}</option>`).join("");
  select.value = sellers.includes(current) ? current : "todos";
}
function filteredLeads(){
  const q = (document.getElementById("search").value || "").toLowerCase().trim();
  const status = document.getElementById("statusFilter").value;
  const seller = document.getElementById("sellerFilter").value;

  let arr = [...leads];

  if(status !== "todos") arr = arr.filter(l => l.status === status);
  if(seller !== "todos") arr = arr.filter(l => l.vendedor === seller);

  if(q){
    arr = arr.filter(l => [l.docId,l.telefone,l.frase,l.vendedor,l.status,l.resultado,l.urlRD].join(" ").toLowerCase().includes(q));
  }

  return arr.sort((a,b) => getMillis(b.criadoEm) - getMillis(a.criadoEm));
}
function renderLeadRows(){
  const tbody = document.getElementById("leadRows");
  const empty = document.getElementById("emptyLeads");
  const arr = filteredLeads();

  if(!arr.length){
    tbody.innerHTML = "";
    empty.hidden = false;
    return;
  }

  empty.hidden = true;

  tbody.innerHTML = arr.map(l => {
    const code = (l.docId || "").slice(0,6).toUpperCase();
    const rd = l.urlRD ? `<a class="rdLink" href="${esc(l.urlRD)}" target="_blank">Abrir</a>` : "-";

    return `
      <tr>
        <td><span class="idPill">${esc(code)}</span></td>
        <td><span class="status st-${esc(l.status || "")}">${esc(statusLabel(l))}</span></td>
        <td class="phone">${esc(l.telefone || "Sem telefone")}</td>
        <td class="seller">${esc(l.vendedor || "Não informado")}</td>
        <td class="phraseCell">${esc(l.frase || "Frase não identificada")}</td>
        <td class="timeCell">${fmt(l.criadoEm)}</td>
        <td class="deadline">${prazoFinalFormatado(l)}</td>
        <td>${rd}</td>
      </tr>
    `;
  }).join("");
}
function renderPhrases(){
  const tbody = document.getElementById("phraseRows");
  const phrases = [...new Set(leads.map(l => l.frase).filter(Boolean))];

  if(!phrases.length){
    tbody.innerHTML = `<tr><td colspan="6">Nenhuma campanha registrada.</td></tr>`;
    return;
  }

  tbody.innerHTML = phrases.map(p => {
    const group = leads.filter(l => l.frase === p);
    const s = getStats(group);

    return `
      <tr>
        <td class="phraseCell">${esc(p)}</td>
        <td class="totalCell">${s.total}</td>
        <td>${s.pendente}</td>
        <td class="greenCell">${s.respondido}</td>
        <td class="redCell">${s.nao}</td>
        <td class="purpleCell">${s.sem}</td>
      </tr>
    `;
  }).join("");
}
function renderSellers(){
  const box = document.getElementById("sellerGrid");
  const sellers = [...new Set([...vendedores, ...leads.map(l => l.vendedor).filter(Boolean)])].sort((a,b) => a.localeCompare(b));

  if(!sellers.length){
    box.innerHTML = `<div class="empty">Nenhum vendedor cadastrado.</div>`;
    return;
  }

  box.innerHTML = sellers.map(v => {
    const group = leads.filter(l => l.vendedor === v);
    const s = getStats(group);

    return `
      <div class="sellerMini">
        <div class="sellerMiniName">${esc(v)}</div>
        <div class="sellerStats">
          <div><strong>${s.total}</strong><span>Caiu</span></div>
          <div><strong>${s.pendente}</strong><span>Pend.</span></div>
          <div><strong>${s.respondido}</strong><span>Resp.</span></div>
          <div><strong>${s.nao}</strong><span>Não</span></div>
          <div><strong>${s.sem}</strong><span>Sem</span></div>
        </div>
      </div>
    `;
  }).join("");
}
function render(){
  renderMetrics();
  renderFilters();
  renderLeadRows();
  renderPhrases();
  renderSellers();
}
function startLeads(){
  onSnapshot(collection(db, "leads"), snap => {
    leads = snap.docs.map(d => ({ docId: d.id, ...d.data() }));
    render();
    expirePendingLeads();
  }, err => {
    console.error(err);
    document.getElementById("emptyLeads").hidden = false;
    document.getElementById("emptyLeads").textContent = "Erro ao carregar Firebase: " + err.message;
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
function exportCsv(){
  const rows = [["ID","Status","Telefone","Vendedor","Frase","Caiu em","Prazo","URL RD"]];

  filteredLeads().forEach(l => {
    rows.push([
      l.docId,
      statusLabel(l),
      l.telefone || "",
      l.vendedor || "",
      l.frase || "",
      fmt(l.criadoEm),
      prazoFinalFormatado(l),
      l.urlRD || ""
    ]);
  });

  const csv = rows.map(r => r.map(c => `"${String(c ?? "").replace(/"/g,'""')}"`).join(";")).join("\n");
  const blob = new Blob([csv], {type:"text/csv;charset=utf-8"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "leads-unifahe.csv";
  a.click();
  URL.revokeObjectURL(url);
}
document.querySelectorAll(".navBtn").forEach(btn => {
  btn.onclick = () => setActiveView(btn.dataset.view);
});
document.querySelectorAll("[data-view-go]").forEach(btn => {
  btn.onclick = () => setActiveView(btn.dataset.viewGo);
});
document.getElementById("search").addEventListener("input", render);
document.getElementById("statusFilter").addEventListener("change", render);
document.getElementById("sellerFilter").addEventListener("change", render);
document.getElementById("refresh").onclick = render;
document.getElementById("exportPdf").onclick = () => window.print();
document.getElementById("exportCsv").onclick = exportCsv;
startVendedores();
startLeads();
setInterval(() => {
  render();
  expirePendingLeads();
}, 1000);

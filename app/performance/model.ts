import { CATALOG } from './catalog';
import type { Actor, DemoData, MuscleGroup, PlanContent, PlanLine, Role, Student, TrainingPlan, TrainingRecord, TrainingSession } from './types';
export const STORAGE_KEY = 'performance-demo-v3';
export const LEGACY_STORAGE_KEY = 'performance-demo-v2';
export const ROLE_LABELS:Record<Role,string> = {autonomous:'Aluno autônomo',accompanied:'Aluno acompanhado',teacher:'Professor',admin:'Admin da academia'};
export const GROUPS:MuscleGroup[] = ['Peito','Costas','Ombros','Bíceps','Tríceps','Quadríceps','Posterior de coxa','Glúteos','Panturrilhas','Abdômen','Antebraços'];
export const clone = <T,>(v:T):T => JSON.parse(JSON.stringify(v));
export const newId = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
export const normalize = (s:string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
export const exerciseById = (id:string) => CATALOG.find(e=>e.id===id);
export const dayKey = (date:Date|string) => {const d=new Date(date);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
export const monday = (date:Date) => {const d=new Date(date);d.setHours(0,0,0,0);d.setDate(d.getDate()-(d.getDay()+6)%7);return d;};
export const clock = (seconds:number) => `${String(Math.floor(Math.max(0,seconds)/60)).padStart(2,'0')}:${String(Math.max(0,Math.floor(seconds))%60).padStart(2,'0')}`;
export const duration = (seconds:number) => {const mins=Math.round(seconds/60);return mins<60?`${mins} min`:`${Math.floor(mins/60)}h ${mins%60}m`;};
export const elapsed = (session:TrainingSession,now=Date.now()) => Math.max(0,Math.floor(((session.pausedAt??now)-session.startedAt-session.pausedMs)/1000));
export const completedSets = (session:TrainingSession) => session.sets.flat().filter(s=>s.done).length;
export const recordSets = (r:TrainingRecord) => r.exercises.reduce((n,e)=>n+e.sets.length,0);
export const recordVolume = (r:TrainingRecord) => r.exercises.reduce((n,e)=>n+(exerciseById(e.exerciseId)?.unit==='seconds'?0:e.sets.reduce((v,s)=>v+s.kg*s.reps,0)),0);
export const planMinutes = (p:PlanContent) => Math.round(p.exercises.reduce((n,e)=>n+e.sets*(e.rest+45),0)/60);
export const hasChanges = (p:TrainingPlan) => !p.published || JSON.stringify(p.draft)!==JSON.stringify(p.published);
export function makeLine(exerciseId:string):PlanLine {const ex=exerciseById(exerciseId);if(!ex)throw new Error('Exercício não encontrado.');return{id:newId(),exerciseId,sets:3,reps:ex.unit==='seconds'?30:12,kg:/corpo|peso corporal|colchonete/i.test(ex.equipment)?0:10,rest:60};}
function grouped(group:MuscleGroup,index=0):string {const items=CATALOG.filter(e=>e.group===group);if(!items.length)throw new Error(`Grupo sem exercícios: ${group}`);return items[index%items.length].id;}
function sampleContent(letter:string,index=0):PlanContent {
 const selection = letter==='A'?[grouped('Peito',index),grouped('Peito',index+1),grouped('Ombros',index),grouped('Tríceps',index),grouped('Abdômen',index)]:letter==='B'?[grouped('Costas',index),grouped('Costas',index+1),grouped('Bíceps',index),grouped('Bíceps',index+1),grouped('Antebraços',index)]:[grouped('Quadríceps',index),grouped('Posterior de coxa',index),grouped('Glúteos',index),grouped('Panturrilhas',index),grouped('Abdômen',index+1)];
 return {letter,name:letter==='A'?'Peito, ombros & tríceps':letter==='B'?'Costas & bíceps':'Pernas & glúteos',notes:'Ficha demonstrativa. Cargas e repetições de exemplo para testar o app.',exercises:selection.map((id,i)=>({...makeLine(id),id:`sample-${letter}-${index}-${i}`,kg:exerciseById(id)?.equipment==='Peso corporal'||i===4?0:10+i*5,rest:letter==='C'?90:60}))};
}
export function createDemo(now=new Date()):DemoData {
 const ago=(days:number)=>{const date=new Date(now);date.setDate(date.getDate()-days);date.setHours(10,0,0,0);return date.toISOString();};
 const students:Student[]=[
 {id:'caue',name:'Cauê Galates',mode:'accompanied',teacherId:'bruno',goal:4,objective:'Força e constância',joinedAt:ago(64)},
 {id:'marina',name:'Marina Costa',mode:'accompanied',teacherId:'bruno',goal:3,objective:'Hipertrofia',joinedAt:ago(43)},
 {id:'lucas',name:'Lucas Almeida',mode:'accompanied',teacherId:'bruno',goal:3,objective:'Condicionamento',joinedAt:ago(7)},
 {id:'beatriz',name:'Beatriz Santos',mode:'accompanied',teacherId:'bruno',goal:4,objective:'Força e mobilidade',joinedAt:ago(75)},
 {id:'rafael',name:'Rafael Lima',mode:'autonomous',teacherId:null,goal:3,objective:'Retomar a rotina',joinedAt:ago(33)},
 {id:'julia',name:'Júlia Ferreira',mode:'accompanied',teacherId:'camila',goal:3,objective:'Condicionamento',joinedAt:ago(51)}
 ];
 const plans:TrainingPlan[]=[];
 for(const [i,s] of students.entries()) {
  if(s.id==='lucas'){plans.push({id:'plan-lucas-a',studentId:s.id,authorId:'bruno',draft:sampleContent('A',i),published:null,revision:0,updatedAt:ago(1),publishedAt:null});continue;}
  for(const letter of ['A','B','C']){const content=sampleContent(letter,i);plans.push({id:`plan-${s.id}-${letter.toLowerCase()}`,studentId:s.id,authorId:s.teacherId??s.id,draft:clone(content),published:clone(content),revision:1,updatedAt:ago(35),publishedAt:ago(35)});}
 }
 const history:TrainingRecord[]=[];
 for(const [si,student] of students.entries()){
  if(student.id==='lucas')continue;
  for(let week=5;week>=0;week--){
   const start=monday(now);start.setDate(start.getDate()-week*7);
   const days=student.id==='rafael'?[1,4]:[0,2,4];
   for(const [dayIndex,day] of days.entries()){
    const date=new Date(start);date.setDate(date.getDate()+day);date.setHours(7+si*2,15,0,0);if(date>=now)continue;
    const plan=plans.find(p=>p.studentId===student.id&&p.draft.letter===['A','B','C'][dayIndex])!;
    const content=plan.published!;
    history.push({id:`sample-${student.id}-${dayKey(date)}`,studentId:student.id,planId:plan.id,name:content.name,letter:content.letter,revision:1,date:date.toISOString(),seconds:(38+dayIndex*4+si%3)*60,exercises:content.exercises.map((e,ei)=>({exerciseId:e.exerciseId,sets:Array.from({length:e.sets},()=>({kg:e.kg===0?0:Math.max(2.5,e.kg-(week*.5)+si),reps:e.reps-(week>3&&ei===0?2:0)}))})),sample:true});
   }
  }
 }
 history.sort((a,b)=>Date.parse(b.date)-Date.parse(a.date));
 return {version:3,actor:null,students,teachers:[{id:'bruno',name:'Bruno Martins',specialty:'Musculação e hipertrofia'},{id:'camila',name:'Camila Rocha',specialty:'Força e condicionamento'},{id:'diego',name:'Diego Nunes',specialty:'Treinamento funcional'}],plans,sessions:{},history,gym:{name:'Performance Studio',city:'São José dos Campos · SP',address:'Unidade Centro · endereço demonstrativo',hours:'Seg–sex 06h–22h · Sáb 08h–14h',email:'academia@exemplo.com',since:'2024'}};
}
export function canManageStudent(data:DemoData,studentId:string):boolean {
 const s=data.students.find(s=>s.id===studentId);const a=data.actor;if(!s||!a)return false;
 return a.role==='autonomous'&&a.id===s.id&&s.mode==='autonomous'||a.role==='teacher'&&s.mode==='accompanied'&&s.teacherId===a.id;
}
export function studentPlans(data:DemoData,studentId:string,includeDrafts=false):TrainingPlan[]{return data.plans.filter(p=>p.studentId===studentId&&(includeDrafts||p.published)).sort((a,b)=>(includeDrafts?a.draft.letter:a.published!.letter).localeCompare(includeDrafts?b.draft.letter:b.published!.letter));}
export function studentHistory(data:DemoData,id:string){return data.history.filter(h=>h.studentId===id).sort((a,b)=>Date.parse(b.date)-Date.parse(a.date));}
function assertStudentActor(data:DemoData):Student {const a=data.actor;const student=data.students.find(s=>s.id===a?.id);if(!a||!['autonomous','accompanied'].includes(a.role)||!student||student.mode!==a.role)throw new Error('Entre como aluno para executar um treino.');return student;}
export function switchActor(data:DemoData,actor:Actor,now=Date.now()):DemoData {
 if(actor.role==='admin'&&actor.id!=='academy'||actor.role==='teacher'&&!data.teachers.some(t=>t.id===actor.id)||['autonomous','accompanied'].includes(actor.role)&&!data.students.some(s=>s.id===actor.id&&s.mode===actor.role))throw new Error('Perfil de demonstração inválido.');
 let next=data;const changed=!data.actor||data.actor.role!==actor.role||data.actor.id!==actor.id;const previous=changed&&data.actor&&data.sessions[data.actor.id];if(previous&&!previous.pausedAt)next=togglePause(data,now);
 return {...next,actor};
}
export function validateContent(content:PlanContent):void {
 if(!/^[A-F]$/.test(content.letter))throw new Error('Escolha uma ficha entre A e F.');
 if(content.name.trim().length<3||content.name.length>80)throw new Error('Dê um nome à ficha com 3 a 80 caracteres.');
 if(content.exercises.length<1)throw new Error('Adicione pelo menos um exercício.');
 if(content.exercises.length>20)throw new Error('Use até 20 exercícios por ficha.');
 if(new Set(content.exercises.map(e=>e.exerciseId)).size!==content.exercises.length)throw new Error('Há exercícios repetidos na ficha.');
 for(const e of content.exercises){if(!exerciseById(e.exerciseId)||!Number.isInteger(e.sets)||e.sets<1||e.sets>8||!Number.isInteger(e.reps)||e.reps<1||e.reps>300||!Number.isFinite(e.kg)||e.kg<0||e.kg>1000||!Number.isInteger(e.rest)||e.rest<0||e.rest>600)throw new Error('Confira séries (1–8), repetições/segundos (1–300), carga (0–1.000 kg) e descanso (0–600s).');}
}
export function savePlan(data:DemoData,studentId:string,id:string,content:PlanContent,publish:boolean,now=new Date()):DemoData {
 if(!canManageStudent(data,studentId))throw new Error('Este perfil não pode alterar a ficha deste aluno.');validateContent(content);
 const old=data.plans.find(p=>p.id===id);if(old&&old.studentId!==studentId)throw new Error('A ficha pertence a outro aluno.');
 if(data.plans.some(p=>p.id!==id&&p.studentId===studentId&&p.draft.letter===content.letter))throw new Error(`A ficha ${content.letter} já existe para este aluno. Edite a ficha existente ou escolha outra letra.`);
 const clean=clone({...content,name:content.name.trim(),notes:content.notes.trim()});const mustPublish=publish||data.actor!.role==='autonomous';
 const plan:TrainingPlan={id,studentId,authorId:data.actor!.id,draft:clean,published:mustPublish?clone(clean):old?.published??null,revision:mustPublish?(old?.revision??0)+1:old?.revision??0,updatedAt:now.toISOString(),publishedAt:mustPublish?now.toISOString():old?.publishedAt??null};
 return {...data,plans:old?data.plans.map(p=>p.id===id?plan:p):[...data.plans,plan]};
}
export function removePlan(data:DemoData,id:string):DemoData {const plan=data.plans.find(p=>p.id===id);if(!plan||!canManageStudent(data,plan.studentId))throw new Error('Este perfil não pode excluir esta ficha.');return {...data,plans:data.plans.filter(p=>p.id!==id)};}
export function startSession(data:DemoData,planId:string,now=Date.now()):DemoData {
 const student=assertStudentActor(data);const plan=data.plans.find(p=>p.id===planId&&p.studentId===student.id);if(!plan?.published)throw new Error('Essa ficha ainda não foi publicada para você.');if(data.sessions[student.id])throw new Error('Você tem um treino em andamento. Continue ou descarte antes de iniciar outro.');
 const snapshot=clone(plan.published);const session:TrainingSession={id:newId(),studentId:student.id,planId,revision:plan.revision,snapshot,startedAt:now,pausedAt:null,pausedMs:0,exerciseIndex:0,sets:snapshot.exercises.map(e=>Array.from({length:e.sets},()=>({kg:e.kg,reps:e.reps,done:false}))),restEndsAt:null,restPausedSeconds:null};
 return {...data,sessions:{...data.sessions,[student.id]:session}};
}
export function updateSession(data:DemoData,update:(session:TrainingSession)=>TrainingSession):DemoData {const s=assertStudentActor(data);const session=data.sessions[s.id];if(!session)throw new Error('Nenhum treino em andamento.');return {...data,sessions:{...data.sessions,[s.id]:update(session)}};}
export function togglePause(data:DemoData,now=Date.now()):DemoData {return updateSession(data,s=>s.pausedAt!==null?{...s,pausedMs:s.pausedMs+now-s.pausedAt,pausedAt:null,restEndsAt:s.restPausedSeconds!==null?now+s.restPausedSeconds*1000:null,restPausedSeconds:null}:{...s,pausedAt:now,restPausedSeconds:s.restEndsAt!==null?Math.max(0,Math.ceil((s.restEndsAt-now)/1000)):null,restEndsAt:null});}
export function changeSet(data:DemoData,exerciseIndex:number,setIndex:number,patch:Partial<{kg:number;reps:number;done:boolean}>,now=Date.now()):DemoData {
 return updateSession(data,s=>{if(s.pausedAt!==null)throw new Error('Retome o treino para registrar séries.');const row=s.sets[exerciseIndex]?.[setIndex];if(!row)throw new Error('Série inválida.');const entry={...row,...patch};if(!Number.isFinite(entry.kg)||entry.kg<0||entry.kg>1000||!Number.isInteger(entry.reps)||entry.reps<1||entry.reps>300)throw new Error('Confira a carga e as repetições.');return {...s,sets:s.sets.map((sets,i)=>i===exerciseIndex?sets.map((v,j)=>j===setIndex?entry:v):sets),...(patch.done===true?{restEndsAt:now+s.snapshot.exercises[exerciseIndex].rest*1000,restPausedSeconds:null}:{})};});
}
export function finishSession(data:DemoData,now=Date.now()):{data:DemoData;record:TrainingRecord} {
 const student=assertStudentActor(data);const s=data.sessions[student.id];if(!s)throw new Error('Nenhum treino em andamento.');if(!completedSets(s))throw new Error('Marque pelo menos uma série para finalizar.');
 const record:TrainingRecord={id:s.id,studentId:s.studentId,planId:s.planId,name:s.snapshot.name,letter:s.snapshot.letter,revision:s.revision,date:new Date(now).toISOString(),seconds:elapsed(s,now),sample:false,exercises:s.snapshot.exercises.map((e,i)=>({exerciseId:e.exerciseId,sets:s.sets[i].filter(s=>s.done).map(({kg,reps})=>({kg,reps}))})).filter(e=>e.sets.length>0)};
 const sessions={...data.sessions};delete sessions[student.id];return {record,data:{...data,sessions,history:[record,...data.history.filter(r=>r.id!==record.id)]}};
}
export function discardSession(data:DemoData):DemoData {const student=assertStudentActor(data);const sessions={...data.sessions};delete sessions[student.id];return {...data,sessions};}
export function statistics(history:TrainingRecord[],now=new Date()) {
 const start=monday(now);const current=history.filter(h=>new Date(h.date)>=start);const weekly=Array.from({length:6},(_,i)=>{const s=new Date(start);s.setDate(s.getDate()-(5-i)*7);const end=new Date(s);end.setDate(end.getDate()+7);return {date:s,label:i===5?'Atual':s.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'}),count:new Set(history.filter(h=>new Date(h.date)>=s&&new Date(h.date)<end).map(h=>dayKey(h.date))).size};});
 const activeWeeks=new Set(history.map(h=>dayKey(monday(new Date(h.date)))));let cursor=new Date(start),streak=0;
 if(!activeWeeks.has(dayKey(cursor)))cursor.setDate(cursor.getDate()-7);
 while(activeWeeks.has(dayKey(cursor))){streak++;cursor.setDate(cursor.getDate()-7);if(streak>520)break;}
 return {weekly,current,streak,weekDays:new Set(current.map(r=>dayKey(r.date))).size,frequency:Math.round(weekly.reduce((n,w)=>n+w.count,0)/6*10)/10};
}
export function loadSeries(history:TrainingRecord[],exerciseId:string) {return history.filter(h=>h.exercises.some(e=>e.exerciseId===exerciseId)).sort((a,b)=>Date.parse(a.date)-Date.parse(b.date)).map(h=>({date:h.date,kg:Math.max(...h.exercises.filter(e=>e.exerciseId===exerciseId).flatMap(e=>e.sets.map(s=>s.kg)))}));}
export function migrateSavedData(input:unknown):unknown {
 const legacy=input as {version?:number;students?:unknown;teachers?:unknown};
 if(!legacy||legacy.version!==2||!Array.isArray(legacy.students)||!Array.isArray(legacy.teachers))return input;
 const next=clone(legacy) as unknown as DemoData;
 next.version=3;
 next.students=next.students.map(student=>student.id==='caue'?{...student,mode:'accompanied',teacherId:'bruno'}:student);
 if(!next.teachers.some(teacher=>teacher.id==='diego'))next.teachers.push({id:'diego',name:'Diego Nunes',specialty:'Treinamento funcional'});
 if(next.actor?.id==='caue'&&next.actor.role==='autonomous')next.actor={role:'accompanied',id:'caue'};
 return next;
}
export function restoreSavedData(input:unknown):DemoData|null {const candidate=migrateSavedData(input);return validateSavedData(candidate)?candidate:null;}
export function validateSavedData(input:unknown):input is DemoData {
 try {
  const d=input as DemoData;if(!d||d.version!==3||!Array.isArray(d.students)||!Array.isArray(d.teachers)||!Array.isArray(d.plans)||!Array.isArray(d.history)||!d.sessions||typeof d.sessions!=='object'||!d.gym?.name)return false;
  if(!d.students.every(s=>typeof s.id==='string'&&typeof s.name==='string'&&['autonomous','accompanied'].includes(s.mode)&&Number.isInteger(s.goal)&&s.goal>=1&&s.goal<=7))return false;
  if(!d.teachers.every(t=>typeof t.id==='string'&&typeof t.name==='string'))return false;
  for(const p of d.plans){if(typeof p.id!=='string'||!d.students.some(s=>s.id===p.studentId))return false;validateContent(p.draft);if(p.published)validateContent(p.published);}
  for(const r of d.history){if(typeof r.id!=='string'||!d.students.some(s=>s.id===r.studentId)||!Number.isFinite(Date.parse(r.date))||!Number.isFinite(r.seconds)||r.seconds<0||!Array.isArray(r.exercises))return false;for(const e of r.exercises)if(!exerciseById(e.exerciseId)||!e.sets.every(s=>Number.isFinite(s.kg)&&s.kg>=0&&Number.isFinite(s.reps)&&s.reps>=1))return false;}
  for(const [key,s] of Object.entries(d.sessions)){validateContent(s.snapshot);if(key!==s.studentId||!d.students.some(p=>p.id===key)||!Number.isFinite(s.startedAt)||!Number.isFinite(s.pausedMs)||s.pausedMs<0||(s.pausedAt!==null&&!Number.isFinite(s.pausedAt))||!Number.isInteger(s.exerciseIndex)||s.exerciseIndex<0||s.exerciseIndex>=s.snapshot.exercises.length||s.sets.length!==s.snapshot.exercises.length)return false;for(const [i,row] of s.sets.entries())if(row.length!==s.snapshot.exercises[i].sets||!row.every(e=>Number.isFinite(e.kg)&&e.kg>=0&&Number.isInteger(e.reps)&&e.reps>=1&&typeof e.done==='boolean'))return false;}
  if(d.actor){const a=d.actor;if(!['autonomous','accompanied','teacher','admin'].includes(a.role))return false;if(a.role==='teacher'&&!d.teachers.some(t=>t.id===a.id)||a.role==='admin'&&a.id!=='academy'||['autonomous','accompanied'].includes(a.role)&&!d.students.some(s=>s.id===a.id&&s.mode===a.role))return false;}
  return true;
 }catch{return false;}
}

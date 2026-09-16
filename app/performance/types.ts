export type MuscleGroup = 'Peito' | 'Costas' | 'Ombros' | 'Bíceps' | 'Tríceps' | 'Quadríceps' | 'Posterior de coxa' | 'Glúteos' | 'Panturrilhas' | 'Abdômen' | 'Antebraços';
export type Exercise = {
  id: string; name: string; group: MuscleGroup; secondary: string[];
  equipment: string; images: string[]; muscleImage: string; sourceId: string;
  tips: string[]; unit: 'reps' | 'seconds';
};
export type Role = 'autonomous' | 'accompanied' | 'teacher' | 'admin';
export type Actor = {role: Role; id: string};
export type Student = {id:string;name:string;mode:'autonomous'|'accompanied';teacherId:string|null;goal:number;objective:string;joinedAt:string};
export type Teacher = {id:string;name:string;specialty:string};
export type PlanLine = {id:string;exerciseId:string;sets:number;reps:number;kg:number;rest:number};
export type PlanContent = {letter:string;name:string;notes:string;exercises:PlanLine[]};
export type TrainingPlan = {id:string;studentId:string;authorId:string;draft:PlanContent;published:PlanContent|null;revision:number;updatedAt:string;publishedAt:string|null};
export type SetRecord = {kg:number;reps:number;done:boolean};
export type TrainingSession = {
 id:string;studentId:string;planId:string;revision:number;snapshot:PlanContent;startedAt:number;pausedAt:number|null;pausedMs:number;
 exerciseIndex:number;sets:SetRecord[][];restEndsAt:number|null;restPausedSeconds:number|null;
};
export type CompletedExercise = {exerciseId:string;sets:{kg:number;reps:number}[]};
export type TrainingRecord = {id:string;studentId:string;planId:string;name:string;letter:string;revision:number;date:string;seconds:number;exercises:CompletedExercise[];sample:boolean};
export type DemoData = {
 version:3;actor:Actor|null;students:Student[];teachers:Teacher[];plans:TrainingPlan[];
 sessions:Record<string,TrainingSession>;history:TrainingRecord[];
 gym:{name:string;city:string;address:string;hours:string;email:string;since:string};
};
export type Screen = 'home'|'plans'|'library'|'progress'|'profile'|'students'|'student'|'teachers'|'gym'|'detail'|'editor'|'session'|'success';

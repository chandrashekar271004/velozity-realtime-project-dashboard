import { Request,Response } from 'express'; import { z } from 'zod'; import { prisma } from '../config/db.js'; import { fail,ok } from '../utils/http.js'; import { createActivity } from '../services/activity.js'; import { notify } from '../services/notify.js'; import { broadcastActivity,broadcastNotification,onlineCount } from '../sockets/socket.js';
const id=z.string().min(1); const status=z.enum(['TODO','IN_PROGRESS','IN_REVIEW','DONE']); const priority=z.enum(['LOW','MEDIUM','HIGH','CRITICAL']);
export const clientSchema=z.object({name:z.string().min(2),email:z.string().email(),company:z.string().optional()});
export const projectSchema=z.object({name:z.string().min(2),description:z.string().optional(),clientId:id});
export const taskSchema=z.object({projectId:id,title:z.string().min(2),description:z.string().default(''),developerId:id,status:status.default('TODO'),priority:priority.default('MEDIUM'),dueDate:z.coerce.date()});
export const statusSchema=z.object({status});
function forbidden(res:Response){return fail(res,403,'FORBIDDEN','You do not have access to this resource');}
export async function clients(req:Request,res:Response){if(req.user!.role!=='ADMIN'&&req.user!.role!=='PM')return forbidden(res);return ok(res,await prisma.client.findMany({orderBy:{name:'asc'}}));}
export async function createClient(req:Request,res:Response){if(req.user!.role!=='ADMIN')return forbidden(res);return ok(res,await prisma.client.create({data:{...req.body,createdById:req.user!.id}}),201);}
export async function projects(req:Request,res:Response){const u=req.user!;if(u.role==='DEVELOPER')return forbidden(res);const where:any=u.role==='ADMIN'?{}:{ownerId:u.id};const ps=await prisma.project.findMany({where,include:{client:true,_count:{select:{tasks:true}}},orderBy:{createdAt:'desc'}});return ok(res,ps);}
export async function createProject(req:Request,res:Response){const p=await prisma.project.create({data:{...req.body,ownerId:req.user!.id}});const a=await createActivity({type:'PROJECT_CREATED',message:`${req.user!.name} created project ${p.name}`,projectId:p.id,actorId:req.user!.id});broadcastActivity(a,p.id);return ok(res,p,201);}
export async function createTask(req:Request,res:Response){const p=await prisma.project.findUnique({where:{id:req.body.projectId}});if(!p)return fail(res,404,'NOT_FOUND','Project not found');if(req.user!.role==='PM'&&p.ownerId!==req.user!.id)return forbidden(res);if(req.user!.role==='DEVELOPER'||!['ADMIN','PM'].includes(req.user!.role))return forbidden(res);const dev=await prisma.user.findUnique({where:{id:req.body.developerId},select:{id:true,role:true}});if(!dev||dev.role!=='DEVELOPER')return fail(res,400,'INVALID_DEVELOPER','Task must be assigned to a developer');const t=await prisma.task.create({data:req.body});const a=await createActivity({type:'TASK_CREATED',message:`${req.user!.name} created Task #${t.id}`,projectId:t.projectId,taskId:t.id,actorId:req.user!.id});broadcastActivity(a,t.projectId,t.id);const n=await notify(t.developerId,'TASK_ASSIGNED','Task assigned',`You were assigned ${t.title}`,t.id);broadcastNotification(t.developerId,n);return ok(res,t,201);}
export async function tasks(req:Request,res:Response){const u=req.user!;const q=req.query as any;const where:any={};if(u.role==='DEVELOPER')where.developerId=u.id;if(u.role==='PM')where.project={ownerId:u.id};if(q.projectId)where.projectId=q.projectId;if(q.status)where.status=q.status;if(q.priority)where.priority=q.priority;if(q.from||q.to)where.dueDate={...(q.from?{gte:new Date(q.from)}:{}),...(q.to?{lte:new Date(q.to)}:{})};return ok(res,await prisma.task.findMany({where,include:{developer:{select:{id:true,name:true,email:true}},project:{select:{id:true,name:true,ownerId:true}}},orderBy:[{priority:'desc'},{dueDate:'asc'}]}));}
export async function updateTaskStatus(req: Request, res: Response) {
  const taskId = String(req.params.id);

  const t = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      project: true,
      developer: true,
    },
  });

  if (!t) {
    return fail(res, 404, 'NOT_FOUND', 'Task not found');
  }

  if (
    req.user!.role === 'PM' &&
    t.project.ownerId !== req.user!.id
  ) {
    return forbidden(res);
  }

  if (
    req.user!.role === 'DEVELOPER' &&
    t.developerId !== req.user!.id
  ) {
    return forbidden(res);
  }

  if (t.status === req.body.status) {
    return ok(res, t);
  }

  const updated = await prisma.$transaction(async (tx) => {
    const nt = await tx.task.update({
      where: { id: t.id },
      data: { status: req.body.status },
    });

    await tx.taskStatusHistory.create({
      data: {
        taskId: t.id,
        fromStatus: t.status,
        toStatus: req.body.status,
        changedById: req.user!.id,
      },
    });

    return nt;
  });

  const a = await createActivity({
    type: 'TASK_STATUS_CHANGED',
    message: `${req.user!.name} moved Task #${t.id} from ${t.status.replaceAll(
      '_',
      ' '
    )} → ${req.body.status.replaceAll('_', ' ')}`,
    projectId: t.projectId,
    taskId: t.id,
    actorId: req.user!.id,
    metadata: {
      from: t.status,
      to: req.body.status,
    },
  });

  broadcastActivity(a, t.projectId, t.id);

  if (
    req.body.status === 'IN_REVIEW' &&
    req.user!.role === 'DEVELOPER'
  ) {
    const p = await prisma.project.findUnique({
      where: { id: t.projectId },
      select: { ownerId: true },
    });

    if (p) {
      const n = await notify(
        p.ownerId,
        'TASK_IN_REVIEW',
        'Task in review',
        `${t.title} was moved to In Review`,
        t.id
      );

      broadcastNotification(p.ownerId, n);
    }
  }

  return ok(res, updated);
}
export async function activity(req:Request,res:Response){return ok(res,await import('../services/activity.js').then(x=>x.visibleActivities(req.user!,20)));}
export async function missed(req:Request,res:Response){const since=req.query.since?new Date(String(req.query.since)):undefined;if(since&&Number.isNaN(since.getTime()))return fail(res,400,'VALIDATION_ERROR','Invalid since timestamp');return ok(res,await import('../services/activity.js').then(x=>x.visibleActivities(req.user!,20,since)));}
export async function notifications(req:Request,res:Response){return ok(res,await prisma.notification.findMany({where:{userId:req.user!.id},orderBy:{createdAt:'desc'},take:30}));}
export async function unread(req:Request,res:Response){return ok(res,{count:await prisma.notification.count({where:{userId:req.user!.id,readAt:null}})});}
export async function markRead(req: Request, res: Response) {
  const notificationId = String(req.params.id);

  const n = await prisma.notification.findUnique({
    where: { id: notificationId },
  });

  if (!n || n.userId !== req.user!.id) {
    return forbidden(res);
  }

  return ok(
    res,
    await prisma.notification.update({
      where: { id: n.id },
      data: { readAt: new Date() },
    })
  );
}
export async function markAllRead(req:Request,res:Response){await prisma.notification.updateMany({where:{userId:req.user!.id,readAt:null},data:{readAt:new Date()}});return ok(res,{message:'All notifications marked read'});}
export async function dashboard(req:Request,res:Response){const u=req.user!;const projectWhere:any=u.role==='ADMIN'?{}:u.role==='PM'?{ownerId:u.id}:{tasks:{some:{developerId:u.id}}};const taskWhere:any=u.role==='DEVELOPER'?{developerId:u.id}:u.role==='PM'?{project:{ownerId:u.id}}:{};const [pc,tc,overdue,byStatus,byPriority]=await Promise.all([prisma.project.count({where:projectWhere}),prisma.task.count({where:taskWhere}),prisma.task.count({where:{...taskWhere,status:'OVERDUE'}}),prisma.task.groupBy({by:['status'],where:taskWhere,_count:{_all:true}}),prisma.task.groupBy({by:['priority'],where:taskWhere,_count:{_all:true}})]);return ok(res,{role:u.role,projects:pc,tasks:tc,overdue,byStatus,byPriority,onlineUsers:onlineCount()});}
export async function users(req:Request,res:Response){if(req.user!.role==='DEVELOPER')return forbidden(res);return ok(res,await prisma.user.findMany({where:{role:req.query.role?String(req.query.role) as any:undefined},select:{id:true,name:true,email:true,role:true},orderBy:{name:'asc'}}));}

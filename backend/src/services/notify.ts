import { prisma } from '../config/db.js'; import { NotificationType } from '@prisma/client';
export async function notify(userId:string,type:NotificationType,title:string,message:string,taskId?:string){return prisma.notification.create({data:{userId,type,title,message,taskId}});}

import { Response } from 'express';
export const ok=(res:Response,data:unknown,status=200)=>res.status(status).json({success:true,data});
export const fail=(res:Response,status:number,code:string,message:string,details?:unknown)=>res.status(status).json({success:false,error:{code,message,details}});
export class AppError extends Error { constructor(public status:number,public code:string,message:string,public details?:unknown){super(message);} }

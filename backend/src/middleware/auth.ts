import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { Role } from '@prisma/client';
import { fail } from '../utils/http.js';
export type AuthUser={id:string;role:Role;email:string;name:string};
declare global { namespace Express { interface Request { user?:AuthUser } } }
export function requireAuth(req:Request,res:Response,next:NextFunction){try{const h=req.headers.authorization;if(!h?.startsWith('Bearer '))return fail(res,401,'UNAUTHORIZED','Authentication required');req.user=jwt.verify(h.slice(7),env.JWT_ACCESS_SECRET) as AuthUser;next();}catch{return fail(res,401,'INVALID_TOKEN','Invalid or expired access token');}}
export const requireRole=(...roles:Role[]) => (req:Request,res:Response,next:NextFunction)=>{if(!req.user)return fail(res,401,'UNAUTHORIZED','Authentication required');if(!roles.includes(req.user.role))return fail(res,403,'FORBIDDEN','Insufficient permissions');next();};

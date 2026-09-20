import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { fail } from '../utils/http.js';
export function notFound(_req:Request,res:Response){fail(res,404,'NOT_FOUND','Route not found');}
export function errorHandler(err:unknown,_req:Request,res:Response,_next:NextFunction){if(err instanceof ZodError)return fail(res,400,'VALIDATION_ERROR','Invalid request data',err.issues);if(err instanceof Prisma.PrismaClientKnownRequestError)return fail(res,400,'DATABASE_ERROR','Database operation failed');console.error(err);return fail(res,500,'INTERNAL_ERROR','Internal server error');}

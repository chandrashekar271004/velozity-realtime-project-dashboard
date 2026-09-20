import { Request, Response, NextFunction } from 'express';
import { ZodType } from 'zod';

export const validate =
  (schema: ZodType<any>) =>
  (req: Request, _res: Response, next: NextFunction) => {
    req.body = schema.parse(req.body);
    next();
  };

export const validateQuery =
  (schema: ZodType<any>) =>
  (req: Request, _res: Response, next: NextFunction) => {
    schema.parse(req.query);
    next();
  };
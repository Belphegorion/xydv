import type { Request, Response, NextFunction } from 'express';
import type { AnyZodObject } from 'zod';

export function validateRequest(schema: AnyZodObject) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
        cookies: req.cookies,
      });

      // Assign parsed/coerced values back to request
      if (parsed.body) req.body = parsed.body;
      if (parsed.query) {
        Object.defineProperty(req, 'query', {
          value: parsed.query,
          writable: true,
          configurable: true,
          enumerable: true,
        });
      }
      if (parsed.params) req.params = parsed.params;

      next();
    } catch (error) {
      next(error);
    }
  };
}

export default validateRequest;

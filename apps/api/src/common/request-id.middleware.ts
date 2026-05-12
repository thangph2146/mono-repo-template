import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

export const REQUEST_ID_HEADER = 'x-request-id';

export function RequestIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const requestId =
    (req.headers[REQUEST_ID_HEADER] as string) ||
    (req.headers['x-correlation-id'] as string) ||
    randomUUID();

  req.headers[REQUEST_ID_HEADER] = requestId;
  res.setHeader(REQUEST_ID_HEADER, requestId);

  next();
}

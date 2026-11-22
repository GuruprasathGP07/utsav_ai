import type { IncomingMessage, ServerResponse } from 'node:http';
import { app } from '../server/index.js';

export default function handler(req: IncomingMessage, res: ServerResponse): void {
  if (req.url && !req.url.startsWith('/api')) {
    req.url = `/api${req.url}`;
  }
  app(req, res);
}

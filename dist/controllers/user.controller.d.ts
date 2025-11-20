import type { Response } from 'express';
import type { AuthRequest } from '../middleware/auth.middleware.js';
export declare const getUserByCustomerId: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=user.controller.d.ts.map
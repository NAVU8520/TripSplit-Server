import type { Request, Response } from 'express';
export declare const createTrip: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getTrips: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getTrip: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const addParticipant: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=trip.controller.d.ts.map
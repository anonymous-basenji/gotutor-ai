import { Router, RequestHandler } from 'express';
import { AuthController } from '../controllers/auth.controller';

export const createAuthRoutes = (controller: AuthController, requireAuth: RequestHandler): Router => {
    const router = Router();

    router.post('/sync-user', requireAuth, controller.syncUser);
    router.get('/me', requireAuth, controller.getProfile);

    return router;
};

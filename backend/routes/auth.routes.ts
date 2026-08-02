/**
 * Auth Routes — wires URLs to controller methods.
 *
 * This is a factory function: it receives the controller and middleware,
 * and returns a configured Router. This is done in index.ts during startup.
 *
 * Notice how clean this is — each line is just:
 *   HTTP method + URL path + middleware + controller method
 */
import { Router, RequestHandler } from 'express';
import { AuthController } from '../controllers/auth.controller';

export const createAuthRoutes = (controller: AuthController, requireAuth: RequestHandler): Router => {
    const router = Router();

    router.post('/sync-user', requireAuth, controller.syncUser);
    router.get('/me', requireAuth, controller.getProfile);

    return router;
};

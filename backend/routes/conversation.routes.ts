import { Router, RequestHandler } from 'express';
import { ConversationController } from '../controllers/conversation.controller';

export const createConversationRoutes = (controller: ConversationController, requireAuth: RequestHandler): Router => {
    const router = Router();

    router.get('/', requireAuth, controller.getConversations);

    return router;
};

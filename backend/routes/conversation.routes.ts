import { Router, RequestHandler } from 'express';
import { ConversationController } from '../controllers/conversation.controller';

export const createConversationRoutes = (controller: ConversationController, requireAuth: RequestHandler): Router => {
    const router = Router();

    router.get('/', requireAuth, controller.getConversations);
    router.post('/', requireAuth, controller.createConversation);
    router.post('/create-conversation', requireAuth, controller.createConversation);
    router.get('/:conversationId', requireAuth, controller.getConversationDetail);
    router.patch('/:conversationId', requireAuth, controller.updateConversation);
    router.get('/:conversationId/messages', requireAuth, controller.getMessages);
    router.post('/:conversationId/messages', requireAuth, controller.sendMessage);
    router.delete('/:conversationId', requireAuth, controller.deleteConversation);

    return router;
};

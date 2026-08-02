import { Router, RequestHandler } from 'express';
import { ClassController } from '../controllers/class.controller';

export const createClassRoutes = (controller: ClassController, requireAuth: RequestHandler): Router => {
    const router = Router();

    router.post('/create-class', requireAuth, controller.createClass);
    router.get('/get-classes', requireAuth, controller.getClasses);
    router.get('/get-class/:id', requireAuth, controller.getClassDetail);
    router.post('/add-user-to-class', requireAuth, controller.addUserToClass);
    router.post('/add-user-by-email', requireAuth, controller.addUserByEmail);
    router.delete('/remove-user', requireAuth, controller.removeUser);
    router.delete('/delete-class', requireAuth, controller.deleteClass);
    router.post('/rename-class', requireAuth, controller.renameClass);

    return router;
};

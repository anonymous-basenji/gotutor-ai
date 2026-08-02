import { Request, Response } from 'express';
import { ClassService } from '../services/class.service';
import { BadRequestError } from '../errors/AppError';
import {
    createClassSchema,
    addUserToClassSchema,
    addUserByEmailSchema,
    removeUserSchema,
    deleteClassSchema,
    renameClassSchema,
} from '../schemas/class.schemas';

export class ClassController {
    constructor(private classService: ClassService) {}

    createClass = async (req: Request, res: Response): Promise<void> => {
        const { name } = createClassSchema.parse(req.body);
        const result = await this.classService.createClass(name);
        res.status(201).json(result);
    };

    getClasses = async (req: Request, res: Response): Promise<void> => {
        const result = await this.classService.getUserClasses(req.userId);
        res.status(200).json(result);
    };

    getClassDetail = async (req: Request, res: Response): Promise<void> => {
        const classId = req.params.id as string;
        const result = await this.classService.getClassDetail(req.userId, classId);
        res.status(200).json(result);
    };

    addUserToClass = async (req: Request, res: Response): Promise<void> => {
        const { class_id, role } = addUserToClassSchema.parse(req.body);
        const result = await this.classService.addSelfToClass(req.userId, class_id, role);
        res.status(201).json(result);
    };

    addUserByEmail = async (req: Request, res: Response): Promise<void> => {
        const { class_id, email, role } = addUserByEmailSchema.parse(req.body);
        const result = await this.classService.addUserByEmail(req.userId, class_id, email, role);
        res.status(201).json(result);
    };

    removeUser = async (req: Request, res: Response): Promise<void> => {
        const data = removeUserSchema.parse(req.body);

        const targetUserId = data.user_id || data.target_user_id || data.student_id;
        if (!targetUserId) {
            throw new BadRequestError('class_id and user_id are required');
        }

        const result = await this.classService.removeUser(
            req.userId,
            targetUserId,
            data.class_id,
            data.role,
        );
        res.status(200).json(result);
    };

    deleteClass = async (req: Request, res: Response): Promise<void> => {
        const { class_id } = deleteClassSchema.parse(req.body);
        const result = await this.classService.deleteClass(req.userId, class_id);
        res.status(200).json(result);
    };

    renameClass = async (req: Request, res: Response): Promise<void> => {
        const { class_id, new_name } = renameClassSchema.parse(req.body);
        const result = await this.classService.renameClass(req.userId, class_id, new_name);
        res.status(200).json(result);
    };
}

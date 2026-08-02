/**
 * Class Controller — HTTP handling for /classes endpoints.
 *
 * Each method: parse input (Zod) → call service → send response.
 * No business logic lives here — that's all in ClassService.
 */
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

    /** POST /classes/create-class */
    createClass = async (req: Request, res: Response): Promise<void> => {
        const { name } = createClassSchema.parse(req.body);
        const result = await this.classService.createClass(name);
        res.status(201).json(result);
    };

    /** GET /classes/get-classes */
    getClasses = async (req: Request, res: Response): Promise<void> => {
        const result = await this.classService.getUserClasses(req.userId);
        res.status(200).json(result);
    };

    /** GET /classes/get-class/:id */
    getClassDetail = async (req: Request, res: Response): Promise<void> => {
        const classId = req.params.id as string;
        const result = await this.classService.getClassDetail(req.userId, classId);
        res.status(200).json(result);
    };

    /** POST /classes/add-user-to-class */
    addUserToClass = async (req: Request, res: Response): Promise<void> => {
        const { class_id, role } = addUserToClassSchema.parse(req.body);
        const result = await this.classService.addSelfToClass(req.userId, class_id, role);
        res.status(201).json(result);
    };

    /** POST /classes/add-user-by-email */
    addUserByEmail = async (req: Request, res: Response): Promise<void> => {
        const { class_id, email, role } = addUserByEmailSchema.parse(req.body);
        const result = await this.classService.addUserByEmail(req.userId, class_id, email, role);
        res.status(201).json(result);
    };

    /** DELETE /classes/remove-user */
    removeUser = async (req: Request, res: Response): Promise<void> => {
        const data = removeUserSchema.parse(req.body);

        // The frontend can send the target user ID under different field names
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

    /** DELETE /classes/delete-class */
    deleteClass = async (req: Request, res: Response): Promise<void> => {
        const { class_id } = deleteClassSchema.parse(req.body);
        const result = await this.classService.deleteClass(req.userId, class_id);
        res.status(200).json(result);
    };

    /** POST /classes/rename-class */
    renameClass = async (req: Request, res: Response): Promise<void> => {
        const { class_id, new_name } = renameClassSchema.parse(req.body);
        const result = await this.classService.renameClass(req.userId, class_id, new_name);
        res.status(200).json(result);
    };
}

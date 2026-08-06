import { Request, Response } from 'express';
import { ConversationService } from '../services/conversation.service';
import { BadRequestError } from '../errors/AppError';
import { createConversationSchema, updateConversationSchema } from '../schemas/conversation.schemas';

export class ConversationController {
    constructor(private conversationService: ConversationService) {}

    createConversation = async (req: Request, res: Response): Promise<void> => {
        const payload = {
            class_id: req.body?.class_id || req.query?.class_id,
            student_id: req.body?.student_id || req.query?.student_id,
            title: req.body?.title,
        };

        const data = createConversationSchema.parse(payload);
        const studentId = data.student_id || req.userId;

        const result = await this.conversationService.createConversation(
            req.userId,
            studentId,
            data.class_id,
            data.title
        );

        res.status(201).json(result);
    };

    updateConversation = async (req: Request, res: Response): Promise<void> => {
        const conversationIdParam = req.params.conversationId;
        const conversationIdStr = Array.isArray(conversationIdParam) ? conversationIdParam[0] : conversationIdParam;
        const conversationId = parseInt(conversationIdStr, 10);

        if (isNaN(conversationId)) {
            throw new BadRequestError('Invalid conversation ID');
        }

        const { title } = updateConversationSchema.parse(req.body);

        const result = await this.conversationService.updateConversationTitle(
            req.userId,
            conversationId,
            title
        );

        res.status(200).json(result);
    };

    getConversations = async (req: Request, res: Response): Promise<void> => {
        const classId = req.query.class_id as string;
        const studentId = req.query.student_id as string | undefined;

        const result = await this.conversationService.getConversations(
            req.userId,
            classId,
            studentId,
        );

        res.status(200).json(result);
    };
}

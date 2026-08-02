/**
 * Conversation Controller — HTTP handling for /conversations endpoints.
 */
import { Request, Response } from 'express';
import { ConversationService } from '../services/conversation.service';

export class ConversationController {
    constructor(private conversationService: ConversationService) {}

    /** GET /conversations?class_id=...&student_id=... */
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

import { Request, Response } from 'express';
import { ConversationService } from '../services/conversation.service';
import { BadRequestError } from '../errors/AppError';
import { createConversationSchema, updateConversationSchema, sendMessageSchema } from '../schemas/conversation.schemas';

const parseConversationId = (param: string | string[] | undefined): number | string => {
    const str = Array.isArray(param) ? param[0] : param;
    if (!str) throw new BadRequestError('Invalid conversation ID');
    const num = Number(str);
    if (!isNaN(num) && String(num) === str.trim()) {
        return num;
    }
    return str;
};

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
        const conversationId = parseConversationId(req.params.conversationId);
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

    getConversationDetail = async (req: Request, res: Response): Promise<void> => {
        const conversationId = parseConversationId(req.params.conversationId);
        const conversation = await this.conversationService.getConversationDetail(req.userId, conversationId);
        res.status(200).json(conversation);
    };

    getMessages = async (req: Request, res: Response): Promise<void> => {
        const conversationId = parseConversationId(req.params.conversationId);
        const messages = await this.conversationService.getMessages(req.userId, conversationId);
        res.status(200).json(messages);
    };

    deleteConversation = async (req: Request, res: Response): Promise<void> => {
        const conversationId = parseConversationId(req.params.conversationId);
        const result = await this.conversationService.deleteConversation(req.userId, conversationId);
        res.status(200).json(result);
    };

    sendMessage = async (req: Request, res: Response): Promise<void> => {
        const conversationId = parseConversationId(req.params.conversationId);

        const body = sendMessageSchema.parse(req.body);
        const content = (body.content || '').trim();

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        const abortController = new AbortController();
        req.on('close', () => {
            if (!res.writableEnded) {
                abortController.abort();
            }
        });

        try {
            const result = await this.conversationService.sendMessageStream(
                req.userId,
                conversationId,
                content,
                (chunkText: string) => {
                    if (!res.writableEnded) {
                        res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
                    }
                },
                body.attachment_url,
                body.attachment_name,
                body.attachment_type,
                abortController.signal,
            );

            if (!res.writableEnded) {
                if (result && result.newTitle) {
                    res.write(`data: ${JSON.stringify({ title: result.newTitle })}\n\n`);
                }

                res.write('data: [DONE]\n\n');
                res.end();
            }
        } catch (e: any) {
            if (abortController.signal.aborted) {
                if (!res.writableEnded) {
                    res.end();
                }
                return;
            }
            throw e;
        }
    };
}

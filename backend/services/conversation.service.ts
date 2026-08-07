import { ConversationRepository } from '../repositories/conversation.repository';
import { MembershipRepository } from '../repositories/membership.repository';
import { MessageRepository } from '../repositories/message.repository';
import { ForbiddenError, NotFoundError, AppError } from '../errors/AppError';

export class ConversationService {
    constructor(
        private conversationRepo: ConversationRepository,
        private membershipRepo: MembershipRepository,
        private messageRepo: MessageRepository,
    ) {}

    async createConversation(requesterId: string, studentId: string, classId: string, customTitle?: string) {
        const title = customTitle || "New Conversation";
        const startedAt = new Date().toISOString();

        if (studentId !== requesterId) {
            throw new ForbiddenError('Access denied: You cannot create conversations as another user');
        }

        return await this.conversationRepo.create(title, studentId, classId, startedAt);
    }

    async updateConversationTitle(requesterId: string, conversationId: number | string, title: string) {
        const conversation = await this.conversationRepo.findById(conversationId);
        if (!conversation) {
            throw new NotFoundError('Conversation not found');
        }

        if (conversation.student_id !== requesterId) {
            const isSupervisor = await this.membershipRepo.isSupervisor(requesterId, conversation.class_id);
            if (!isSupervisor) {
                throw new ForbiddenError('Access denied: You cannot update this conversation');
            }
        }

        return await this.conversationRepo.updateTitle(conversationId, title);
    }

    async getConversations(requesterId: string, classId: string, targetStudentId?: string) {
        const studentId = targetStudentId || requesterId;

        if (studentId !== requesterId) {
            const isSupervisor = await this.membershipRepo.isSupervisor(requesterId, classId);
            if (!isSupervisor) {
                throw new ForbiddenError('Access denied: You are not a supervisor in this class');
            }

            const targetIsSupervisor = await this.membershipRepo.isSupervisor(studentId, classId);
            if (targetIsSupervisor) {
                throw new ForbiddenError('Access denied: Supervisors cannot view conversations of other supervisors');
            }
        }

        return await this.conversationRepo.findByStudentAndClass(studentId, classId);
    }

    async getConversationDetail(requesterId: string, conversationId: number | string) {
        const conversation = await this.conversationRepo.findById(conversationId);
        if (!conversation) {
            throw new NotFoundError('Conversation not found');
        }

        if (conversation.student_id !== requesterId) {
            const isSupervisor = await this.membershipRepo.isSupervisor(requesterId, conversation.class_id);
            if (!isSupervisor) {
                throw new ForbiddenError('Access denied: You do not have access to this conversation');
            }
        }

        return conversation;
    }

    async getMessages(requesterId: string, conversationId: number | string) {
        await this.getConversationDetail(requesterId, conversationId);
        return await this.messageRepo.findByConversationId(conversationId);
    }

    async sendMessageStream(
        requesterId: string, 
        conversationId: number | string, 
        userContent: string, 
        onChunk: (chunk: string) => void
    ) {
        const conversation = await this.conversationRepo.findById(conversationId);
        if (!conversation) {
            throw new NotFoundError('Conversation not found');
        }

        if (conversation.student_id !== requesterId) {
            throw new ForbiddenError('Access denied: Only the owner of this conversation can send messages');
        }

        await this.messageRepo.create(conversationId, 'user', userContent);

        const history = await this.messageRepo.findByConversationId(conversationId);
        const formattedMessages = history.map(m => ({
            role: m.role === 'assistant' ? 'assistant' : 'user',
            content: m.content,
        }));

        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) {
            throw new AppError('OpenRouter API key missing', 500);
        }

        const openRouterRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'HTTP-Referer': process.env.VITE_FRONTEND_URL || 'http://localhost:5173',
                'X-Title': 'GoTutor.ai',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'inclusionai/ling-3.0-tiny:free',
                messages: formattedMessages,
                stream: true,
            }),
        });

        if (!openRouterRes.ok || !openRouterRes.body) {
            const errText = await openRouterRes.text();
            console.error('[OpenRouter Error Dump] Status:', openRouterRes.status, 'Body:', errText);
            throw new AppError(`An error occurred and your response could not be completed (Code: ${openRouterRes.status})`, openRouterRes.status || 502);
        }

        let fullAssistantText = '';
        const reader = openRouterRes.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';

        let isStreamDone = false;
        while (!isStreamDone) {
            const { value, done } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed || !trimmed.startsWith('data: ')) continue;
                const jsonStr = trimmed.replace(/^data:\s*/, '');
                if (jsonStr === '[DONE]') {
                    isStreamDone = true;
                    break;
                }

                try {
                    const parsed = JSON.parse(jsonStr);
                    const chunkText = parsed.choices?.[0]?.delta?.content || parsed.text || '';
                    if (chunkText) {
                        fullAssistantText += chunkText;
                        onChunk(chunkText);
                    }
                } catch (e) {
                    // ignore partial JSON parse error
                }
            }
        }

        // Save assistant response to database
        if (fullAssistantText) {
            await this.messageRepo.create(conversationId, 'assistant', fullAssistantText);
        }

        // Auto-generate conversation title if the title is still default
        const rawTitleStr = conversation?.title ? String(conversation.title).trim().toLowerCase() : '';
        const isDefaultTitle = !rawTitleStr || rawTitleStr === 'new conversation' || rawTitleStr === 'conversation';
        
        console.log('[Title Gen Check]', { rawTitle: conversation?.title, isDefaultTitle, assistantLength: fullAssistantText?.length });
        
        if (isDefaultTitle && fullAssistantText) {
            const userMsg = userContent;

            try {
                console.log('[Title Gen] Sending title generation request to OpenRouter...');
                const titleRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'HTTP-Referer': process.env.VITE_FRONTEND_URL || 'http://localhost:5173',
                        'X-Title': 'GoTutor.ai',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        model: 'inclusionai/ling-3.0-tiny:free',
                        messages: [
                            {
                                role: 'system',
                                content: 'Summarize the user question into a concise 2-5 word title. Return ONLY the title text, nothing else. No quotes, no preamble.'
                            },
                            {
                                role: 'user',
                                content: userMsg
                            }
                        ],
                        max_tokens: 250,
                    }),
                });

                console.log('[Title Gen] Response status:', titleRes.status, titleRes.ok);

                if (titleRes.ok) {
                    const titleData = await titleRes.json();
                    console.log('[Title Gen] Response body:', JSON.stringify(titleData));
                    const choice = titleData.choices?.[0];
                    let rawTitle = choice?.message?.content?.trim();

                    // If content is null, extract first quoted candidate title from reasoning string
                    if (!rawTitle && choice?.message?.reasoning) {
                        const quoteMatch = choice.message.reasoning.match(/"([^"]{3,40})"/);
                        if (quoteMatch && quoteMatch[1]) {
                            rawTitle = quoteMatch[1].trim();
                        }
                    }

                    if (rawTitle) {
                        rawTitle = rawTitle
                            .replace(/^["']|["']$/g, '')
                            .replace(/^(title|subject):\s*/i, '')
                            .replace(/^(the user|the assistant|here is|summary):\s*/i, '')
                            .trim();
                        const words = rawTitle.split(/\s+/);
                        if (words.length > 6) {
                            rawTitle = words.slice(0, 6).join(' ');
                        }
                        console.log('[Title Gen Success] New title:', rawTitle);
                        await this.conversationRepo.updateTitle(conversationId, rawTitle);
                        return { fullContent: fullAssistantText, newTitle: rawTitle };
                    } else {
                        console.warn('[Title Gen] Could not extract rawTitle from content or reasoning');
                    }
                } else {
                    const titleErrText = await titleRes.text();
                    console.warn(`[Title Gen Error Dump] Status ${titleRes.status}:`, titleErrText);
                }
            } catch (err) {
                console.warn('[Title Gen] Exception thrown:', err);
            }
        }

        return { fullContent: fullAssistantText };
    }
}

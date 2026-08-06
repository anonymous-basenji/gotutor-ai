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

        // Save user message to database
        await this.messageRepo.create(conversationId, 'user', userContent);

        // Fetch entire message history
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
                models: [
                    'inclusionai/ling-3.0-tiny:free',
                    'meta-llama/llama-3.3-70b-instruct:free',
                    'google/gemma-2-9b-it:free'
                ],
                messages: formattedMessages,
                stream: true,
                provider: {
                    allow_fallbacks: true
                }
            }),
        });

        if (!openRouterRes.ok || !openRouterRes.body) {
            const errText = await openRouterRes.text();
            console.error('[OpenRouter Error Dump] Status:', openRouterRes.status, 'Body:', errText);
            
            let parsedMsg = errText || 'Failed to generate response from OpenRouter';
            try {
                const parsed = JSON.parse(errText);
                const errObj = parsed.error || parsed;
                const msg = errObj.message || errText;
                const metadataStr = errObj.metadata ? ` | Details: ${JSON.stringify(errObj.metadata)}` : '';
                parsedMsg = `${msg}${metadataStr}`;
            } catch (e) {
                // fallback to raw text
            }
            throw new AppError(`OpenRouter (${openRouterRes.status}): ${parsedMsg}`, 502);
        }

        let fullAssistantText = '';
        const reader = openRouterRes.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed || !trimmed.startsWith('data: ')) continue;
                const jsonStr = trimmed.replace(/^data:\s*/, '');
                if (jsonStr === '[DONE]') break;

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
        const isDefaultTitle = !conversation.title || conversation.title === 'New Conversation';
        
        if (isDefaultTitle && fullAssistantText) {
            const userMsg = userContent;
            const assistantMsg = fullAssistantText;

            try {
                const titleRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'HTTP-Referer': process.env.VITE_FRONTEND_URL || 'http://localhost:5173',
                        'X-Title': 'GoTutor.ai',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        models: [
                            'inclusionai/ling-3.0-tiny:free',
                            'meta-llama/llama-3.3-70b-instruct:free',
                            'google/gemma-2-9b-it:free'
                        ],
                        messages: [
                            {
                                role: 'system',
                                content: 'Generate a concise conversation title (2-6 words). Return only the title.'
                            },
                            {
                                role: 'user',
                                content: `User:\n${userMsg}\n\nAssistant:\n${assistantMsg}`
                            }
                        ],
                        max_tokens: 12,
                        provider: {
                            allow_fallbacks: true
                        }
                    }),
                });

                if (titleRes.ok) {
                    const titleData = await titleRes.json();
                    let rawTitle = titleData.choices?.[0]?.message?.content?.trim();
                    if (rawTitle) {
                        rawTitle = rawTitle.replace(/^["']|["']$/g, '').replace(/^Title:\s*/i, '').trim();
                        console.log('[Title Gen Success] New title:', rawTitle);
                        await this.conversationRepo.updateTitle(conversationId, rawTitle);
                        return { fullContent: fullAssistantText, newTitle: rawTitle };
                    }
                } else {
                    const titleErrText = await titleRes.text();
                    console.warn(`[Title Gen Error Dump] Status ${titleRes.status}:`, titleErrText);
                }
            } catch (err) {
                console.warn('Failed to generate conversation title:', err);
            }
        }

        return { fullContent: fullAssistantText };
    }
}

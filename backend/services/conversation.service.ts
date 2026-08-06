import { ConversationRepository } from '../repositories/conversation.repository';
import { MembershipRepository } from '../repositories/membership.repository';
import { ForbiddenError, NotFoundError } from '../errors/AppError';

export class ConversationService {
    constructor(
        private conversationRepo: ConversationRepository,
        private membershipRepo: MembershipRepository,
    ) {}

    async createConversation(requesterId: string, studentId: string, classId: string, customTitle?: string) {
        const title = customTitle || "New Conversation";
        const startedAt = Date.now().toString();

        if (studentId !== requesterId) {
            throw new ForbiddenError('Access denied: You cannot create conversations as another user');
        }

        return await this.conversationRepo.create(title, studentId, classId, startedAt);
    }

    async updateConversationTitle(requesterId: string, conversationId: number, title: string) {
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
}

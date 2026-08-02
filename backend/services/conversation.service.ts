/**
 * Conversation Service — business logic for viewing conversations.
 *
 * Rules:
 * - Users can view their own conversations
 * - Supervisors can view any student's conversations in their class
 * - Supervisors CANNOT view other supervisors' conversations
 */
import { ConversationRepository } from '../repositories/conversation.repository';
import { MembershipRepository } from '../repositories/membership.repository';
import { ForbiddenError } from '../errors/AppError';

export class ConversationService {
    constructor(
        private conversationRepo: ConversationRepository,
        private membershipRepo: MembershipRepository,
    ) {}

    /**
     * Get conversations for a student in a class.
     *
     * If targetStudentId is different from the requester, we check:
     * 1. The requester must be a supervisor in that class
     * 2. The target must NOT be a supervisor (can't spy on other supervisors)
     */
    async getConversations(requesterId: string, classId: number | string, targetStudentId?: string) {
        // Default to viewing your own conversations
        const studentId = targetStudentId || requesterId;

        // If viewing someone else's conversations, enforce permissions
        if (studentId !== requesterId) {
            // Requester must be a supervisor
            const isSupervisor = await this.membershipRepo.isSupervisor(requesterId, Number(classId));
            if (!isSupervisor) {
                throw new ForbiddenError('Access denied: You are not a supervisor in this class');
            }

            // Can't view another supervisor's conversations
            const targetIsSupervisor = await this.membershipRepo.isSupervisor(studentId, Number(classId));
            if (targetIsSupervisor) {
                throw new ForbiddenError('Access denied: Supervisors cannot view conversations of other supervisors');
            }
        }

        return await this.conversationRepo.findByStudentAndClass(studentId, classId);
    }
}

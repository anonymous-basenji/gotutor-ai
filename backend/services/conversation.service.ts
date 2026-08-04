import { ConversationRepository } from '../repositories/conversation.repository';
import { MembershipRepository } from '../repositories/membership.repository';
import { ForbiddenError } from '../errors/AppError';

export class ConversationService {
    constructor(
        private conversationRepo: ConversationRepository,
        private membershipRepo: MembershipRepository,
    ) {}

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

import { ClassRepository } from '../repositories/class.repository';
import { MembershipRepository } from '../repositories/membership.repository';
import { UserRepository } from '../repositories/user.repository';
import { ConversationRepository } from '../repositories/conversation.repository';
import { MessageRepository } from '../repositories/message.repository';
import { ForbiddenError, NotFoundError, AppError } from '../errors/AppError';
import { calculateAge } from '../utils/age';

type ClassId = string | number;

export class ClassService {
    constructor(
        private classRepo: ClassRepository,
        private membershipRepo: MembershipRepository,
        private userRepo: UserRepository,
        private conversationRepo: ConversationRepository,
        private messageRepo: MessageRepository,
    ) {}

    async createClass(name: string) {
        return await this.classRepo.create(name);
    }

    async getUserClasses(userId: string) {
        const memberships = await this.membershipRepo.getUserMemberships(userId);

        if (memberships.length === 0) {
            return [];
        }

        const classIds = memberships.map(m => m.class_id);
        const supervisors = await this.membershipRepo.getSupervisorsForClasses(classIds);

        const supervisorMap: Record<string, string> = {};
        for (const row of supervisors) {
            const supervisorName = (row.User as any)?.name ?? 'Unknown';
            supervisorMap[row.class_id] = supervisorName;
        }

        return memberships.map(m => ({
            class_id: m.class_id,
            role: m.role,
            name: (m.Class as any)?.name ?? 'Unnamed Class',
            supervisor: supervisorMap[m.class_id] ?? 'Unknown',
        }));
    }

    async getClassDetail(userId: string, classId: ClassId) {
        const role = await this.membershipRepo.getMemberRole(userId, classId);
        if (!role) {
            throw new ForbiddenError('Access denied: You are not a member of this class');
        }

        const classData = await this.classRepo.findById(classId);
        if (!classData) {
            throw new NotFoundError('Class not found');
        }

        const members = await this.membershipRepo.getClassMembers(classId);

        const supervisors = members
            .filter(m => m.role === 'supervisor')
            .map(m => ({
                user_id: m.user_id,
                name: (m.User as any)?.name ?? 'Unknown',
                email: (m.User as any)?.email ?? 'Unknown',
            }));

        const students = members
            .filter(m => m.role === 'student')
            .map(m => ({
                user_id: m.user_id,
                name: (m.User as any)?.name ?? 'Unknown',
                email: (m.User as any)?.email ?? 'Unknown',
            }));

        return {
            class_id: classId,
            name: classData.name,
            supervisors,
            students,
        };
    }

    async addSelfToClass(userId: string, classId: ClassId, role: string) {
        return await this.membershipRepo.addMember(userId, classId, role);
    }

    async addUserByEmail(requesterId: string, classId: ClassId, email: string, role: string) {
        const isSupervisor = await this.membershipRepo.isSupervisor(requesterId, classId);
        if (!isSupervisor) {
            throw new ForbiddenError('Access denied: Only class supervisors can add users');
        }

        const targetUser = await this.userRepo.findByEmail(email);
        if (!targetUser) {
            throw new NotFoundError('No registered user found with that email');
        }

        if (role === 'supervisor') {
            if (!targetUser.date_of_birth || calculateAge(new Date(targetUser.date_of_birth)) < 18) {
                throw new ForbiddenError('User must be 18 or older to be added as a supervisor');
            }
        }

        await this.membershipRepo.addMember(targetUser.user_id, classId, role);

        return {
            message: `${role === 'supervisor' ? 'Supervisor' : 'Student'} successfully added`,
        };
    }

    async removeUser(requesterId: string, targetUserId: string, classId: ClassId, role: string) {
        if (role === 'supervisor') {
            if (requesterId !== targetUserId) {
                throw new ForbiddenError('Access denied: Only a supervisor can remove themselves from a class');
            }

            const supervisorCount = await this.membershipRepo.getSupervisorCount(classId);
            if (supervisorCount <= 1) {
                throw new ForbiddenError('Cannot leave class: A class must have at least one supervisor');
            }
        } else {
            const isSupervisor = await this.membershipRepo.isSupervisor(requesterId, classId);
            if (!isSupervisor) {
                throw new ForbiddenError('Access denied: Only supervisors can remove students');
            }
        }

        await this.membershipRepo.removeMember(targetUserId, classId, role);

        return {
            message: `${role === 'supervisor' ? 'Supervisor' : 'Student'} successfully removed`,
        };
    }

    async deleteClass(userId: string, classId: ClassId) {
        const isSupervisor = await this.membershipRepo.isSupervisor(userId, classId);
        if (!isSupervisor) {
            throw new ForbiddenError('Access denied: Only supervisors can delete a class');
        }

        try {
            const conversations = await this.conversationRepo.findByClass(classId);
            const convIds = conversations?.map(c => c.conversation_id) || [];

            if (convIds.length > 0) {
                await this.messageRepo.deleteByConversationIds(convIds);
                await this.conversationRepo.deleteByIds(convIds);
            }

            await this.membershipRepo.removeAllByClass(classId);
            await this.classRepo.deleteById(classId);

            return { message: 'Class successfully deleted' };
        } catch (err) {
            console.error('Failed to delete class:', err);
            throw new AppError('Failed to delete class and associated data', 500);
        }
    }

    async renameClass(userId: string, classId: ClassId, newName: string) {
        const isSupervisor = await this.membershipRepo.isSupervisor(userId, classId);
        if (!isSupervisor) {
            throw new ForbiddenError('Access denied: Only supervisors can access this resource');
        }

        await this.classRepo.rename(classId, newName);

        return { message: 'Class successfully renamed' };
    }
}

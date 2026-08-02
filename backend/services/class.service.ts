/**
 * Class Service — business logic for classes, membership, and roster management.
 *
 * This is the biggest service because most of the app's rules revolve around classes:
 * - Only supervisors can add/remove users, rename, or delete classes
 * - Supervisors must be 18+
 * - A class must always have at least one supervisor
 * - Deleting a class cascades to messages → conversations → memberships → class
 *
 * The Service doesn't know about HTTP. It receives plain data from the Controller
 * and calls Repository methods to read/write the database.
 *
 * Note: classId uses string | number because Supabase can use either UUIDs or
 * integers for primary keys. We pass the value as-is and let Supabase handle coercion.
 */
import { ClassRepository } from '../repositories/class.repository';
import { MembershipRepository } from '../repositories/membership.repository';
import { UserRepository } from '../repositories/user.repository';
import { ConversationRepository } from '../repositories/conversation.repository';
import { MessageRepository } from '../repositories/message.repository';
import { ForbiddenError, NotFoundError, AppError } from '../errors/AppError';
import { calculateAge } from '../utils/age';

/** Shorthand type for class IDs — can be a number or a UUID string */
type ClassId = string | number;

export class ClassService {
    constructor(
        private classRepo: ClassRepository,
        private membershipRepo: MembershipRepository,
        private userRepo: UserRepository,
        private conversationRepo: ConversationRepository,
        private messageRepo: MessageRepository,
    ) {}

    /** Create a new class. */
    async createClass(name: string) {
        return await this.classRepo.create(name);
    }

    /**
     * Get all classes the user belongs to, with supervisor names.
     * Returns an array like: [{ class_id, role, name, supervisor }]
     */
    async getUserClasses(userId: string) {
        const memberships = await this.membershipRepo.getUserMemberships(userId);

        if (memberships.length === 0) {
            return [];
        }

        // Get supervisor names for each class
        const classIds = memberships.map(m => m.class_id);
        const supervisors = await this.membershipRepo.getSupervisorsForClasses(classIds);

        // Build a map: classId → supervisor name
        const supervisorMap: Record<string, string> = {};
        for (const row of supervisors) {
            const supervisorName = (row.User as any)?.name ?? 'Unknown';
            supervisorMap[row.class_id] = supervisorName;
        }

        // Combine membership data with supervisor names
        return memberships.map(m => ({
            class_id: m.class_id,
            role: m.role,
            name: (m.Class as any)?.name ?? 'Unnamed Class',
            supervisor: supervisorMap[m.class_id] ?? 'Unknown',
        }));
    }

    /**
     * Get detailed info for a single class, including the full roster.
     * The user must be a member of the class.
     */
    async getClassDetail(userId: string, classId: ClassId) {
        // Check the user is a member
        const role = await this.membershipRepo.getMemberRole(userId, classId);
        if (!role) {
            throw new ForbiddenError('Access denied: You are not a member of this class');
        }

        // Get the class name
        const classData = await this.classRepo.findById(classId);
        if (!classData) {
            throw new NotFoundError('Class not found');
        }

        // Get all members with their user info
        const members = await this.membershipRepo.getClassMembers(classId);

        // Split members into supervisors and students
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

    /** Add the requesting user to a class with a given role. */
    async addSelfToClass(userId: string, classId: ClassId, role: string) {
        return await this.membershipRepo.addMember(userId, classId, role);
    }

    /**
     * Add a user to a class by email. Only supervisors can do this.
     * If adding as supervisor, the target user must be 18+.
     */
    async addUserByEmail(requesterId: string, classId: ClassId, email: string, role: string) {
        // Only supervisors can add other users
        const isSupervisor = await this.membershipRepo.isSupervisor(requesterId, classId);
        if (!isSupervisor) {
            throw new ForbiddenError('Access denied: Only class supervisors can add users');
        }

        // Find the target user by email
        const targetUser = await this.userRepo.findByEmail(email);
        if (!targetUser) {
            throw new NotFoundError('No registered user found with that email');
        }

        // If adding as supervisor, enforce age >= 18
        if (role === 'supervisor') {
            if (!targetUser.date_of_birth || calculateAge(new Date(targetUser.date_of_birth)) < 18) {
                throw new ForbiddenError('User must be 18 or older to be added as a supervisor');
            }
        }

        // Add the user to the class
        await this.membershipRepo.addMember(targetUser.user_id, classId, role);

        return {
            message: `${role === 'supervisor' ? 'Supervisor' : 'Student'} successfully added`,
        };
    }

    /**
     * Remove a user from a class.
     * - Removing a student: requires the requester to be a supervisor.
     * - Removing a supervisor: only that supervisor can remove themselves,
     *   and the class must have at least one other supervisor.
     */
    async removeUser(requesterId: string, targetUserId: string, classId: ClassId, role: string) {
        if (role === 'supervisor') {
            // Supervisors can only remove themselves
            if (requesterId !== targetUserId) {
                throw new ForbiddenError('Access denied: Only a supervisor can remove themselves from a class');
            }

            // Can't remove the last supervisor
            const supervisorCount = await this.membershipRepo.getSupervisorCount(classId);
            if (supervisorCount <= 1) {
                throw new ForbiddenError('Cannot leave class: A class must have at least one supervisor');
            }
        } else {
            // Only supervisors can remove students
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

    /**
     * Delete a class and ALL associated data.
     * Deletion order matters because of foreign key constraints:
     * 1. Messages (references Conversations)
     * 2. Conversations (references Classes)
     * 3. UserClass memberships (references Classes)
     * 4. The Class itself
     */
    async deleteClass(userId: string, classId: ClassId) {
        // Only supervisors can delete
        const isSupervisor = await this.membershipRepo.isSupervisor(userId, classId);
        if (!isSupervisor) {
            throw new ForbiddenError('Access denied: Only supervisors can delete a class');
        }

        try {
            // Step 1: Find all conversations in this class
            const conversations = await this.conversationRepo.findByClass(classId);
            const convIds = conversations?.map(c => c.conversation_id) || [];

            if (convIds.length > 0) {
                // Step 2: Delete all messages in those conversations
                await this.messageRepo.deleteByConversationIds(convIds);

                // Step 3: Delete the conversations themselves
                await this.conversationRepo.deleteByIds(convIds);
            }

            // Step 4: Delete all class memberships
            await this.membershipRepo.removeAllByClass(classId);

            // Step 5: Delete the class itself
            await this.classRepo.deleteById(classId);

            return { message: 'Class successfully deleted' };
        } catch (err) {
            console.error('Failed to delete class:', err);
            throw new AppError('Failed to delete class and associated data', 500);
        }
    }

    /** Rename a class. Only supervisors can do this. */
    async renameClass(userId: string, classId: ClassId, newName: string) {
        const isSupervisor = await this.membershipRepo.isSupervisor(userId, classId);
        if (!isSupervisor) {
            throw new ForbiddenError('Access denied: Only supervisors can access this resource');
        }

        await this.classRepo.rename(classId, newName);

        return { message: 'Class successfully renamed' };
    }
}

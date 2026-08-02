/**
 * Membership Repository — data access for the "UserClass" join table.
 *
 * This is the busiest repository because most of the app revolves around
 * "who is in which class and with what role."
 *
 * Key methods:
 * - isSupervisor() — the most frequently used check in the entire app
 * - addMember() / removeMember() — manage class membership
 * - getUserMemberships() — "what classes am I in?"
 * - getClassMembers() — "who is in this class?"
 *
 * Note: classId uses string | number because Supabase can use either UUIDs
 * or integers for primary keys. We pass the value as-is and let Supabase coerce.
 */
import { SupabaseClient } from '@supabase/supabase-js';
import { AppError } from '../errors/AppError';

/** Shorthand type for class IDs */
type ClassId = string | number;

export class MembershipRepository {
    constructor(private supabase: SupabaseClient) {}

    /**
     * Check if a user is a supervisor in a specific class.
     * This replaces the repeated supervisor-check pattern that appeared 5+ times
     * in the old routes/classes.ts.
     */
    async isSupervisor(userId: string, classId: ClassId): Promise<boolean> {
        const { data, error } = await this.supabase
            .from('UserClass')
            .select('role')
            .eq('user_id', userId)
            .eq('class_id', classId)
            .eq('role', 'supervisor')
            .maybeSingle();

        if (error) {
            throw new AppError('Failed to check supervisor status', 500);
        }

        return data !== null;
    }

    /** Check if a user is a member of a class (any role). Returns their role or null. */
    async getMemberRole(userId: string, classId: ClassId): Promise<string | null> {
        const { data, error } = await this.supabase
            .from('UserClass')
            .select('role')
            .eq('user_id', userId)
            .eq('class_id', classId)
            .maybeSingle();

        if (error) {
            console.error(error);
            throw new AppError('Failed to verify class membership', 500);
        }

        return data?.role ?? null;
    }

    /**
     * Get all classes a user belongs to, including the class name via join.
     * Used by GET /classes/get-classes.
     */
    async getUserMemberships(userId: string) {
        const { data, error } = await this.supabase
            .from('UserClass')
            .select('class_id, role, Class(name)')
            .eq('user_id', userId);

        if (error) {
            console.error(error);
            throw new AppError('Failed to fetch classes', 500);
        }

        return data;
    }

    /**
     * Get the supervisor names for a set of class IDs.
     * Used to display "Taught by Prof. Smith" on the class list.
     */
    async getSupervisorsForClasses(classIds: ClassId[]) {
        const { data, error } = await this.supabase
            .from('UserClass')
            .select('class_id, User(name)')
            .in('class_id', classIds)
            .eq('role', 'supervisor');

        if (error) {
            console.error(error);
            throw new AppError('Failed to fetch supervisor info', 500);
        }

        return data;
    }

    /**
     * Get all members of a class with their user details.
     * Used by GET /classes/get-class/:id to build the roster.
     */
    async getClassMembers(classId: ClassId) {
        const { data, error } = await this.supabase
            .from('UserClass')
            .select('role, user_id, User(name, email)')
            .eq('class_id', classId);

        if (error) {
            console.error(error);
            throw new AppError('Failed to fetch class members', 500);
        }

        return data;
    }

    /** Add a user to a class. Uses upsert with ignoreDuplicates so re-joining is a no-op. */
    async addMember(userId: string, classId: ClassId, role: string) {
        const { data, error } = await this.supabase
            .from('UserClass')
            .upsert(
                { user_id: userId, class_id: classId, role },
                { onConflict: 'user_id,class_id', ignoreDuplicates: true }
            )
            .select();

        if (error) {
            console.error(error);
            throw new AppError('Failed to add user to class', 500);
        }

        return data;
    }

    /** Remove a user from a class by user ID, class ID, and role. */
    async removeMember(userId: string, classId: ClassId, role: string) {
        const { error } = await this.supabase
            .from('UserClass')
            .delete()
            .eq('user_id', userId)
            .eq('class_id', classId)
            .eq('role', role);

        if (error) {
            console.error(error);
            throw new AppError(`Failed to remove ${role}`, 500);
        }
    }

    /** Count how many supervisors a class has. Used to prevent removing the last one. */
    async getSupervisorCount(classId: ClassId): Promise<number> {
        const { data, error } = await this.supabase
            .from('UserClass')
            .select('user_id')
            .eq('class_id', classId)
            .eq('role', 'supervisor');

        if (error) {
            throw new AppError('Failed to check class supervisors', 500);
        }

        return data.length;
    }

    /** Remove all memberships for a class. Used during class deletion. */
    async removeAllByClass(classId: ClassId) {
        const { error } = await this.supabase
            .from('UserClass')
            .delete()
            .eq('class_id', classId);

        if (error) {
            throw error;
        }
    }
}

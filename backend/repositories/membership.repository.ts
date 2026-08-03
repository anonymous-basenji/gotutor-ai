import { SupabaseClient } from '@supabase/supabase-js';
import { AppError } from '../errors/AppError';

export class MembershipRepository {
    constructor(private supabase: SupabaseClient) {}

    async isSupervisor(userId: string, classId: string): Promise<boolean> {
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

    async getMemberRole(userId: string, classId: string): Promise<string | null> {
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

    async getSupervisorsForClasses(classIds: string[]) {
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

    async getClassMembers(classId: string) {
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

    async addMember(userId: string, classId: string, role: string) {
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

    async removeMember(userId: string, classId: string, role: string) {
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

    async getSupervisorCount(classId: string): Promise<number> {
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

    async removeAllByClass(classId: string) {
        const { error } = await this.supabase
            .from('UserClass')
            .delete()
            .eq('class_id', classId);

        if (error) {
            throw error;
        }
    }
}

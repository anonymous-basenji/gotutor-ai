import { SupabaseClient } from '@supabase/supabase-js';
import { AppError, ConflictError } from '../errors/AppError';

export class UserRepository {
    constructor(private supabase: SupabaseClient) {}

    async upsert(userId: string, email: string, name: string, dateOfBirth: string) {
        const { data, error } = await this.supabase
            .from('User')
            .upsert(
                { user_id: userId, email, name, date_of_birth: dateOfBirth },
                { onConflict: 'user_id', ignoreDuplicates: true }
            )
            .select();

        if (error) {
            if (error.code === '23505') {
                console.error('Duplicate email conflict:', error.details);
                throw new ConflictError('An account with this email already exists');
            }
            console.error('Upsert error:', error);
            throw new AppError('Failed to create user', 500);
        }

        return data;
    }

    async findByEmail(email: string) {
        const { data, error } = await this.supabase
            .from('User')
            .select('user_id, date_of_birth')
            .eq('email', email)
            .maybeSingle();

        if (error) {
            throw new AppError('Failed to find user', 500);
        }

        return data;
    }

    async findById(userId: string) {
        const { data, error } = await this.supabase
            .from('User')
            .select('name, date_of_birth, email')
            .eq('user_id', userId)
            .maybeSingle();

        if (error) {
            throw new AppError('Failed to find user', 500);
        }

        return data;
    }

    async deleteById(userId: string) {
        const { error } = await this.supabase
            .from('User')
            .delete()
            .eq('user_id', userId);

        if (error) {
            throw new AppError('Failed to delete user', 500);
        }
    }

    async updateName(userId: string, name: string) {
        const { data, error } = await this.supabase
            .from('User')
            .update({ name })
            .eq('user_id', userId)
            .select();

        if (error) {
            throw new AppError('Failed to update user name', 500);
        }

        return data;
    }
}

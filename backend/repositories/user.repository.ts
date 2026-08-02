/**
 * User Repository — data access for the "User" table.
 *
 * This is the ONLY place in the entire app that runs queries against
 * the User table. The Service layer calls these methods instead of
 * touching Supabase directly.
 *
 * Every method either returns data or throws an AppError.
 */
import { SupabaseClient } from '@supabase/supabase-js';
import { AppError, ConflictError } from '../errors/AppError';

export class UserRepository {
    constructor(private supabase: SupabaseClient) {}

    /**
     * Create or update a user profile.
     * Uses upsert with ignoreDuplicates so re-syncing is a no-op.
     * Throws ConflictError (409) if the email is already taken by another account.
     */
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

    /** Find a user by their email address. Returns null if not found. */
    async findByEmail(email: string) {
        const { data, error } = await this.supabase
            .from('User')
            .select('user_id, date_of_birth')
            .eq('email', email)
            .maybeSingle();

        if (error) {
            throw new AppError('Failed to find user', 500);
        }

        return data; // null if not found
    }

    /** Find a user's profile by their ID. Returns null if not found. */
    async findById(userId: string) {
        const { data, error } = await this.supabase
            .from('User')
            .select('name, date_of_birth, email')
            .eq('user_id', userId)
            .maybeSingle();

        if (error) {
            throw new AppError('Failed to find user', 500);
        }

        return data; // null if not found
    }

    /** Delete a user from the User table (does NOT delete from Supabase Auth). */
    async deleteById(userId: string) {
        const { error } = await this.supabase
            .from('User')
            .delete()
            .eq('user_id', userId);

        if (error) {
            throw new AppError('Failed to delete user', 500);
        }
    }
}

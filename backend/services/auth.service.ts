/**
 * Auth Service — business logic for authentication and user profiles.
 *
 * This is where the "rules" live:
 * - Users must be 13 or older (underage accounts get deleted)
 * - Profiles include a computed isAdult field
 *
 * The Service doesn't know about HTTP (no req/res).
 * It only knows about business rules and repositories.
 */
import { SupabaseClient } from '@supabase/supabase-js';
import { UserRepository } from '../repositories/user.repository';
import { BadRequestError, ForbiddenError, NotFoundError } from '../errors/AppError';
import { calculateAge } from '../utils/age';

export class AuthService {
    constructor(
        private userRepo: UserRepository,
        private supabase: SupabaseClient, // needed for supabase.auth.admin.deleteUser()
    ) {}

    /**
     * Create or link a user profile after signup.
     * Enforces minimum age of 13 — underage accounts are deleted immediately.
     */
    async syncUser(userId: string, email: string, name: string, dateOfBirth: string) {
        // Validate the date
        const dob = new Date(dateOfBirth);
        if (isNaN(dob.getTime()) || dob > new Date()) {
            throw new BadRequestError('Invalid date of birth');
        }

        // Check age — must be 13 or older
        const age = calculateAge(dob);
        if (age < 13) {
            // Delete the user completely (both from our DB and from Supabase Auth)
            await this.userRepo.deleteById(userId);
            await this.supabase.auth.admin.deleteUser(userId);
            throw new ForbiddenError('User must be 13 or older');
        }

        // Create/update the user profile
        // The repository handles the 23505 (duplicate email) case internally
        const data = await this.userRepo.upsert(userId, email, name, dateOfBirth);
        return data;
    }

    /**
     * Get the authenticated user's profile.
     * Adds a computed isAdult boolean (age >= 18).
     */
    async getProfile(userId: string) {
        const user = await this.userRepo.findById(userId);

        if (!user) {
            throw new NotFoundError('Profile not found');
        }

        return {
            ...user,
            isAdult: calculateAge(new Date(user.date_of_birth)) >= 18,
        };
    }
}

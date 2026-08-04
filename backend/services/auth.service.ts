import { SupabaseClient } from '@supabase/supabase-js';
import { UserRepository } from '../repositories/user.repository';
import { BadRequestError, ForbiddenError, NotFoundError } from '../errors/AppError';
import { calculateAge } from '../utils/age';

export class AuthService {
    constructor(
        private userRepo: UserRepository,
        private supabase: SupabaseClient,
    ) {}

    async syncUser(userId: string, email: string, name: string, dateOfBirth: string) {
        const dob = new Date(dateOfBirth);
        if (isNaN(dob.getTime()) || dob > new Date()) {
            throw new BadRequestError('Invalid date of birth');
        }

        const age = calculateAge(dob);
        if (age < 13) {
            await this.userRepo.deleteById(userId);
            await this.supabase.auth.admin.deleteUser(userId);
            throw new ForbiddenError('User must be 13 or older');
        }

        return await this.userRepo.upsert(userId, email, name, dateOfBirth);
    }

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

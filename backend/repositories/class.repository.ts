/**
 * Class Repository — data access for the "Class" table.
 *
 * Handles CRUD operations on classes themselves (not membership — that's
 * in MembershipRepository).
 */
import { SupabaseClient } from '@supabase/supabase-js';
import { AppError } from '../errors/AppError';

/** Shorthand type for class IDs */
type ClassId = string | number;

export class ClassRepository {
    constructor(private supabase: SupabaseClient) {}

    /** Create a new class. Returns the created row. */
    async create(name: string) {
        const { data, error } = await this.supabase
            .from('Class')
            .insert([{ name }])
            .select();

        if (error) {
            console.error(error);
            throw new AppError(`Failed to create class: ${error}`, 500);
        }

        return data;
    }

    /** Find a class by its ID. Returns null if not found. */
    async findById(classId: ClassId) {
        const { data, error } = await this.supabase
            .from('Class')
            .select('name')
            .eq('class_id', classId)
            .maybeSingle();

        if (error) {
            throw new AppError('Failed to find class', 500);
        }

        return data; // null if not found
    }

    /** Rename a class. */
    async rename(classId: ClassId, newName: string) {
        const { error } = await this.supabase
            .from('Class')
            .update({ name: newName })
            .eq('class_id', classId)
            .select();

        if (error) {
            console.error(error);
            throw new AppError(`Failed to rename class ${classId}`, 500);
        }
    }

    /** Delete a class by its ID. */
    async deleteById(classId: ClassId) {
        const { error } = await this.supabase
            .from('Class')
            .delete()
            .eq('class_id', classId);

        if (error) {
            throw new AppError('Failed to delete class', 500);
        }
    }
}

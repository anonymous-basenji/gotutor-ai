import { SupabaseClient } from '@supabase/supabase-js';
import { AppError } from '../errors/AppError';

export class ClassRepository {
    constructor(private supabase: SupabaseClient) {}

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

    async findById(classId: string) {
        const { data, error } = await this.supabase
            .from('Class')
            .select('name')
            .eq('class_id', classId)
            .maybeSingle();

        if (error) {
            throw new AppError('Failed to find class', 500);
        }

        return data;
    }

    async rename(classId: string, newName: string) {
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

    async deleteById(classId: string) {
        const { error } = await this.supabase
            .from('Class')
            .delete()
            .eq('class_id', classId);

        if (error) {
            throw new AppError('Failed to delete class', 500);
        }
    }
}

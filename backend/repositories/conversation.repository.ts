/**
 * Conversation Repository — data access for the "Conversation" table.
 */
import { SupabaseClient } from '@supabase/supabase-js';
import { AppError } from '../errors/AppError';

/** Shorthand type for class IDs */
type ClassId = string | number;

export class ConversationRepository {
    constructor(private supabase: SupabaseClient) {}

    /** Find all conversations for a student in a specific class. */
    async findByStudentAndClass(studentId: string, classId: ClassId) {
        const { data, error } = await this.supabase
            .from('Conversation')
            .select('*')
            .eq('student_id', studentId)
            .eq('class_id', classId);

        if (error) {
            console.error(error);
            throw new AppError('Failed to fetch conversations', 500);
        }

        return data;
    }

    /** Find all conversations in a class. Used during class deletion. */
    async findByClass(classId: ClassId) {
        const { data, error } = await this.supabase
            .from('Conversation')
            .select('conversation_id')
            .eq('class_id', classId);

        if (error) {
            throw error;
        }

        return data;
    }

    /** Delete conversations by their IDs. Used during class deletion. */
    async deleteByIds(conversationIds: number[]) {
        const { error } = await this.supabase
            .from('Conversation')
            .delete()
            .in('conversation_id', conversationIds);

        if (error) {
            throw error;
        }
    }
}

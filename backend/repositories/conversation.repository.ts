import { SupabaseClient } from '@supabase/supabase-js';
import { AppError } from '../errors/AppError';

export class ConversationRepository {
    constructor(private supabase: SupabaseClient) {}

    async findByStudentAndClass(studentId: string, classId: string) {
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

    async findByClass(classId: string) {
        const { data, error } = await this.supabase
            .from('Conversation')
            .select('conversation_id')
            .eq('class_id', classId);

        if (error) {
            throw error;
        }

        return data;
    }

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

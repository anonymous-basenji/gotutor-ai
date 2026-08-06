import { SupabaseClient } from '@supabase/supabase-js';
import { AppError } from '../errors/AppError';

export class ConversationRepository {
    constructor(private supabase: SupabaseClient) {}

    async create(title: string, studentId: string, classId: string, startedAt: string) {
        const { data, error } = await this.supabase
            .from('Conversation')
            .insert([{title, student_id: studentId, class_id: classId, started_at: startedAt}])
            .select();

        if(error || !data || data.length === 0) {
            console.error(error);
            throw new AppError('Failed to create conversation', 500);
        }

        return data[0];
    }

    async findById(conversationId: number) {
        const { data, error } = await this.supabase
            .from('Conversation')
            .select('*')
            .eq('conversation_id', conversationId)
            .single();

        if (error) {
            return null;
        }

        return data;
    }

    async updateTitle(conversationId: number, title: string) {
        const { data, error } = await this.supabase
            .from('Conversation')
            .update({ title })
            .eq('conversation_id', conversationId)
            .select()
            .single();

        if (error || !data) {
            console.error(error);
            throw new AppError('Failed to update conversation', 500);
        }

        return data;
    }

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

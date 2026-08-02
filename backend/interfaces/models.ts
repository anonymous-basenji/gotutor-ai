/**
 * TypeScript interfaces for every table in the Supabase database.
 * These are the "shapes" of the data — used across all layers
 * so everyone agrees on what a User, Class, etc. looks like.
 */

export interface User {
    user_id: string;
    email: string;
    name: string;
    date_of_birth: string;
}

export interface Class {
    class_id: number;
    name: string;
}

export interface UserClass {
    user_id: string;
    class_id: number;
    role: 'supervisor' | 'student';
}

export interface Conversation {
    conversation_id: number;
    student_id: string;
    class_id: number;
    started_at: string;
}

export interface Message {
    id: number;
    conversation_id: number;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
}

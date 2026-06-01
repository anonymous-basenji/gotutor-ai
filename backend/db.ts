import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if(!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

export interface User {
    user_id: number,
    firebase_uid: string,
    email: string,
    name: string,
    age: number,
}

export interface UserClass {
    user_id: number,
    class_id: number,
    role: string
}

export interface Class {
    class_id: number,
    name: string
}

export interface Conversation {
    conversation_id: number,
    student_id: number,
    class_id: number,
    started_at: string
}

export interface Message {
    id: number,
    conversation_id: number,
    role: string, // "user" or "assistant"
    content: string,
    timestamp: string
}
export interface User {
    user_id: string;
    email: string;
    name: string;
    date_of_birth: string;
}

export interface Class {
    class_id: string;
    name: string;
}

export interface UserClass {
    user_id: string;
    class_id: string;
    role: 'supervisor' | 'student';
}

export interface Conversation {
    conversation_id: number;
    student_id: string;
    class_id: string;
    started_at: string;
}

export interface Message {
    id: number;
    conversation_id: number;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
}

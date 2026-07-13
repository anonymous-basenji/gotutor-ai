import { useState, useEffect, createContext } from 'react';
import { supabase } from './SupabaseClient';
import { type User } from '@supabase/supabase-js';

interface UserContextType {
    user: User | null;
    loading: boolean;
    authEvent: string;
    isAdult: boolean | null;
}

export const UserContext = createContext<UserContextType | null>(null);

function UserProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [authEvent, setAuthEvent] = useState<string>("");
    const [isAdult, setIsAdult] = useState<boolean | null>(null);

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            setUser(session?.user ?? null);
            setLoading(false);
            setAuthEvent(event);
        });

        return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
        if(!user) {
            setIsAdult(null);
            return;
        }

        const fetchMe = async() => {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            if(!token) return;

            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/auth/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                console.error(`HTTP error at /auth/me: ${response.status}`);
                return;
            }

            const data = await response.json();
            setIsAdult(data.isAdult);
        }
        
        fetchMe();
    }, [user]);

    return(
        <UserContext.Provider value={{user, loading, authEvent, isAdult}}>
            {children}
        </UserContext.Provider>
    );
}

export default UserProvider;

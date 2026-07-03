import { useState, useEffect, createContext } from 'react';
import { supabase } from './SupabaseClient';
import { type User } from '@supabase/supabase-js';

interface UserContextType {
    user: User | null;
    loading: boolean;
    authEvent: string;
}

export const UserContext = createContext<UserContextType | null>(null);

function UserProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [authEvent, setAuthEvent] = useState<string>("");

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            setUser(session?.user ?? null);
            setLoading(false);
            setAuthEvent(event);
        });

        return () => subscription.unsubscribe();
    }, []);

    return(
        <UserContext.Provider value={{user, loading, authEvent}}>
            {children}
        </UserContext.Provider>
    );
};

export default UserProvider;
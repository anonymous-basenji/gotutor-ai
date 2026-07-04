import { useState, useEffect, createContext } from 'react';
import { supabase } from './SupabaseClient';
import { type User } from '@supabase/supabase-js';

interface UserContextType {
    user: User | null;
    loading: boolean;
    authEvent: string;
    isAdult: boolean | null;
}

const calculateAge = (birthDate: Date) => {
    const currentDate: Date = new Date();

    // 1. Calculate the raw difference in years
    let age = currentDate.getFullYear() - birthDate.getFullYear();

    // 2. Calculate the difference in months
    const monthDiff = currentDate.getMonth() - birthDate.getMonth();

    // 3. Adjust if the birthday hasn't happened yet this year
    // Condition: Current month is before birth month OR
    // (It is the birth month, but the current day is before the birth day)
    if (monthDiff < 0 || (monthDiff === 0 && currentDate.getDate() < birthDate.getDate())) {
        age--;
    }

    return age;
};

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
        if (!user) return;
        supabase
            .from('User')
            .select('date_of_birth')
            .eq('user_id', user.id)
            .maybeSingle()
            .then(({ data }) => {
                if (!data?.date_of_birth) {
                    setIsAdult(null);
                    return;
                }
                const dob = new Date(data.date_of_birth);
                const age = calculateAge(dob);
                setIsAdult(age >= 18);
            });
    }, [user]);

    return(
        <UserContext.Provider value={{user, loading, authEvent, isAdult}}>
            {children}
        </UserContext.Provider>
    );
};

export default UserProvider;
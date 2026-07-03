import { useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../SupabaseClient';
import './AgeForm.css';


function AgeForm({ user, onComplete }: { user: User | null | undefined, onComplete: Function }) {
    const [dob, setDob] = useState('');    

    const createUser = async(dob: string) => {
        if(!user) {
            return;
        }

        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        if(!token) {
            console.error("No access token found");
            return;
        }

        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/auth/sync-user`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    "name": user.user_metadata?.full_name || user.email,
                    "date_of_birth": dob
                })
            });

            if(response.ok) {
                onComplete();
            } else {
                console.error("Failed to sync user to database");
            };

        } catch(e) {
            console.error("Network error syncing user: ", e);
        }
    };

    return(
        <div className="age-form">
            <h4>Enter your birth date to proceed: </h4>
            <input className="date-input" type="date" onChange={(e) => setDob(e.target.value)}></input>
            <button className="submit-btn" onClick={() => createUser(dob)}>Submit</button>
        </div>
    )
};

export default AgeForm;
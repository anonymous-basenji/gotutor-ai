import { useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../../lib/SupabaseClient';
import './AgeForm.css';


function AgeForm({ user, onComplete }: { user: User | null | undefined, onComplete: Function }) {
    const [dob, setDob] = useState('');    
    const [acceptedTerms, setAcceptedTerms] = useState(false);

    const createUser = async(dob: string) => {
        if(!user) {
            return;
        }

        if(!acceptedTerms) {
            alert("You must agree to the Terms of Service to proceed.");
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
                    "date_of_birth": dob,
                    "accepted_terms": acceptedTerms
                })
            });

            if(response.ok) {
                onComplete();
            } else {
                if(response.status === 403) {
                    alert("Error: Users under the age of 13 cannot create an account at this time.");
                    await supabase.auth.signOut();
                    window.location.reload();
                } else if(response.status === 401) {
                    await supabase.auth.signOut();
                    window.location.reload();
                }
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
            <div style={{ marginTop: '15px' }}>
                <label>
                    <input
                        type="checkbox"
                        checked={acceptedTerms}
                        onChange={(e) => setAcceptedTerms(e.target.checked)}
                    />
                    {' '}I agree to the <a href="/terms-of-service" target="_blank" rel="noopener noreferrer">Terms of Service</a>
                </label>
            </div>
            <button className="submit-btn" disabled={!acceptedTerms || !dob} onClick={() => createUser(dob)}>Submit</button>
        </div>
    )
}

export default AgeForm;

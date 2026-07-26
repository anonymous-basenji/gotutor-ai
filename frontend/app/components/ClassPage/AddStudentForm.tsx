import { useState } from 'react';
import { supabase } from '../../lib/SupabaseClient';

function AddStudentForm({ classId, role = 'student', onSuccess }: { classId: string; role?: 'student' | 'supervisor'; onSuccess?: () => void }) {
    const [isEditing, setIsEditing] = useState(false);
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async(e: React.FormEvent) => {
        e.preventDefault();
        if(!email.trim()) return;

        setLoading(true);

        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/classes/add-user-by-email`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ class_id: classId, email: email.trim(), role })
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => null);
                if (response.status === 404) {
                    alert("No registered user found with that email.");
                } else if (response.status === 403) {
                    alert(errData?.error || "Access denied: User cannot be added with this role.");
                } else {
                    alert(errData?.error || `Failed to add ${role}`);
                }
                setEmail('');
                setIsEditing(false);
                throw new Error(errData?.error || `Failed to add ${role}`);
            }
            setEmail('');
            setIsEditing(false);

            if (onSuccess) onSuccess();
        } catch(err) {
            console.error(`Failed to add ${role}:`, err);
        } finally {
            setLoading(false);
        }
    }

    if(!isEditing) {
        return(
            <div className="add-student-form clickable" onClick={() => setIsEditing(true)}>
                <h1>+</h1>
                <h2>Add {role}</h2>
            </div>
        );
    }

    return(
        <div className="add-student-form">
            <form onSubmit={handleSubmit}>
                <input
                    type='email'
                    className='student-email-input'
                    placeholder={`Enter ${role} email...`}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    autoFocus
                    required
                />
                <div className='card-actions'>
                    <button className="cancel-btn" type="button" onClick={() => setIsEditing(false)}>Cancel</button>
                    <button className='submit-btn' type='submit' disabled={loading || !email.trim()}>Submit</button>
                </div>
            </form>
        </div>
    );
};

export default AddStudentForm;

import { useState, useContext, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import type { MetaFunction } from 'react-router';
import { UserContext } from '../lib/UserProvider';
import { supabase } from '../lib/SupabaseClient';
import SignedOut from '../components/SignedOut';
import ClassPageSignedIn from '../components/ClassPage/ClassPageSignedIn';

export interface ClassMember {
    user_id: string;
    name: string;
    email: string;
}

export interface ClassData {
    class_id: string;
    name: string;
    supervisors: ClassMember[];
    students: ClassMember[];
}

export const meta: MetaFunction = () => [
  { title: "Class — GoTutor.ai" },
  { name: "description", content: "View your GoTutor.ai class details, members, and conversations." },
];

export default function ClassPage() {
    const [clsData, setClsData] = useState<ClassData | null>(null);
    const { classId } = useParams<{ classId: string }>();
    const userCtx = useContext(UserContext);
    const navigate = useNavigate();
    const user = userCtx?.user;

    useEffect(() => {
        const getClassData = async() => {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;
            try {
                const response = await fetch(
                    `${import.meta.env.VITE_BACKEND_URL}/classes/get-class/${classId}`,
                    {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );

                if (response.ok) {
                    const data: ClassData = await response.json();
                    setClsData(data);
                }
            } catch (error) {
                console.error('Failed to fetch class data', error);
            }
        };

        getClassData();
    }, []);

    if(!user) {
        return null;
    }

    const name = user.user_metadata?.full_name || user.email || "User";

    return(
        <div>
            {userCtx?.user ? (
                <ClassPageSignedIn clsData={clsData} userName={name}/>
            ) : 
                <SignedOut nav={navigate}/>
            }
        </div>
    ); 
}

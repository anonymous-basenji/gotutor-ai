import { useState, useContext, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { UserContext } from '../UserProvider';
import { supabase } from '../SupabaseClient';
import SignedOut from '../SignedOut';
import ClassPageSignedIn from './ClassPageSignedIn';

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

function ClassPage() {
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
            {userCtx?.user /*true*/ ? (
                // Add your dashboard content here when user is authenticated
                <ClassPageSignedIn clsData={clsData} userName={name}/>
            ) : 
                <SignedOut nav={navigate}/>
            }
        </div>
    ); 
};

export default ClassPage;
import { useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { UserContext } from '../UserProvider';
import SignedOut from '../SignedOut';
import ClassPageSignedIn from './ClassPageSignedIn';

function ClassPage() {
    const { classId } = useParams<{ classId: string }>();
    const userCtx = useContext(UserContext);
    const navigate = useNavigate();
    const user = userCtx?.user;

    if(!user) {
        return null;
    }

    const name = user.user_metadata?.full_name || user.email || "User";

    // Update this to the actual class name retrieved from db
    const clsName = "Class " + classId; 

    return(
        <div>
            {userCtx?.user /*true*/ ? (
                // Add your dashboard content here when user is authenticated
                <ClassPageSignedIn cls={clsName} user={name} classId={classId ?? ''}/>
            ) : 
                <SignedOut nav={navigate}/>
            }
        </div>
    ); 
};

export default ClassPage;
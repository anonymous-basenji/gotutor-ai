import { useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { UserContext } from '../UserProvider';
import SignedOut from '../SignedOut';
import ClassPageSignedIn from './ClassPageSignedIn';

function ClassPage() {
    const { classId } = useParams<{ classId: string }>();
    const userCtx = useContext(UserContext);
    const navigate = useNavigate();

    // Update this to the actual class name retrieved from db
    const name = "Class " + classId; 

    return(
        <div>
            {userCtx?.user /*true*/ ? (
                // Add your dashboard content here when user is authenticated
                <ClassPageSignedIn cls={name} user={userCtx?.user.displayName} classId={classId ?? ''}/>
            ) : 
                <SignedOut nav={navigate}/>
            }
        </div>
    ); 
};

export default ClassPage;
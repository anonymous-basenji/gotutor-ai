import { useState, createContext } from 'react';
import { type User } from 'firebase/auth';

interface UserContextType {
    user: User | null;
    setUser: Function;
}

export const UserContext = createContext<UserContextType | null>(null);

function UserProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    return(
        <UserContext.Provider value={{user, setUser}}>
            {children}
        </UserContext.Provider>
    );
};

export default UserProvider;
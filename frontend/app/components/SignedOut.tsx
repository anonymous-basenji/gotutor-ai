import type { NavigateFunction } from "react-router";

function SignedOut({ nav }: { nav: NavigateFunction }) {
    return(
        <div>
            <p>Whoops! It appears that you are signed out. Please go back to the <a onClick={() => nav('/sign-in')}>sign-in page</a> and sign in with a valid account.</p>
        </div>
    )
}

export default SignedOut;

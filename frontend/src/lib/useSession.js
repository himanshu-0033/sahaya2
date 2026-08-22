import { useState } from 'react';
import { getSession } from './session.js';

// Reads the session once per mount and keeps that reference stable.
//
// This exists because of a specific, expensive bug. `getSession()` does a
// JSON.parse, so it returns a NEW object every time it is called. Pages were
// calling it directly in the component body and then listing the result in a
// useEffect dependency array:
//
//     const session = getSession();
//     useEffect(() => { fetchThings().then(setThings); }, [session]);
//
// Every render produced a session object with a new identity, so the effect
// re-ran, which set state, which re-rendered, which produced another new
// object. The result was an unbounded fetch loop — measured at over 400
// requests in four seconds on a single open tab, against a serverless backend
// that bills per invocation.
//
// useState with an initialiser function runs it once and returns the same
// reference for the life of the component, which is exactly the semantics the
// dependency arrays were assuming all along.
//
// Sign-in pages that need to CHANGE the session (Landing) keep their own
// useState pair instead — this hook is read-only on purpose.
export function useSession() {
  const [session] = useState(getSession);
  return session;
}

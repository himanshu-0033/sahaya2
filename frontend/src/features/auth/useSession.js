import { useEffect, useState } from 'react';
import { getSession, SIGNED_OUT_EVENT } from './session.js';

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
// A page that needs to CHANGE the session keeps its own useState pair
// instead — this hook is read-only on purpose. Landing used to be that
// exception, back when it rendered the sign-in screen itself; signing in
// is its own route now, so Landing only ever reads.
export function useSession() {
  const [session, setSession] = useState(getSession);

  // The one transition this hook allows: signed in to signed out, when the
  // server has told us the token is dead.
  //
  // It does not break the stable-identity rule the comment above is about.
  // That rule is about never handing back a NEW object for the SAME session
  // on every render, which is what drove the fetch loop. This fires once, and
  // what it sets is null, which has no identity to churn. Every page already
  // guards on a null session and sends people to the sign-in screen, so this
  // is the whole fix: no page needs to know about it.
  useEffect(() => {
    const onSignedOut = () => setSession(null);
    window.addEventListener(SIGNED_OUT_EVENT, onSignedOut);
    return () => window.removeEventListener(SIGNED_OUT_EVENT, onSignedOut);
  }, []);

  return session;
}

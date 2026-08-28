import { useCallback, useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AdminShell from './components/AdminShell.jsx';
import RouteChrome from './components/RouteChrome.jsx';
import SignIn from './pages/SignIn.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Residents from './pages/Residents.jsx';
import ResidentDetail from './pages/ResidentDetail.jsx';
import { clearSession, getSession } from './lib/session.js';
import { getAdmin, SIGNED_OUT_EVENT } from './lib/api.js';

export default function App() {
  const [session, setSession] = useState(() => getSession());
  const [admin, setAdmin] = useState(null);
  const [checking, setChecking] = useState(Boolean(getSession()));
  const [notice, setNotice] = useState(null);

  // A valid sign-in isn't enough — the account also has to be on the
  // counsellor allowlist, so confirm that before rendering any resident data.
  useEffect(() => {
    if (!session) {
      setAdmin(null);
      return;
    }
    let cancelled = false;
    setChecking(true);
    getAdmin()
      .then((res) => {
        if (cancelled) return;
        setAdmin(res.admin);
        setNotice(null);
      })
      .catch((err) => {
        if (cancelled) return;
        clearSession();
        setSession(null);
        setAdmin(null);
        setNotice(
          err.status === 403
            ? err.message
            : `Could not confirm counsellor access: ${err.message}`,
        );
      })
      .finally(() => !cancelled && setChecking(false));
    return () => {
      cancelled = true;
    };
  }, [session]);

  // Any request that comes back 401 (expired token) drops the session, so
  // fall back to the sign-in screen wherever in the console that happened.
  useEffect(() => {
    function onSignedOut() {
      setSession(null);
      setAdmin(null);
      setNotice('Your session expired — please sign in again.');
    }
    window.addEventListener(SIGNED_OUT_EVENT, onSignedOut);
    return () => window.removeEventListener(SIGNED_OUT_EVENT, onSignedOut);
  }, []);

  const handleSignedIn = useCallback((next) => {
    setNotice(null);
    setSession(next);
  }, []);

  function handleSignOut() {
    clearSession();
    setSession(null);
    setAdmin(null);
  }

  if (!session) {
    return <SignIn onSignedIn={handleSignedIn} notice={notice} />;
  }

  if (checking || !admin) {
    return (
      // role="status" so this is announced rather than sitting there silently.
      // It is the only thing on screen while the allowlist check is in flight,
      // and on a slow connection a screen reader otherwise reports an empty
      // page — indistinguishable from access having been refused.
      <div className="flex min-h-screen items-center justify-center" role="status">
        <p className="text-sm text-[var(--color-muted)]">Checking counsellor access…</p>
      </div>
    );
  }

  return (
    <AdminShell admin={admin} onSignOut={handleSignOut}>
      {/* Title, scroll and focus on navigation. Mounted in this branch only —
          the sign-in and access-check screens are not routed, and they keep
          the document title set in index.html. */}
      <RouteChrome />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/residents" element={<Residents />} />
        <Route path="/residents/:residentId" element={<ResidentDetail />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AdminShell>
  );
}

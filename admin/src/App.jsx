import { useCallback, useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AdminShell from './components/AdminShell.jsx';
import RouteChrome from './components/RouteChrome.jsx';
import SignIn from './pages/SignIn.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Residents from './pages/Residents.jsx';
import ResidentDetail from './pages/ResidentDetail.jsx';
import Enquiries from './pages/Enquiries.jsx';
import Team from './pages/Team.jsx';
import RolePicker from './pages/RolePicker.jsx';
import PendingApproval from './pages/PendingApproval.jsx';
import { clearSession, getSession } from './lib/session.js';
import { getAdmin, SIGNED_OUT_EVENT } from './lib/api.js';

export default function App() {
  const [session, setSession] = useState(() => getSession());
  const [admin, setAdmin] = useState(null);
  const [checking, setChecking] = useState(Boolean(getSession()));
  const [notice, setNotice] = useState(null);

  // A valid sign-in isn't enough: the account also has to be approved for the
  // admin panel, so find out where it stands before rendering anything else.
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
            : `Could not check your access: ${err.message}`,
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
      setNotice('Your session expired. Please sign in again.');
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
      // It is the only thing on screen while the access check is in flight,
      // and on a slow connection a screen reader otherwise reports an empty
      // page, indistinguishable from access having been refused.
      <div className="flex min-h-screen items-center justify-center" role="status">
        <p className="text-sm text-[var(--color-muted)]">Checking your access…</p>
      </div>
    );
  }

  // Everyone but the super admin says whether they are a counsellor or a
  // manager. For someone not yet approved, that is their request to join.
  if (!admin.superAdmin && (!admin.role || admin.changingRole)) {
    return (
      <RolePicker
        admin={admin}
        onChosen={(res) => setAdmin({ ...admin, role: res.role, status: res.status, changingRole: false })}
        onSignOut={handleSignOut}
      />
    );
  }

  // Asked, and waiting for the super admin.
  if (admin.status === 'pending') {
    return (
      <PendingApproval
        admin={admin}
        onRecheck={() =>
          getAdmin().then((res) => {
            setAdmin(res.admin);
            return res.admin.status;
          })
        }
        onChangeRole={() => setAdmin({ ...admin, changingRole: true })}
        onSignOut={handleSignOut}
      />
    );
  }

  return (
    <AdminShell admin={admin} onSignOut={handleSignOut}>
      {/* Title, scroll and focus on navigation. Mounted in this branch only:
          the sign-in and access-check screens are not routed, and they keep
          the document title set in index.html. */}
      <RouteChrome />
      {/* What each role can open. The server enforces the same split; this only
          keeps people from being sent to pages that would refuse them. */}
      <Routes>
        {admin.role === 'manager' ? (
          <>
            <Route path="/" element={<Team admin={admin} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        ) : (
          <>
            <Route path="/" element={<Dashboard admin={admin} />} />
            <Route path="/residents" element={<Residents />} />
            <Route path="/residents/:residentId" element={<ResidentDetail />} />
            {admin.superAdmin && <Route path="/enquiries" element={<Enquiries />} />}
            {admin.superAdmin && (
              <Route
                path="/team"
                element={
                  <Team
                    admin={admin}
                    onRequests={(n) => setAdmin((a) => (a.pendingRequests === n ? a : { ...a, pendingRequests: n }))}
                  />
                }
              />
            )}
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        )}
      </Routes>
    </AdminShell>
  );
}

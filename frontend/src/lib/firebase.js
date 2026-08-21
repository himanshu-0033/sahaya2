// Firebase is only ever needed by the phone sign-in flow, and the SDK is a
// large chunk, so it is imported on demand rather than at module load —
// same reasoning as the lazy three.js sculpture on the landing page.
const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const phoneAuthConfigured = Boolean(config.apiKey && config.authDomain && config.projectId);

let loading = null;

// Resolves to the pieces of the SDK the phone flow uses. Cached, because
// initializeApp throws if it runs twice for the same name.
export function loadPhoneAuth() {
  if (!loading) {
    loading = (async () => {
      const [{ initializeApp, getApps }, auth] = await Promise.all([
        import('firebase/app'),
        import('firebase/auth'),
      ]);
      const app = getApps()[0] || initializeApp(config);
      const instance = auth.getAuth(app);
      // Sends the SMS in the visitor's own language where Firebase has one.
      instance.useDeviceLanguage();
      return {
        auth: instance,
        RecaptchaVerifier: auth.RecaptchaVerifier,
        signInWithPhoneNumber: auth.signInWithPhoneNumber,
      };
    })();
  }
  return loading;
}

// Firebase wants strict E.164: a plus, the country code, then digits only.
export function toE164(countryCode, localNumber) {
  return `${countryCode}${(localNumber || '').replace(/\D/g, '')}`;
}

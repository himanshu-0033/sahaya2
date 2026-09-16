import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import RouteChrome from '../layouts/RouteChrome.jsx';
import Landing from '../features/home/Landing.jsx';
import Welcome from '../features/auth/Welcome.jsx';
import NotFound from '../shared/NotFound.jsx';
import { SkeletonText } from '../shared/Skeleton.jsx';

// WHY THE ROUTES ARE SPLIT.
//
// Every screen used to be imported at the top of this file, which meant one
// bundle containing all of them. A stranger opening the landing page
// downloaded the running questionnaire, the grounding player, the check-in,
// the account page and the entire reading corpus — the essays, the 23
// questionnaire dossiers and the item text for all of them — to look at a page
// that uses none of it. That is the wrong thing to send someone on a hostel
// connection before they have decided whether they want the app at all.
//
// Three stay eager, because they are where people arrive and a lazy chunk for
// the first screen only adds a round trip to the thing you are trying to make
// fast:
//
//   Landing   `/` for someone signed in.
//   Welcome   `/welcome` for everyone else, and where `/` redirects.
//   NotFound  the catch-all, which has to work when nothing else did.
//
// Everything else loads when it is first opened. Landing and Welcome sit in
// the first bundle together on purpose: signing in goes straight from one to
// the other, so the second is worth having already.
//
// The boundary in main.jsx is what catches a chunk that fails to resolve. Its
// own comment already names that case, and its reload button is the right fix
// for it: a chunk 404s when the deploy moved underneath an open tab, and a
// reload is exactly what clears that.

const Account = lazy(() => import('../features/profile/Account.jsx'));
const More = lazy(() => import('../features/home/More.jsx'));
const CheckIn = lazy(() => import('../features/checkin/CheckIn.jsx'));
const Results = lazy(() => import('../features/checkin/Results.jsx'));
const QuickCheck = lazy(() => import('../features/checkin/QuickCheck.jsx'));
const InkblotTest = lazy(() => import('../features/inkblot/InkblotTest.jsx'));
const Assessments = lazy(() => import('../features/assessments/Assessments.jsx'));
const AssessmentRun = lazy(() => import('../features/assessments/AssessmentRun.jsx'));
const Paths = lazy(() => import('../features/paths/Paths.jsx'));
const PathRun = lazy(() => import('../features/paths/PathRun.jsx'));
const Grounding = lazy(() => import('../features/grounding/Grounding.jsx'));
const GroundingPractice = lazy(() => import('../features/grounding/GroundingPractice.jsx'));
const Read = lazy(() => import('../features/read/Read.jsx'));
const ReadArticle = lazy(() => import('../features/read/ReadArticle.jsx'));
const ReadTest = lazy(() => import('../features/read/ReadTest.jsx'));
const Caregiver = lazy(() => import('../features/caregiver/Caregiver.jsx'));
const CaregiverResident = lazy(() => import('../features/caregiver/CaregiverResident.jsx'));
const ResetPassword = lazy(() => import('../features/auth/ResetPassword.jsx'));
const ChatHistory = lazy(() => import('../features/companion/ChatHistory.jsx'));

// Held to the shape of a page rather than a spinner, for the reason written at
// the top of Skeleton.jsx: a bare line of text on an empty screen reads as
// "nothing here" rather than "not yet".
function RouteFallback() {
  return (
    <div className="mx-auto max-w-2xl px-5 pt-10 sm:px-6">
      <SkeletonText label="Loading this page…" lines={4} />
    </div>
  );
}

export default function App() {
  return (
    <>
      {/* Title, scroll position and focus — the three things the browser
          stops doing for you once the address bar is yours. */}
      <RouteChrome />
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          {/* Signing in is its own page. Landing redirects here when there is
              no session, and this redirects back once there is one. */}
          <Route path="/welcome" element={<Welcome />} />
          {/* Public on purpose: no session check inside it. */}
          <Route path="/check" element={<QuickCheck />} />
          {/* Reached from a link in an email, so it must work signed out. */}
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/account" element={<Account />} />
          {/* The URL people actually type for this page. */}
          <Route path="/profile" element={<Account />} />
          <Route path="/more" element={<More />} />
          <Route path="/checkin" element={<CheckIn />} />
          <Route path="/results" element={<Results />} />
          <Route path="/talks" element={<ChatHistory />} />
          <Route path="/inkblot-test" element={<InkblotTest />} />
          <Route path="/assessments" element={<Assessments />} />
          <Route path="/assessments/:instrumentId" element={<AssessmentRun />} />
          <Route path="/paths" element={<Paths />} />
          <Route path="/paths/:pathId" element={<PathRun />} />
          <Route path="/read" element={<Read />} />
          <Route path="/read/tests/:instrumentId" element={<ReadTest />} />
          <Route path="/read/:articleId" element={<ReadArticle />} />
          <Route path="/grounding" element={<Grounding />} />
          <Route path="/grounding/:techniqueId" element={<GroundingPractice />} />
          <Route path="/caregiver" element={<Caregiver />} />
          <Route path="/caregiver/:residentId" element={<CaregiverResident />} />
          {/* Anything else. Without this the router matched nothing and rendered
              nothing, so a stale or mistyped link produced a black screen with
              no masthead, no tab bar and no crisis contacts. */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </>
  );
}

import { Routes, Route } from 'react-router-dom';
import RouteChrome from '../layouts/RouteChrome.jsx';
import Landing from '../features/home/Landing.jsx';
import Account from '../features/profile/Account.jsx';
import More from '../features/home/More.jsx';
import CheckIn from '../features/checkin/CheckIn.jsx';
import Results from '../features/checkin/Results.jsx';
import InkblotTest from '../features/inkblot/InkblotTest.jsx';
import Assessments from '../features/assessments/Assessments.jsx';
import AssessmentRun from '../features/assessments/AssessmentRun.jsx';
import Paths from '../features/paths/Paths.jsx';
import PathRun from '../features/paths/PathRun.jsx';
import Grounding from '../features/grounding/Grounding.jsx';
import Read from '../features/read/Read.jsx';
import ReadArticle from '../features/read/ReadArticle.jsx';
import ReadTest from '../features/read/ReadTest.jsx';
import GroundingPractice from '../features/grounding/GroundingPractice.jsx';
import Caregiver from '../features/caregiver/Caregiver.jsx';
import CaregiverResident from '../features/caregiver/CaregiverResident.jsx';
import ResetPassword from '../features/auth/ResetPassword.jsx';
import NotFound from '../shared/NotFound.jsx';

export default function App() {
  return (
    <>
      {/* Title, scroll position and focus — the three things the browser
          stops doing for you once the address bar is yours. */}
      <RouteChrome />
      <Routes>
        <Route path="/" element={<Landing />} />
        {/* Reached from a link in an email, so it must work signed out. */}
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/account" element={<Account />} />
        {/* The URL people actually type for this page. */}
        <Route path="/profile" element={<Account />} />
        <Route path="/more" element={<More />} />
        <Route path="/checkin" element={<CheckIn />} />
        <Route path="/results" element={<Results />} />
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
    </>
  );
}

import { Routes, Route } from 'react-router-dom';
import Cursor from './components/Cursor.jsx';
import RouteChrome from './components/RouteChrome.jsx';
import Landing from './pages/Landing.jsx';
import Account from './pages/Account.jsx';
import More from './pages/More.jsx';
import CheckIn from './pages/CheckIn.jsx';
import Results from './pages/Results.jsx';
import InkblotTest from './pages/InkblotTest.jsx';
import Assessments from './pages/Assessments.jsx';
import AssessmentRun from './pages/AssessmentRun.jsx';
import Paths from './pages/Paths.jsx';
import PathRun from './pages/PathRun.jsx';
import Grounding from './pages/Grounding.jsx';
import Read from './pages/Read.jsx';
import ReadArticle from './pages/ReadArticle.jsx';
import ReadTest from './pages/ReadTest.jsx';
import GroundingPractice from './pages/GroundingPractice.jsx';
import Caregiver from './pages/Caregiver.jsx';
import CaregiverResident from './pages/CaregiverResident.jsx';
import NotFound from './pages/NotFound.jsx';

export default function App() {
  return (
    <>
      {/* Mounted once, above the router, so the ring keeps its momentum
          across a navigation instead of snapping back on every route. */}
      <Cursor />
      {/* Title, scroll position and focus — the three things the browser
          stops doing for you once the address bar is yours. */}
      <RouteChrome />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/account" element={<Account />} />
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

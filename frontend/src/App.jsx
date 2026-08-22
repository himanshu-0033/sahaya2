import { Routes, Route } from 'react-router-dom';
import Cursor from './components/Cursor.jsx';
import Landing from './pages/Landing.jsx';
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
import GroundingPractice from './pages/GroundingPractice.jsx';
import Caregiver from './pages/Caregiver.jsx';
import CaregiverResident from './pages/CaregiverResident.jsx';

export default function App() {
  return (
    <>
      {/* Mounted once, above the router, so the ring keeps its momentum
          across a navigation instead of snapping back on every route. */}
      <Cursor />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/checkin" element={<CheckIn />} />
        <Route path="/results" element={<Results />} />
        <Route path="/inkblot-test" element={<InkblotTest />} />
        <Route path="/assessments" element={<Assessments />} />
        <Route path="/assessments/:instrumentId" element={<AssessmentRun />} />
        <Route path="/paths" element={<Paths />} />
        <Route path="/paths/:pathId" element={<PathRun />} />
        <Route path="/read" element={<Read />} />
        <Route path="/read/:articleId" element={<ReadArticle />} />
        <Route path="/grounding" element={<Grounding />} />
        <Route path="/grounding/:techniqueId" element={<GroundingPractice />} />
        <Route path="/caregiver" element={<Caregiver />} />
        <Route path="/caregiver/:residentId" element={<CaregiverResident />} />
      </Routes>
    </>
  );
}

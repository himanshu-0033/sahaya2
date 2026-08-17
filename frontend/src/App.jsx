import { Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing.jsx';
import CheckIn from './pages/CheckIn.jsx';
import Results from './pages/Results.jsx';
import Caregiver from './pages/Caregiver.jsx';
import CaregiverResident from './pages/CaregiverResident.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/checkin" element={<CheckIn />} />
      <Route path="/results" element={<Results />} />
      <Route path="/caregiver" element={<Caregiver />} />
      <Route path="/caregiver/:residentId" element={<CaregiverResident />} />
    </Routes>
  );
}

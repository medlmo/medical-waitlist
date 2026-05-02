import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import MedecinInterface from './components/MedecinInterface';
import PatientInterface from './components/PatientInterface';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/medecin" element={<MedecinInterface />} />
        <Route path="/patient" element={<PatientInterface />} />
      </Routes>
    </Router>
  );
}

export default App;
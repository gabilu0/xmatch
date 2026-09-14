import { BrowserRouter, Routes, Route } from 'react-router-dom';

function Placeholder() {
  return (
    <div style={{ padding: 24, fontFamily: 'sans-serif' }}>
      <h1>xMatch</h1>
      <p>Scaffold do frontend funcionando. Telas de verdade vêm a seguir.</p>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Placeholder />} />
      </Routes>
    </BrowserRouter>
  );
}

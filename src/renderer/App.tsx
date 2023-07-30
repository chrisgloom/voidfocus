import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

function Hello() {
  return (
    <div className="bg-slate-900 h-screen prose lg:prose-xl  mx-auto">
      <h1 className="text-center text-gray-200 p-8 floating">Voidspace</h1>
      <blockquote className="text-gray-200">
        Voidspace is the idea that boredom is the ideal mindset to want to do
        the things you want to do. Computers are incredibly useful when they
        aren&apos;t connected to skinner boxes. So disconnect them.
      </blockquote>

      <h2 className="text-gray-200">Time spent this year in void:</h2>

      <div className="relative mb-5 h-5 rounded-full bg-gray-200 w-4/5 mx-auto">
        <div
          className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 background-animate"
          style={{ width: '75%' }}
        >
          <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-white">
            75%
          </span>
        </div>
      </div>
      <h2 className="text-gray-200">Total Void All Time: </h2>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Hello />} />
      </Routes>
    </Router>
  );
}

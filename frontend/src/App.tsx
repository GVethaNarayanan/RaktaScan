import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Screening from './pages/Screening'
import Result from './pages/Result'
import History from './pages/History'
import CHWMode from './pages/CHWMode'
import Settings from './pages/Settings'

function App() {
  return (
    <div className="min-h-screen bg-gray-950">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/screening" element={<Screening />} />
        <Route path="/result" element={<Result />} />
        <Route path="/history" element={<History />} />
        <Route path="/chw" element={<CHWMode />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </div>
  )
}

export default App

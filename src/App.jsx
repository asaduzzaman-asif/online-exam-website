import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast'; // Toaster ইমপোর্ট করা হয়েছে
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import UserDashboard from './pages/UserDashboard';
import TakeExam from './pages/TakeExam';

function App() {
  return (
    <Router>
      {/* ওয়েবসাইটের সব জায়গায় প্রফেশনাল অ্যালার্ট দেখানোর জন্য Toaster অ্যাড করা হলো */}
      <Toaster position="top-center" reverseOrder={false} />
      
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/user-dashboard" element={<UserDashboard />} />
        <Route path="/take-exam/:id" element={<TakeExam />} />
      </Routes>
    </Router>
  );
}

export default App;
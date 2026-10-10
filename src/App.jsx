import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';
import TakeExam from './pages/TakeExam'; // <-- নতুন পেজ ইম্পোর্ট করা হলো

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/user-dashboard" element={<UserDashboard />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/exam/:id" element={<TakeExam />} /> {/* <-- নতুন পেজের লিংক */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
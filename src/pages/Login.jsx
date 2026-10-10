import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // ইউজার আগে থেকেই লগইন করা থাকলে তাকে ড্যাশবোর্ডে পাঠিয়ে দেওয়া
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const email = session.user.email;
        if (email === '01700000000@exam.com') {
          navigate('/admin-dashboard');
        } else {
          navigate('/user-dashboard');
        }
      }
    };
    checkUser();
  }, [navigate]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    const dummyEmail = `${phone}@exam.com`;

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({
        email: dummyEmail,
        password: password,
      });
      if (error) alert(error.message);
      else {
        if (phone === '01861050437') navigate('/admin-dashboard');
        else navigate('/user-dashboard');
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email: dummyEmail,
        password: password,
      });
      if (error) alert(error.message);
      else {
        alert("Account Created Successfully! Please login now.");
        setIsLogin(true); // অ্যাকাউন্ট তৈরির পর লগইন ফর্মে ফিরে যাওয়া
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 selection:bg-[#AEEED3] selection:text-[#287A74]">
      <div className="w-full max-w-md">
        
        {/* Logo/Icon Area */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-[#287A74] rounded-3xl mx-auto flex items-center justify-center shadow-lg transform rotate-3 hover:rotate-0 transition-transform duration-300">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
          </div>
          <h1 className="text-3xl font-black text-[#287A74] mt-6 tracking-wide">Exam Portal</h1>
          <p className="text-gray-500 font-medium mt-2">{isLogin ? 'Welcome back! Please login.' : 'Create your student account.'}</p>
        </div>

        {/* Auth Card */}
        <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-gray-100 relative overflow-hidden">
          {/* Decorative Circle */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#AEEED3]/30 rounded-bl-full -mr-10 -mt-10"></div>
          
          <form onSubmit={handleAuth} className="space-y-6 relative z-10">
            <div>
              <label className="block text-gray-700 font-bold mb-2 ml-1">Mobile Number</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                </div>
                <input 
                  type="text" required placeholder="e.g. 017XXXXXXXX"
                  className="w-full pl-11 pr-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:bg-white focus:border-[#55A9A0] focus:ring-0 outline-none transition-all font-medium"
                  value={phone} onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-700 font-bold mb-2 ml-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                </div>
                <input 
                  type="password" required placeholder="Min 6 characters"
                  className="w-full pl-11 pr-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:bg-white focus:border-[#55A9A0] focus:ring-0 outline-none transition-all font-medium"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button 
              type="submit" disabled={loading}
              className={`w-full text-white font-black py-4 rounded-2xl shadow-lg transition-all duration-300 transform hover:-translate-y-1 ${loading ? 'bg-gray-400' : 'bg-[#287A74] hover:bg-[#1f5c57] hover:shadow-xl'}`}
            >
              {loading ? 'Processing...' : (isLogin ? 'Login Securely' : 'Create Account')}
            </button>
          </form>

          <div className="mt-8 text-center relative z-10">
            <p className="text-gray-500 font-medium">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button 
                onClick={() => setIsLogin(!isLogin)} 
                className="text-[#55A9A0] font-bold hover:text-[#287A74] hover:underline transition-colors ml-1"
              >
                {isLogin ? 'Sign Up' : 'Login'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
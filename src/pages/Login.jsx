import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // পাসওয়ার্ড দেখানোর স্টেট
  const [popup, setPopup] = useState({ show: false, message: '', type: '' }); // পপ-আপ স্টেট
  const navigate = useNavigate();

  // ইউজার আগে থেকেই লগইন করা থাকলে ড্যাশবোর্ডে পাঠানো
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

  // কাস্টম পপ-আপ দেখানোর ফাংশন
  const showPopupMessage = (message, type) => {
    setPopup({ show: true, message, type });
    setTimeout(() => {
      setPopup({ show: false, message: '', type: '' });
    }, 3000); // ৩ সেকেন্ড পর পপ-আপ চলে যাবে
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    const dummyEmail = `${phone}@exam.com`;

    if (isLogin) {
      // লগইন লজিক
      const { error } = await supabase.auth.signInWithPassword({
        email: dummyEmail,
        password: password,
      });
      
      if (error) {
        showPopupMessage("Invalid phone number or password!", "error");
      } else {
        if (phone === '01700000000') navigate('/admin-dashboard');
        else navigate('/user-dashboard');
      }
    } else {
      // সাইন-আপ লজিক
      const { error } = await supabase.auth.signUp({
        email: dummyEmail,
        password: password,
      });
      
      if (error) {
        showPopupMessage(error.message, "error");
      } else {
        // সাইন আপ সফল হলে ডাইরেক্ট লগইন করে ড্যাশবোর্ডে পাঠিয়ে দেবে
        showPopupMessage("Account created successfully! Logging you in...", "success");
        setTimeout(() => {
          if (phone === '01700000000') navigate('/admin-dashboard');
          else navigate('/user-dashboard');
        }, 1500); // মেসেজ দেখার জন্য ১.৫ সেকেন্ড অপেক্ষা করে রিডাইরেক্ট
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 selection:bg-[#AEEED3] selection:text-[#287A74] relative">
      
      {/* Custom Popup (Toast) */}
      {popup.show && (
        <div className={`fixed top-8 right-8 z-50 px-6 py-4 rounded-xl shadow-2xl font-bold flex items-center space-x-3 transition-all duration-500 transform ${popup.type === 'error' ? 'bg-red-100 text-red-600 border-l-4 border-red-500' : 'bg-[#AEEED3] text-[#287A74] border-l-4 border-[#287A74]'}`}>
          {popup.type === 'error' ? (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          ) : (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          )}
          <span>{popup.message}</span>
        </div>
      )}

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
                
                {/* Dynamic Password Input */}
                <input 
                  type={showPassword ? "text" : "password"} required placeholder="Min 6 characters"
                  className="w-full pl-11 pr-12 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:bg-white focus:border-[#55A9A0] focus:ring-0 outline-none transition-all font-medium"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                />

                {/* Eye Icon Button */}
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-[#287A74] transition-colors focus:outline-none"
                >
                  {showPassword ? (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                  )}
                </button>
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
                type="button"
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
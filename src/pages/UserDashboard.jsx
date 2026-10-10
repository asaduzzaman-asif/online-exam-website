import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function UserDashboard() {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [attempts, setAttempts] = useState({}); 
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: examsData } = await supabase.from('exams').select('*').order('created_at', { ascending: false });
      const { data: attemptsData } = await supabase.from('exam_attempts').select('exam_id, score').eq('user_id', user.id);

      const attemptsMap = {};
      if (attemptsData) {
        attemptsData.forEach(attempt => { attemptsMap[attempt.exam_id] = attempt.score; });
      }

      if (examsData) setExams(examsData);
      setAttempts(attemptsMap);
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/'); 
  };

  const handleStartExam = (examId) => {
    navigate(`/exam/${examId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans selection:bg-[#AEEED3] selection:text-[#287A74]">
      
      {/* Premium Navbar */}
      <nav className="bg-[#287A74] text-white shadow-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-[#AEEED3] rounded-xl flex items-center justify-center shadow-inner">
                <span className="text-[#287A74] font-black text-xl">E</span>
              </div>
              <h1 className="text-2xl font-black tracking-widest uppercase">Exam Portal</h1>
            </div>
            <button onClick={handleLogout} className="bg-white/10 hover:bg-red-500 text-white px-6 py-2.5 rounded-xl font-bold transition duration-300 backdrop-blur-md">
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="text-4xl font-black text-[#287A74] mb-2">Available Exams</h2>
            <p className="text-gray-500 font-medium">Select an exam below to begin your test.</p>
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#55A9A0]"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            
            {exams.map((exam) => {
              const isAttended = attempts[exam.id] !== undefined;
              
              return (
                <div key={exam.id} className="bg-white rounded-3xl shadow-sm hover:shadow-2xl transition-all duration-300 border border-gray-100 p-8 flex flex-col justify-between group transform hover:-translate-y-1">
                  <div>
                    <div className="flex justify-between items-start mb-6">
                      <h3 className="text-2xl font-extrabold text-gray-800 group-hover:text-[#55A9A0] transition-colors line-clamp-2">{exam.title}</h3>
                      <span className="bg-[#AEEED3] text-[#287A74] px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest shadow-sm ml-4 whitespace-nowrap">
                        {exam.category}
                      </span>
                    </div>
                    
                    <div className="space-y-3 mb-8 bg-gray-50 p-5 rounded-2xl border border-gray-100">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500 font-bold">Starts:</span>
                        <span className="text-[#287A74] font-bold">{new Date(exam.start_time).toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', month: 'short', day: 'numeric' })}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500 font-bold">Ends:</span>
                        <span className="text-red-500 font-bold">{new Date(exam.end_time).toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', month: 'short', day: 'numeric' })}</span>
                      </div>
                    </div>
                  </div>
                  
                  {isAttended ? (
                    <div className="w-full bg-[#AEEED3]/30 text-[#287A74] font-black py-4 rounded-xl text-center border border-[#55A9A0]/30 shadow-inner flex items-center justify-center space-x-2">
                      <svg className="w-6 h-6 text-[#287A74]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                      <span>Completed (Score: {attempts[exam.id]})</span>
                    </div>
                  ) : (
                    <button onClick={() => handleStartExam(exam.id)} className="w-full bg-[#55A9A0] hover:bg-[#287A74] text-white font-black py-4 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 flex items-center justify-center space-x-2">
                      <span>Start Exam</span>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                    </button>
                  )}
                </div>
              );
            })}
            
            {exams.length === 0 && (
              <div className="col-span-full py-20 flex flex-col items-center justify-center text-center bg-white rounded-3xl border border-dashed border-gray-300">
                <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path></svg>
                </div>
                <p className="text-2xl font-bold text-gray-400">No exams available right now.</p>
                <p className="text-gray-400 mt-2">Check back later!</p>
              </div>
            )}

          </div>
        )}
      </main>
    </div>
  );
}
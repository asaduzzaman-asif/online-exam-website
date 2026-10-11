import toast from 'react-hot-toast';
import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function UserDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('live'); 
  const [userPhone, setUserPhone] = useState('');
  const [profileName, setProfileName] = useState('');
  const [hasProfile, setHasProfile] = useState(true);
  const [loadingProfile, setLoadingProfile] = useState(true);
  
  const [examsList, setExamsList] = useState([]);
  const [myResults, setMyResults] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return navigate('/');
      
      const phone = session.user.email.split('@')[0];
      setUserPhone(phone);

      const { data: profile } = await supabase.from('profiles').select('*').eq('phone', phone).single();
      if (profile) setProfileName(profile.name);
      else setHasProfile(false);
      
      setLoadingProfile(false);

      const { data: exams } = await supabase.from('exams').select('*').order('created_at', { ascending: false });
      if (exams) setExamsList(exams);

      const { data: cats } = await supabase.from('categories').select('*').order('created_at', { ascending: false });
      if (cats) setCategoriesList(cats);

      const { data: results } = await supabase.from('exam_attempts').select('*').eq('user_phone', phone).order('created_at', { ascending: false });
      if (results && exams) {
        const combined = results.map(res => {
          const examInfo = exams.find(e => e.id === res.exam_id);
          return { ...res, exam_title: examInfo ? examInfo.title : 'Deleted Exam', pass_mark: examInfo ? examInfo.pass_mark : 0 };
        });
        setMyResults(combined);
      }
    };
    fetchUserData();
  }, [navigate]);

  const handleLogout = async () => { await supabase.auth.signOut(); navigate('/'); };

  // সময় দিয়ে অটোমেটিক লাইভ এবং প্রিভিয়াস ফিল্টার করা হচ্ছে
  const now = new Date().getTime();
  const liveExams = examsList.filter(e => new Date(e.end_time).getTime() > now && (selectedCategory === 'All' || e.category === selectedCategory));
  const previousExams = examsList.filter(e => new Date(e.end_time).getTime() <= now && (selectedCategory === 'All' || e.category === selectedCategory));

  if (loadingProfile) return <div className="min-h-screen flex items-center justify-center font-bold text-[#287A74] text-xl">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <nav className="bg-[#287A74] text-white p-5 shadow-md flex justify-between items-center">
        <div className="text-2xl font-black tracking-wider px-4">Exam Portal</div>
        <div className="flex items-center space-x-6 px-4">
          <span className="font-bold border-r border-white/30 pr-6">Hi, {profileName}</span>
          <button onClick={handleLogout} className="font-bold text-red-200 hover:text-white">Logout</button>
        </div>
      </nav>

      <div className="flex-1 max-w-6xl w-full mx-auto p-8 mt-4">
        <div className="flex flex-wrap gap-4 mb-8">
          <button onClick={() => setActiveTab('live')} className={`px-8 py-3 font-bold rounded-xl transition-all ${activeTab === 'live' ? 'bg-red-500 text-white shadow-lg' : 'bg-white text-gray-500 border'}`}>Live Exams</button>
          <button onClick={() => setActiveTab('previous')} className={`px-8 py-3 font-bold rounded-xl transition-all ${activeTab === 'previous' ? 'bg-orange-500 text-white shadow-lg' : 'bg-white text-gray-500 border'}`}>Previous Exams</button>
          <button onClick={() => setActiveTab('results')} className={`px-8 py-3 font-bold rounded-xl transition-all ${activeTab === 'results' ? 'bg-[#55A9A0] text-white shadow-lg' : 'bg-white text-gray-500 border'}`}>My Results</button>
        </div>

        {(activeTab === 'live' || activeTab === 'previous') && (
          <div className="flex flex-wrap gap-3 mb-8">
            <button onClick={() => setSelectedCategory('All')} className={`px-5 py-2 rounded-lg font-bold text-sm border ${selectedCategory === 'All' ? 'bg-[#287A74] text-white' : 'bg-white text-gray-600'}`}>All</button>
            {categoriesList.map(cat => (
              <button key={cat.id} onClick={() => setSelectedCategory(cat.name)} className={`px-5 py-2 rounded-lg font-bold text-sm border ${selectedCategory === cat.name ? 'bg-[#287A74] text-white' : 'bg-white text-gray-600'}`}>{cat.name}</button>
            ))}
          </div>
        )}

        {activeTab === 'live' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {liveExams.map(exam => (
              <div key={exam.id} className="bg-white p-6 rounded-3xl shadow-sm border border-red-100 hover:shadow-xl transition-all">
                <span className="bg-red-100 text-red-700 px-3 py-1 rounded-lg text-sm font-bold mb-4 inline-block">LIVE EXAM</span>
                <h3 className="text-xl font-black text-gray-800 mb-2">{exam.title}</h3>
                <p className="text-gray-500 font-bold mb-4">Limit: 1 Attempt</p>
                <p className="text-red-400 text-xs font-bold mb-4">Ends: {new Date(exam.end_time).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                <button onClick={() => navigate(`/take-exam/${exam.id}`)} className="w-full bg-red-50 hover:bg-red-500 hover:text-white text-red-600 font-bold py-3 rounded-xl transition-colors">Start Live Exam</button>
              </div>
            ))}
            {liveExams.length === 0 && <p className="text-gray-500 font-bold col-span-3">No live exams available right now.</p>}
          </div>
        )}

        {activeTab === 'previous' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {previousExams.map(exam => (
              <div key={exam.id} className="bg-white p-6 rounded-3xl shadow-sm border border-orange-100 hover:shadow-xl transition-all">
                <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-lg text-sm font-bold mb-4 inline-block">PREVIOUS / PRACTICE</span>
                <h3 className="text-xl font-black text-gray-800 mb-2">{exam.title}</h3>
                <p className="text-gray-500 font-bold mb-4">Limit: 2 Attempts</p>
                <button onClick={() => navigate(`/take-exam/${exam.id}`)} className="w-full bg-orange-50 hover:bg-orange-500 hover:text-white text-orange-600 font-bold py-3 rounded-xl transition-colors">Practice Now</button>
              </div>
            ))}
            {previousExams.length === 0 && <p className="text-gray-500 font-bold col-span-3">No previous exams found.</p>}
          </div>
        )}

        {activeTab === 'results' && (
           <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden animate-fade-in">
             <table className="w-full text-left">
               <thead className="bg-[#AEEED3]/30">
                 <tr>
                   <th className="p-6 font-black text-[#287A74] uppercase text-sm">Exam Title</th>
                   <th className="p-6 font-black text-[#287A74] uppercase text-sm">Score</th>
                   <th className="p-6 font-black text-[#287A74] uppercase text-sm">Status</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                 {myResults.map(res => {
                   const isPass = res.score >= res.pass_mark; 
                   return (
                     <tr key={res.id} className="hover:bg-gray-50">
                       <td className="p-6 font-bold text-gray-700">{res.exam_title}</td>
                       <td className="p-6"><span className="font-black text-xl text-[#287A74]">{res.score}</span><span className="text-xs text-gray-400 font-bold ml-1">/{res.pass_mark}</span></td>
                       <td className="p-6">
                         <span className={`px-4 py-2 rounded-xl font-black text-sm shadow-sm ${isPass ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{isPass ? 'PASS' : 'FAIL'}</span>
                       </td>
                     </tr>
                   )
                 })}
               </tbody>
             </table>
           </div>
        )}
      </div>
    </div>
  );
}
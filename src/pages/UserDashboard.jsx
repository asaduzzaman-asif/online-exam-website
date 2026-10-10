import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function UserDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('exams');
  
  const [userPhone, setUserPhone] = useState('');
  const [profileName, setProfileName] = useState('');
  const [hasProfile, setHasProfile] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  
  const [examsList, setExamsList] = useState([]);
  const [myResults, setMyResults] = useState([]);
  
  // ক্যাটাগরির জন্য নতুন স্টেট
  const [categoriesList, setCategoriesList] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return navigate('/');
      
      const phone = session.user.email.split('@')[0];
      setUserPhone(phone);

      const { data: profile } = await supabase.from('profiles').select('*').eq('phone', phone).single();
      if (profile) {
        setProfileName(profile.name);
        setHasProfile(true);
      }
      setLoadingProfile(false);

      // এক্সাম লিস্ট ফেচ করা
      const { data: exams } = await supabase.from('exams').select('*').order('created_at', { ascending: false });
      if (exams) setExamsList(exams);

      // ক্যাটাগরি লিস্ট ফেচ করা
      const { data: cats } = await supabase.from('categories').select('*').order('created_at', { ascending: false });
      if (cats) setCategoriesList(cats);

      // রেজাল্ট ফেচ করা
      const { data: results } = await supabase.from('exam_attempts').select('*').eq('user_phone', phone).order('created_at', { ascending: false });
      
      if (results && exams) {
        const combined = results.map(res => {
          const examInfo = exams.find(e => e.id === res.exam_id);
          return { 
            ...res, 
            exam_title: examInfo ? examInfo.title : 'Deleted Exam',
            pass_mark: examInfo ? examInfo.pass_mark : 0
          };
        });
        setMyResults(combined);
      }
    };
    fetchUserData();
  }, [navigate]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!profileName.trim()) return;
    const { error } = await supabase.from('profiles').insert([{ phone: userPhone, name: profileName }]);
    if (error) alert("Error saving profile: " + error.message);
    else setHasProfile(true);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  // ক্যাটাগরি অনুযায়ী এক্সাম ফিল্টার করার লজিক
  const filteredExams = selectedCategory === 'All' 
    ? examsList 
    : examsList.filter(exam => exam.category === selectedCategory);

  if (loadingProfile) {
    return <div className="min-h-screen flex items-center justify-center font-bold text-[#287A74] text-xl">Loading Dashboard...</div>;
  }

  if (!hasProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-10 rounded-3xl shadow-xl max-w-md w-full border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#AEEED3]/30 rounded-bl-full -mr-10 -mt-10"></div>
          <h2 className="text-3xl font-black text-[#287A74] mb-2 relative z-10">Student Profile</h2>
          <p className="text-gray-500 mb-8 font-medium relative z-10">Please enter your full name before taking any exams.</p>
          <form onSubmit={handleSaveProfile} className="space-y-6 relative z-10">
            <div>
              <label className="block text-gray-700 font-bold mb-2 ml-1">Your Full Name</label>
              <input type="text" required placeholder="e.g. Asaduzzaman Asif" className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:bg-white focus:border-[#55A9A0] outline-none font-medium" value={profileName} onChange={(e) => setProfileName(e.target.value)} />
            </div>
            <button type="submit" className="w-full bg-[#287A74] hover:bg-[#1f5c57] text-white font-black py-4 rounded-2xl shadow-lg transition-all transform hover:-translate-y-1">Save & Continue</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <nav className="bg-[#287A74] text-white p-5 shadow-md flex justify-between items-center">
        <div className="text-2xl font-black tracking-wider px-4">Exam Portal</div>
        <div className="flex items-center space-x-6 px-4">
          <span className="font-bold border-r border-white/30 pr-6">Hi, {profileName}</span>
          <button onClick={handleLogout} className="font-bold text-red-200 hover:text-white transition-colors">Logout</button>
        </div>
      </nav>

      <div className="flex-1 max-w-6xl w-full mx-auto p-8 mt-4">
        <div className="flex space-x-4 mb-8">
          <button onClick={() => setActiveTab('exams')} className={`px-8 py-3 font-bold rounded-xl transition-all ${activeTab === 'exams' ? 'bg-[#55A9A0] text-white shadow-lg translate-y-[-2px]' : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-200'}`}>Available Exams</button>
          <button onClick={() => setActiveTab('results')} className={`px-8 py-3 font-bold rounded-xl transition-all ${activeTab === 'results' ? 'bg-[#55A9A0] text-white shadow-lg translate-y-[-2px]' : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-200'}`}>My Results</button>
        </div>

        {activeTab === 'exams' && (
          <div className="animate-fade-in">
            {/* ক্যাটাগরি ফিল্টার মেনু */}
            <div className="flex flex-wrap gap-3 mb-8">
              <button 
                onClick={() => setSelectedCategory('All')} 
                className={`px-5 py-2 rounded-lg font-bold transition-all text-sm border ${selectedCategory === 'All' ? 'bg-[#287A74] text-white border-[#287A74] shadow-md' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
              >
                All Exams
              </button>
              {categoriesList.map(cat => (
                <button 
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.name)} 
                  className={`px-5 py-2 rounded-lg font-bold transition-all text-sm border ${selectedCategory === cat.name ? 'bg-[#287A74] text-white border-[#287A74] shadow-md' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* এক্সাম লিস্ট */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredExams.map(exam => (
                <div key={exam.id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300">
                  <span className="bg-[#AEEED3]/50 text-[#287A74] px-3 py-1 rounded-lg text-sm font-bold mb-4 inline-block">{exam.category}</span>
                  <h3 className="text-xl font-black text-gray-800 mb-2">{exam.title}</h3>
                  <p className="text-gray-500 font-bold mb-4">Pass Mark: {exam.pass_mark || 0}</p>
                  <button onClick={() => navigate(`/take-exam/${exam.id}`)} className="w-full bg-gray-100 hover:bg-[#287A74] hover:text-white text-gray-600 font-bold py-3 rounded-xl transition-colors duration-300">Start Exam</button>
                </div>
              ))}
              {filteredExams.length === 0 && <p className="text-gray-500 font-bold text-lg col-span-3">No exams found in this category.</p>}
            </div>
          </div>
        )}

        {activeTab === 'results' && (
          <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden animate-fade-in">
            <table className="w-full text-left">
              <thead className="bg-[#AEEED3]/30">
                <tr>
                  <th className="p-6 font-black text-[#287A74] uppercase text-sm tracking-wider">Exam Title</th>
                  <th className="p-6 font-black text-[#287A74] uppercase text-sm tracking-wider">My Score</th>
                  <th className="p-6 font-black text-[#287A74] uppercase text-sm tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {myResults.map(res => {
                  const isPass = res.score >= res.pass_mark; 
                  return (
                    <tr key={res.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-6 font-bold text-gray-700">{res.exam_title}</td>
                      <td className="p-6">
                        <span className="font-black text-xl text-[#287A74]">{res.score}</span> 
                        <span className="text-sm text-gray-400 font-bold ml-2">(Pass: {res.pass_mark})</span>
                      </td>
                      <td className="p-6">
                        <span className={`px-4 py-2 rounded-xl font-black text-sm tracking-wide shadow-sm ${isPass ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'}`}>
                          {isPass ? 'PASS' : 'FAIL'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
                {myResults.length === 0 && <tr><td colSpan="3" className="p-12 text-center text-gray-400 font-bold text-lg">You haven't taken any exams yet.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
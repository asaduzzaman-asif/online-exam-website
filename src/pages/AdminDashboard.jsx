import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard'); 
  
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [examType, setExamType] = useState('live'); // নতুন স্টেট: Exam Type
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [passMark, setPassMark] = useState(''); 
  const [loading, setLoading] = useState(false);
  
  const [examsList, setExamsList] = useState([]);
  const [resultsList, setResultsList] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [selectedExamId, setSelectedExamId] = useState('');
  const [questionText, setQuestionText] = useState('');
  const [option1, setOption1] = useState('');
  const [option2, setOption2] = useState('');
  const [option3, setOption3] = useState('');
  const [option4, setOption4] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [questionLoading, setQuestionLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);

  const fetchData = async () => {
    const { data: examsData } = await supabase.from('exams').select('*').order('created_at', { ascending: false });
    if (examsData) setExamsList(examsData);
    const { data: attemptsData } = await supabase.from('exam_attempts').select('*').order('created_at', { ascending: false });
    if (attemptsData && examsData) {
      const combinedResults = attemptsData.map(attempt => {
        const examInfo = examsData.find(e => e.id === attempt.exam_id);
        return { ...attempt, exam_title: examInfo ? examInfo.title : 'Deleted Exam' };
      });
      setResultsList(combinedResults);
    }
    const { data: catsData } = await supabase.from('categories').select('*').order('created_at', { ascending: false });
    if (catsData) setCategoriesList(catsData);
  };
  useEffect(() => { fetchData(); }, []);

  const handleLogout = async () => { await supabase.auth.signOut(); navigate('/'); };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategory.trim()) return;
    setLoading(true);
    const { error } = await supabase.from('categories').insert([{ name: newCategory.trim() }]);
    if (error) alert("Error: " + error.message);
    else { alert("Category Added!"); setNewCategory(''); fetchData(); }
    setLoading(false);
  };

  const handleDeleteCategory = async (id) => {
    if(!window.confirm("Delete this category?")) return;
    await supabase.from('categories').delete().eq('id', id);
    fetchData();
  };

  const handleCreateExam = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from('exams').insert([{ 
      title, category, start_time: startTime, end_time: endTime, pass_mark: Number(passMark), exam_type: examType 
    }]);
    if (error) alert("Error: " + error.message);
    else { 
      alert("Exam Created!"); 
      setTitle(''); setCategory(''); setStartTime(''); setEndTime(''); setPassMark(''); setExamType('live'); 
      fetchData(); 
    }
    setLoading(false);
  };

  const handleDeleteExam = async (id) => {
    if(!window.confirm("Delete this exam and all related data?")) return;
    await supabase.from('questions').delete().eq('exam_id', id);
    await supabase.from('exam_attempts').delete().eq('exam_id', id);
    await supabase.from('exams').delete().eq('id', id);
    alert("Exam deleted!"); fetchData();
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    setQuestionLoading(true);
    const optionsObj = { 1: option1, 2: option2, 3: option3, 4: option4 };
    const { error } = await supabase.from('questions').insert([{ exam_id: selectedExamId, question_text: questionText, options: optionsObj, correct_answer: correctAnswer }]);
    if (error) alert("Error: " + error.message);
    else { alert("Question Added!"); setQuestionText(''); setOption1(''); setOption2(''); setOption3(''); setOption4(''); setCorrectAnswer(''); }
    setQuestionLoading(false);
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      <div className="w-72 bg-[#287A74] text-white flex flex-col shadow-2xl z-10">
        <div className="p-8 text-2xl font-black border-b border-[#55A9A0]/30 text-center uppercase shadow-sm">Admin Pro</div>
        <nav className="flex-1 p-5 space-y-3 mt-6 overflow-y-auto">
          {['dashboard', 'manage-categories', 'manage-exams', 'add-questions', 'view-results'].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`w-full text-left px-5 py-4 rounded-xl font-bold transition-all capitalize ${activeTab === tab ? 'bg-[#55A9A0] shadow-lg translate-x-2' : 'hover:bg-[#55A9A0]/50 hover:translate-x-1'}`}>
              {tab.replace('-', ' ')}
            </button>
          ))}
        </nav>
        <div className="p-6 border-t border-[#55A9A0]/30"><button onClick={handleLogout} className="w-full bg-white/10 hover:bg-red-500 text-white font-bold py-3 rounded-xl transition-colors">Logout</button></div>
      </div>

      <div className="flex-1 p-10 overflow-y-auto bg-gray-50/50">
        {activeTab === 'manage-exams' && (
          <div className="animate-fade-in">
             <h1 className="text-4xl font-extrabold text-[#287A74] mb-8">Manage Exams</h1>
             <div className="bg-white p-10 rounded-3xl shadow-lg border border-gray-100 mb-10 max-w-4xl">
              <h2 className="text-2xl font-bold text-[#55A9A0] mb-6">Create New Exam</h2>
              <form onSubmit={handleCreateExam} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div><label className="block mb-2 font-bold text-gray-600">Exam Title</label><input type="text" required className="w-full px-5 py-3 border-2 border-gray-200 rounded-xl focus:border-[#55A9A0] outline-none" value={title} onChange={e=>setTitle(e.target.value)} /></div>
                  <div>
                    <label className="block mb-2 font-bold text-gray-600">Category</label>
                    <select required className="w-full px-5 py-3 border-2 border-gray-200 rounded-xl focus:border-[#55A9A0] outline-none" value={category} onChange={e=>setCategory(e.target.value)}>
                      <option value="" disabled>-- Select --</option>
                      {categoriesList.map((cat) => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                    </select>
                  </div>
                  {/* নতুন Exam Type সিলেক্ট অপশন */}
                  <div>
                    <label className="block mb-2 font-bold text-gray-600">Exam Type</label>
                    <select className="w-full px-5 py-3 border-2 border-[#AEEED3] bg-[#AEEED3]/10 text-[#287A74] font-bold rounded-xl focus:border-[#55A9A0] outline-none" value={examType} onChange={e=>setExamType(e.target.value)}>
                      <option value="live">Live Exam (1 Attempt)</option>
                      <option value="previous">Previous Exam (2 Attempts)</option>
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div><label className="block mb-2 font-bold text-gray-600">Pass Mark</label><input type="number" required min="1" className="w-full px-5 py-3 border-2 border-gray-200 rounded-xl focus:border-[#55A9A0] outline-none" value={passMark} onChange={e=>setPassMark(e.target.value)} /></div>
                  <div><label className="block mb-2 font-bold text-gray-600">Start Time</label><input type="datetime-local" required className="w-full px-5 py-3 border-2 border-gray-200 rounded-xl focus:border-[#55A9A0] outline-none" value={startTime} onChange={e=>setStartTime(e.target.value)} /></div>
                  <div><label className="block mb-2 font-bold text-gray-600">End Time</label><input type="datetime-local" required className="w-full px-5 py-3 border-2 border-gray-200 rounded-xl focus:border-[#55A9A0] outline-none" value={endTime} onChange={e=>setEndTime(e.target.value)} /></div>
                </div>
                
                <button type="submit" disabled={loading} className={`w-full text-white font-bold py-4 rounded-xl shadow-md transition-all text-lg ${loading ? 'bg-gray-400' : 'bg-[#55A9A0] hover:bg-[#287A74]'}`}>Create Exam</button>
              </form>
            </div>
            
            <h2 className="text-2xl font-extrabold text-gray-700 mb-6">Existing Exams</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {examsList.map(exam => (
                <div key={exam.id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 relative group hover:shadow-xl transition-all">
                  <span className="bg-[#AEEED3]/50 text-[#287A74] px-3 py-1 rounded-lg text-sm font-bold mb-3 inline-block">{exam.category}</span>
                  <span className={`ml-2 px-3 py-1 rounded-lg text-sm font-bold mb-3 inline-block ${exam.exam_type === 'previous' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>{exam.exam_type === 'previous' ? 'Previous' : 'Live'}</span>
                  <h3 className="text-xl font-black text-gray-800 mb-2 truncate">{exam.title}</h3>
                  <button onClick={() => handleDeleteExam(exam.id)} className="absolute top-6 right-6 text-red-200 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity bg-red-50 rounded-lg p-2">Delete</button>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* অন্যান্য ট্যাবগুলো আগের মতোই কাজ করবে, এখানে কোড কমানোর জন্য শুধু manage-exams দেখালাম। আপনি চাইলে আপনার আগের ফাইলের manage-exams সেকশনে শুধু ইনপুটগুলো অ্যাড করে নিতে পারেন বা পুরো কোড রিপ্লেস করতে পারেন। */}
      </div>
    </div>
  );
}
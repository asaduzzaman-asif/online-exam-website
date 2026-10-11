import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard'); 
  
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [examType, setExamType] = useState('live');
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
    // 1. Fetch Exams
    const { data: examsData } = await supabase.from('exams').select('*').order('created_at', { ascending: false });
    if (examsData) setExamsList(examsData);

    // 2. Fetch Profiles (স্টুডেন্টদের নাম আনার জন্য)
    const { data: profilesData } = await supabase.from('profiles').select('*');

    // 3. Fetch Results & Combine
    const { data: attemptsData } = await supabase.from('exam_attempts').select('*').order('created_at', { ascending: false });
    if (attemptsData && examsData) {
      const combinedResults = attemptsData.map(attempt => {
        const examInfo = examsData.find(e => e.id === attempt.exam_id);
        const studentProfile = profilesData ? profilesData.find(p => p.phone === attempt.user_phone) : null;
        
        return { 
          ...attempt, 
          exam_title: examInfo ? examInfo.title : 'Deleted Exam',
          student_name: studentProfile ? studentProfile.name : attempt.user_phone // নাম না পেলে নাম্বার দেখাবে
        };
      });
      setResultsList(combinedResults);
    }

    // 4. Fetch Categories
    const { data: catsData } = await supabase.from('categories').select('*').order('created_at', { ascending: false });
    if (catsData) setCategoriesList(catsData);
  };

  useEffect(() => { fetchData(); }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/'); 
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategory.trim()) return;
    setLoading(true);
    const { error } = await supabase.from('categories').insert([{ name: newCategory.trim() }]);
    if (error) toast.error("Error: " + error.message);
    else { toast.success("Category Added Successfully!"); setNewCategory(''); fetchData(); }
    setLoading(false);
  };

  const handleDeleteCategory = async (id) => {
    if(!window.confirm("Are you sure you want to delete this category?")) return;
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) toast.error("Error: " + error.message);
    else { toast.success("Category deleted!"); fetchData(); }
  };

  const handleCreateExam = async (e) => {
    e.preventDefault();
    setLoading(true);

    const utcStartTime = new Date(startTime).toISOString();
    const utcEndTime = new Date(endTime).toISOString();

    const { error } = await supabase.from('exams').insert([{ 
      title, category, start_time: utcStartTime, end_time: utcEndTime, pass_mark: Number(passMark), exam_type: examType 
    }]);
    
    if (error) toast.error("Error: " + error.message);
    else { 
      toast.success("Exam Created Successfully!"); 
      setTitle(''); setCategory(''); setStartTime(''); setEndTime(''); setPassMark(''); setExamType('live');
      fetchData(); 
    }
    setLoading(false);
  };

  const handleDeleteExam = async (id) => {
    if(!window.confirm("Are you sure you want to delete this exam? This will also permanently delete all questions and student results for this exam!")) return;
    
    await supabase.from('questions').delete().eq('exam_id', id);
    await supabase.from('exam_attempts').delete().eq('exam_id', id);
    const { error } = await supabase.from('exams').delete().eq('id', id);
    
    if (error) toast.error("Error deleting exam: " + error.message);
    else { toast.success("Exam and all related data deleted successfully!"); fetchData(); }
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    if (!selectedExamId) return toast.error("Select an exam first!");
    setQuestionLoading(true);
    const optionsObj = { 1: option1, 2: option2, 3: option3, 4: option4 };
    const { error } = await supabase.from('questions').insert([{ exam_id: selectedExamId, question_text: questionText, options: optionsObj, correct_answer: correctAnswer }]);
    if (error) toast.error("Error: " + error.message);
    else { toast.success("Question Added!"); setQuestionText(''); setOption1(''); setOption2(''); setOption3(''); setOption4(''); setCorrectAnswer(''); }
    setQuestionLoading(false);
  };

  const handleCsvUpload = async (e) => {
    e.preventDefault();
    if (!selectedExamId) return toast.error("Please select an exam first!");
    const file = e.target.csvFile.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target.result;
        const lines = text.split('\n').filter(line => line.trim() !== ''); 
        if (lines.length < 2) throw new Error("File is empty or has no questions.");
        const formattedQuestions = [];
        for (let i = 1; i < lines.length; i++) {
          let valuesArr = []; let insideQuote = false; let currentValue = "";
          for (let char of lines[i]) {
            if (char === '"') insideQuote = !insideQuote;
            else if (char === ',' && !insideQuote) { valuesArr.push(currentValue.trim()); currentValue = ""; }
            else currentValue += char;
          }
          valuesArr.push(currentValue.trim());
          if(valuesArr.length < 6) continue; 
          const cleanText = (str) => str.replace(/^"|"$/g, '').trim();
          formattedQuestions.push({
            exam_id: selectedExamId, question_text: cleanText(valuesArr[0]),
            options: { 1: cleanText(valuesArr[1]), 2: cleanText(valuesArr[2]), 3: cleanText(valuesArr[3]), 4: cleanText(valuesArr[4]) },
            correct_answer: cleanText(valuesArr[5])
          });
        }
        if (formattedQuestions.length === 0) throw new Error("No valid questions found.");
        setUploadLoading(true);
        const { error } = await supabase.from('questions').insert(formattedQuestions);
        if (error) throw error;
        toast.success(`Success! ${formattedQuestions.length} questions added from CSV.`);
        e.target.reset(); 
      } catch (err) { toast.error("Upload Failed! Error: " + err.message); } 
      finally { setUploadLoading(false); }
    };
    reader.readAsText(file); 
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      <div className="w-72 bg-[#287A74] text-white flex flex-col shadow-2xl z-10">
        <div className="p-8 text-2xl font-black border-b border-[#55A9A0]/30 text-center tracking-widest uppercase shadow-sm">
          Admin Pro
        </div>
        <nav className="flex-1 p-5 space-y-3 mt-6 overflow-y-auto">
          {['dashboard', 'manage-categories', 'manage-exams', 'add-questions', 'view-results'].map((tab) => (
            <button 
              key={tab} onClick={() => setActiveTab(tab)} 
              className={`w-full text-left px-5 py-4 rounded-xl font-bold transition-all duration-300 capitalize flex items-center space-x-3 ${activeTab === tab ? 'bg-[#55A9A0] shadow-lg translate-x-2' : 'hover:bg-[#55A9A0]/50 hover:translate-x-1'}`}
            >
              <span>{tab.replace('-', ' ')}</span>
            </button>
          ))}
        </nav>
        <div className="p-6 border-t border-[#55A9A0]/30">
          <button onClick={handleLogout} className="w-full bg-white/10 hover:bg-red-500 text-white font-bold py-3 rounded-xl transition-colors duration-300 backdrop-blur-sm">Logout</button>
        </div>
      </div>

      <div className="flex-1 p-10 overflow-y-auto bg-gray-50/50">
        
        {activeTab === 'dashboard' && (
          <div className="animate-fade-in">
            <h1 className="text-4xl font-extrabold text-[#287A74] mb-10">Overview Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden group">
                <h2 className="text-xl font-bold text-gray-500 relative z-10">Total Exams</h2>
                <p className="text-6xl font-black text-[#55A9A0] mt-4 relative z-10">{examsList.length}</p>
              </div>
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden group">
                <h2 className="text-xl font-bold text-gray-500 relative z-10">Total Student Results</h2>
                <p className="text-6xl font-black text-[#287A74] mt-4 relative z-10">{resultsList.length}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'manage-categories' && (
          <div className="animate-fade-in">
            <h1 className="text-4xl font-extrabold text-[#287A74] mb-8">Manage Categories</h1>
            <div className="bg-white p-10 rounded-3xl shadow-lg border border-gray-100 mb-10 max-w-2xl">
              <h2 className="text-2xl font-bold text-[#55A9A0] mb-6">Add New Category</h2>
              <form onSubmit={handleAddCategory} className="flex gap-4 mb-10">
                <input type="text" required placeholder="e.g. Model Test" className="flex-1 px-5 py-4 border-2 border-gray-200 rounded-xl focus:border-[#55A9A0] focus:ring-0 outline-none font-medium" value={newCategory} onChange={e => setNewCategory(e.target.value)} />
                <button type="submit" disabled={loading} className={`px-8 text-white font-bold rounded-xl shadow-md transition-all text-lg ${loading ? 'bg-gray-400' : 'bg-[#287A74] hover:bg-[#1f5c57]'}`}>Add</button>
              </form>
              <h2 className="text-xl font-bold text-gray-500 mb-4">Existing Categories:</h2>
              <div className="flex flex-wrap gap-4">
                {categoriesList.map((cat) => (
                  <div key={cat.id} className="bg-[#AEEED3]/30 text-[#287A74] px-5 py-3 rounded-xl font-black border border-[#55A9A0]/30 flex items-center space-x-3 group">
                    <span>{cat.name}</span>
                    <button onClick={() => handleDeleteCategory(cat.id)} className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

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
                
                <button type="submit" disabled={loading || categoriesList.length === 0} className={`w-full text-white font-bold py-4 rounded-xl shadow-md transition-all text-lg ${loading || categoriesList.length === 0 ? 'bg-gray-400' : 'bg-[#55A9A0] hover:bg-[#287A74]'}`}>
                  {categoriesList.length === 0 ? 'Please add a category first' : (loading ? 'Creating...' : 'Launch Exam')}
                </button>
              </form>
            </div>

            <h2 className="text-2xl font-extrabold text-gray-700 mb-6 px-2">Existing Exams</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
              {examsList.map(exam => (
                <div key={exam.id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 relative group hover:shadow-xl transition-all duration-300">
                  <span className="bg-[#AEEED3]/50 text-[#287A74] px-3 py-1 rounded-lg text-sm font-bold mb-3 inline-block">{exam.category}</span>
                  <span className={`ml-2 px-3 py-1 rounded-lg text-sm font-bold mb-3 inline-block ${exam.exam_type === 'previous' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>{exam.exam_type === 'previous' ? 'Previous' : 'Live'}</span>
                  <h3 className="text-xl font-black text-gray-800 mb-2 truncate" title={exam.title}>{exam.title}</h3>
                  <p className="text-gray-500 font-bold mb-1">Pass Mark: <span className="text-[#287A74]">{exam.pass_mark}</span></p>
                  <p className="text-gray-400 text-xs font-medium mt-3 bg-gray-50 p-2 rounded-lg">
                    Ends: {new Date(exam.end_time).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                  
                  <button 
                    onClick={() => handleDeleteExam(exam.id)} 
                    className="absolute top-6 right-6 text-red-200 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity bg-red-50 rounded-lg p-2"
                    title="Delete Exam"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              ))}
              {examsList.length === 0 && <p className="text-gray-500 font-bold col-span-3 ml-2">No exams created yet.</p>}
            </div>
          </div>
        )}

        {activeTab === 'add-questions' && (
          <div className="max-w-5xl animate-fade-in">
            <h1 className="text-4xl font-extrabold text-[#287A74] mb-8">Question Bank Setup</h1>
            <div className="bg-[#AEEED3]/30 p-8 rounded-3xl border border-[#55A9A0]/30 mb-10">
              <label className="block text-[#287A74] font-black text-xl mb-4">Step 1: Select Target Exam</label>
              <select required className="w-full px-6 py-4 border-2 border-white bg-white/70 rounded-xl focus:border-[#55A9A0] font-bold text-gray-700 outline-none" value={selectedExamId} onChange={e=>setSelectedExamId(e.target.value)}>
                <option value="" disabled>-- Select Exam from Dropdown --</option>
                {examsList.map(e => <option key={e.id} value={e.id}>{e.title} ({e.category})</option>)}
              </select>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100">
                <h2 className="text-2xl font-black text-[#55A9A0] mb-6">A. Manual Entry</h2>
                <form onSubmit={handleAddQuestion} className="space-y-5">
                  <textarea required rows="3" className="w-full px-5 py-3 border-2 border-gray-100 rounded-xl focus:border-[#55A9A0] outline-none" placeholder="Type question here..." value={questionText} onChange={e=>setQuestionText(e.target.value)}></textarea>
                  <div className="grid grid-cols-2 gap-4">
                    <input type="text" required className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl focus:border-[#55A9A0] outline-none" placeholder="Option 1" value={option1} onChange={e=>setOption1(e.target.value)} />
                    <input type="text" required className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl focus:border-[#55A9A0] outline-none" placeholder="Option 2" value={option2} onChange={e=>setOption2(e.target.value)} />
                    <input type="text" required className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl focus:border-[#55A9A0] outline-none" placeholder="Option 3" value={option3} onChange={e=>setOption3(e.target.value)} />
                    <input type="text" required className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl focus:border-[#55A9A0] outline-none" placeholder="Option 4" value={option4} onChange={e=>setOption4(e.target.value)} />
                  </div>
                  <select required className="w-full px-5 py-3 border-2 border-[#AEEED3] rounded-xl font-bold text-[#287A74] bg-[#AEEED3]/20 outline-none" value={correctAnswer} onChange={e=>setCorrectAnswer(e.target.value)}>
                    <option value="" disabled>Select Correct Answer</option>
                    <option value="1">Option 1</option><option value="2">Option 2</option><option value="3">Option 3</option><option value="4">Option 4</option>
                  </select>
                  <button type="submit" disabled={questionLoading} className={`w-full text-white font-bold py-4 rounded-xl shadow-md transition-all ${questionLoading ? 'bg-gray-400' : 'bg-[#55A9A0] hover:bg-[#287A74]'}`}>Save Question</button>
                </form>
              </div>

              <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100 flex flex-col">
                <h2 className="text-2xl font-black text-[#287A74] mb-2">B. Bulk Upload (.csv)</h2>
                <form onSubmit={handleCsvUpload} className="space-y-6 flex-1 flex flex-col justify-center mt-4">
                  <div className="border-4 border-dashed border-[#AEEED3] rounded-3xl p-10 text-center hover:bg-[#AEEED3]/10 transition cursor-pointer relative">
                    <input type="file" name="csvFile" accept=".csv" required className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                    <div className="text-[#55A9A0]">
                      <span className="font-bold text-lg">Click or Drop CSV file here</span>
                    </div>
                  </div>
                  <button type="submit" disabled={uploadLoading} className={`w-full text-white font-bold py-4 rounded-xl shadow-md transition-all text-lg ${uploadLoading ? 'bg-gray-400' : 'bg-[#287A74]'}`}>
                    {uploadLoading ? 'Uploading...' : 'Process Upload'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* View Results Tab - Updated to show Name instead of Number */}
        {activeTab === 'view-results' && (
          <div className="animate-fade-in">
            <h1 className="text-4xl font-extrabold text-[#287A74] mb-8">Performance Board</h1>
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#AEEED3]/50">
                  <tr>
                    {/* Student ID এর জায়গায় Student Name দেওয়া হলো */}
                    <th className="p-6 font-black text-[#287A74] uppercase text-sm">Student Name</th>
                    <th className="p-6 font-black text-[#287A74] uppercase text-sm">Exam Title</th>
                    <th className="p-6 font-black text-[#287A74] uppercase text-sm">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {resultsList.map((res) => (
                    <tr key={res.id} className="hover:bg-[#AEEED3]/10 transition-colors">
                      {/* res.user_phone এর বদলে res.student_name রেন্ডার করা হচ্ছে */}
                      <td className="p-6 font-extrabold text-gray-800">{res.student_name || 'Unknown'}</td>
                      <td className="p-6 text-[#55A9A0] font-bold">{res.exam_title}</td>
                      <td className="p-6 font-black text-[#287A74] text-xl">{res.score}</td>
                    </tr>
                  ))}
                  {resultsList.length === 0 && (<tr><td colSpan="3" className="p-12 text-center text-gray-400 font-bold">No examination records found.</td></tr>)}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
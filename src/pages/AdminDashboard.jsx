import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard'); 
  
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [examsList, setExamsList] = useState([]);
  const [resultsList, setResultsList] = useState([]);

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
  };

  useEffect(() => { fetchData(); }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/'); 
  };

  const handleCreateExam = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from('exams').insert([{ title, category, start_time: startTime, end_time: endTime }]);
    if (error) alert("Error: " + error.message);
    else { alert("Exam Created Successfully!"); setTitle(''); setCategory(''); setStartTime(''); setEndTime(''); fetchData(); }
    setLoading(false);
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    if (!selectedExamId) return alert("Select an exam first!");
    setQuestionLoading(true);
    const optionsObj = { 1: option1, 2: option2, 3: option3, 4: option4 };
    const { error } = await supabase.from('questions').insert([{ exam_id: selectedExamId, question_text: questionText, options: optionsObj, correct_answer: correctAnswer }]);
    if (error) alert("Error: " + error.message);
    else { alert("Question Added!"); setQuestionText(''); setOption1(''); setOption2(''); setOption3(''); setOption4(''); setCorrectAnswer(''); }
    setQuestionLoading(false);
  };

  const handleCsvUpload = async (e) => {
    e.preventDefault();
    if (!selectedExamId) return alert("Please select an exam first!");
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
          let valuesArr = [];
          let insideQuote = false;
          let currentValue = "";
          for (let char of lines[i]) {
            if (char === '"') insideQuote = !insideQuote;
            else if (char === ',' && !insideQuote) { valuesArr.push(currentValue.trim()); currentValue = ""; }
            else currentValue += char;
          }
          valuesArr.push(currentValue.trim());
          if(valuesArr.length < 6) continue; 
          
          const cleanText = (str) => str.replace(/^"|"$/g, '').trim();
          formattedQuestions.push({
            exam_id: selectedExamId,
            question_text: cleanText(valuesArr[0]),
            options: { 1: cleanText(valuesArr[1]), 2: cleanText(valuesArr[2]), 3: cleanText(valuesArr[3]), 4: cleanText(valuesArr[4]) },
            correct_answer: cleanText(valuesArr[5])
          });
        }
        if (formattedQuestions.length === 0) throw new Error("No valid questions found.");
        setUploadLoading(true);
        const { error } = await supabase.from('questions').insert(formattedQuestions);
        if (error) throw error;
        alert(`Success! ${formattedQuestions.length} questions added from Excel/CSV.`);
        e.target.reset(); 
      } catch (err) {
        alert("Upload Failed! Error: " + err.message);
      } finally { setUploadLoading(false); }
    };
    reader.readAsText(file); 
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      
      {/* Premium Sidebar */}
      <div className="w-72 bg-[#287A74] text-white flex flex-col shadow-2xl z-10">
        <div className="p-8 text-2xl font-black border-b border-[#55A9A0]/30 text-center tracking-widest uppercase shadow-sm">
          Admin Pro
        </div>
        <nav className="flex-1 p-5 space-y-3 mt-6">
          {['dashboard', 'manage-exams', 'add-questions', 'view-results'].map((tab) => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)} 
              className={`w-full text-left px-5 py-4 rounded-xl font-bold transition-all duration-300 capitalize flex items-center space-x-3 ${activeTab === tab ? 'bg-[#55A9A0] shadow-lg translate-x-2' : 'hover:bg-[#55A9A0]/50 hover:translate-x-1'}`}
            >
              <span>{tab.replace('-', ' ')}</span>
            </button>
          ))}
        </nav>
        <div className="p-6 border-t border-[#55A9A0]/30">
          <button onClick={handleLogout} className="w-full bg-white/10 hover:bg-red-500 text-white font-bold py-3 rounded-xl transition-colors duration-300 backdrop-blur-sm">
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-10 overflow-y-auto bg-gray-50/50">
        
        {activeTab === 'dashboard' && (
          <div className="animate-fade-in">
            <h1 className="text-4xl font-extrabold text-[#287A74] mb-10">Overview Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl transition-shadow duration-300 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#AEEED3]/30 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
                <h2 className="text-xl font-bold text-gray-500 relative z-10">Total Exams Created</h2>
                <p className="text-6xl font-black text-[#55A9A0] mt-4 relative z-10">{examsList.length}</p>
              </div>
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl transition-shadow duration-300 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#AEEED3]/30 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
                <h2 className="text-xl font-bold text-gray-500 relative z-10">Total Student Results</h2>
                <p className="text-6xl font-black text-[#287A74] mt-4 relative z-10">{resultsList.length}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'manage-exams' && (
          <div className="animate-fade-in">
             <h1 className="text-4xl font-extrabold text-[#287A74] mb-8">Manage Exams</h1>
             <div className="bg-white p-10 rounded-3xl shadow-lg border border-gray-100 mb-10 max-w-3xl">
              <h2 className="text-2xl font-bold text-[#55A9A0] mb-6">Create New Exam</h2>
              <form onSubmit={handleCreateExam} className="space-y-8">
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <label className="block mb-2 font-bold text-gray-600">Exam Title</label>
                    <input type="text" required className="w-full px-5 py-3 border-2 border-gray-200 rounded-xl focus:border-[#55A9A0] focus:ring-0 outline-none transition" value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. Mid Term Exam" />
                  </div>
                  <div>
                    <label className="block mb-2 font-bold text-gray-600">Category</label>
                    <select required className="w-full px-5 py-3 border-2 border-gray-200 rounded-xl focus:border-[#55A9A0] focus:ring-0 outline-none transition" value={category} onChange={e=>setCategory(e.target.value)}>
                      <option value="" disabled>Select Category</option><option value="Admission">Admission</option><option value="BCS">BCS</option><option value="HSC">HSC</option><option value="Others">Others</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-8">
                  <div><label className="block mb-2 font-bold text-gray-600">Start Time</label><input type="datetime-local" required className="w-full px-5 py-3 border-2 border-gray-200 rounded-xl focus:border-[#55A9A0] outline-none" value={startTime} onChange={e=>setStartTime(e.target.value)} /></div>
                  <div><label className="block mb-2 font-bold text-gray-600">End Time</label><input type="datetime-local" required className="w-full px-5 py-3 border-2 border-gray-200 rounded-xl focus:border-[#55A9A0] outline-none" value={endTime} onChange={e=>setEndTime(e.target.value)} /></div>
                </div>
                <button type="submit" disabled={loading} className={`w-full text-white font-bold py-4 rounded-xl shadow-md transition-all duration-300 text-lg ${loading ? 'bg-gray-400' : 'bg-[#55A9A0] hover:bg-[#287A74] hover:shadow-xl'}`}>
                  {loading ? 'Creating...' : 'Launch Exam'}
                </button>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'add-questions' && (
          <div className="max-w-5xl animate-fade-in">
            <h1 className="text-4xl font-extrabold text-[#287A74] mb-8">Question Bank Setup</h1>
            
            <div className="bg-[#AEEED3]/30 p-8 rounded-3xl border border-[#55A9A0]/30 mb-10 shadow-sm">
              <label className="block text-[#287A74] font-black text-xl mb-4">Step 1: Select Target Exam</label>
              <select required className="w-full px-6 py-4 border-2 border-white bg-white/70 rounded-xl focus:border-[#55A9A0] font-bold text-gray-700 outline-none shadow-sm" value={selectedExamId} onChange={e=>setSelectedExamId(e.target.value)}>
                <option value="" disabled>-- Select Exam from Dropdown --</option>
                {examsList.map(e => <option key={e.id} value={e.id}>{e.title} ({e.category})</option>)}
              </select>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Single Upload */}
              <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100 hover:border-[#AEEED3] transition-colors">
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
                    <option value="1">Option 1 is correct</option><option value="2">Option 2 is correct</option><option value="3">Option 3 is correct</option><option value="4">Option 4 is correct</option>
                  </select>
                  <button type="submit" disabled={questionLoading} className={`w-full text-white font-bold py-4 rounded-xl shadow-md transition-all ${questionLoading ? 'bg-gray-400' : 'bg-[#55A9A0] hover:bg-[#287A74]'}`}>Save Question</button>
                </form>
              </div>

              {/* Bulk Upload */}
              <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100 hover:border-[#55A9A0] transition-colors flex flex-col">
                <h2 className="text-2xl font-black text-[#287A74] mb-2">B. Bulk Upload (.csv)</h2>
                <p className="text-gray-500 mb-8 font-medium">Upload Excel CSV file for faster data entry.</p>
                <form onSubmit={handleCsvUpload} className="space-y-6 flex-1 flex flex-col justify-center">
                  <div className="border-4 border-dashed border-[#AEEED3] rounded-3xl p-10 text-center hover:bg-[#AEEED3]/10 transition cursor-pointer group relative">
                    <input type="file" name="csvFile" accept=".csv" required className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                    <div className="text-[#55A9A0] group-hover:text-[#287A74] transition-colors">
                      <svg className="mx-auto h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                      <span className="font-bold text-lg">Click or Drop CSV file here</span>
                    </div>
                  </div>
                  <button type="submit" disabled={uploadLoading} className={`w-full text-white font-bold py-4 rounded-xl shadow-md transition-all text-lg ${uploadLoading ? 'bg-gray-400' : 'bg-[#287A74] hover:bg-[#1f5c57]'}`}>
                    {uploadLoading ? 'Uploading...' : 'Process Upload'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'view-results' && (
          <div className="animate-fade-in">
            <h1 className="text-4xl font-extrabold text-[#287A74] mb-8">Performance Board</h1>
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#AEEED3]/50">
                  <tr>
                    <th className="p-6 font-black text-[#287A74] tracking-wider uppercase text-sm">Student ID</th>
                    <th className="p-6 font-black text-[#287A74] tracking-wider uppercase text-sm">Exam Title</th>
                    <th className="p-6 font-black text-[#287A74] tracking-wider uppercase text-sm">Score</th>
                    <th className="p-6 font-black text-[#287A74] tracking-wider uppercase text-sm">Date & Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {resultsList.map((res) => (
                    <tr key={res.id} className="hover:bg-[#AEEED3]/10 transition-colors">
                      <td className="p-6 font-extrabold text-gray-800">{res.user_phone || 'Unknown'}</td>
                      <td className="p-6 text-[#55A9A0] font-bold">{res.exam_title}</td>
                      <td className="p-6 font-black text-[#287A74] text-xl bg-[#AEEED3]/20 w-32 text-center rounded-lg m-2 inline-block shadow-inner">{res.score}</td>
                      <td className="p-6 text-gray-500 font-medium">{new Date(res.created_at).toLocaleString('en-US')}</td>
                    </tr>
                  ))}
                  {resultsList.length === 0 && (<tr><td colSpan="4" className="p-12 text-center text-gray-400 font-bold text-lg">No examination records found.</td></tr>)}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
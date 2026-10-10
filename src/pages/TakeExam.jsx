import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function TakeExam() {
  const { id } = useParams(); 
  const navigate = useNavigate();
  
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  const [timeLeft, setTimeLeft] = useState(20 * 60);

  useEffect(() => {
    const fetchQuestions = async () => {
      const { data } = await supabase.from('questions').select('*').eq('exam_id', id);
      if (data) setQuestions(data);
      setLoading(false);
    };
    fetchQuestions();
  }, [id]);

  useEffect(() => {
    if (loading || submitted) return;
    if (timeLeft <= 0) { handleSubmit(); return; }
    const timerId = setInterval(() => { setTimeLeft((prev) => prev - 1); }, 1000);
    return () => clearInterval(timerId); 
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, loading, submitted]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleOptionChange = (questionId, selectedOption) => {
    setAnswers({ ...answers, [questionId]: selectedOption });
  };

  const handleSubmit = async () => {
    if (submitted) return; 
    const { data: { user } } = await supabase.auth.getUser();
    const userPhone = user.email ? user.email.replace('@exam.com', '') : 'Unknown';
    
    let totalScore = 0;
    questions.forEach((q) => { if (answers[q.id] === q.correct_answer) totalScore += 1; });

    setScore(totalScore);
    setSubmitted(true);
    await supabase.from('exam_attempts').insert([{ exam_id: id, user_id: user.id, score: totalScore, user_phone: userPhone }]);
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#55A9A0]"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 font-sans selection:bg-[#AEEED3] selection:text-[#287A74] pb-20">
      
      {/* Sticky Header with Timer */}
      {!submitted && (
        <div className="bg-white shadow-md sticky top-0 z-50 border-b-4 border-[#287A74]">
          <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
            <h1 className="text-xl md:text-2xl font-black text-[#287A74]">Online Examination</h1>
            <div className={`text-xl md:text-2xl font-black px-6 py-2 rounded-xl border-2 shadow-inner transition-colors duration-500 ${timeLeft < 120 ? 'text-red-600 border-red-300 bg-red-50 animate-pulse' : 'text-[#287A74] border-[#AEEED3] bg-[#AEEED3]/30'}`}>
              ⏱ {formatTime(timeLeft)}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 mt-10">
        
        {submitted ? (
          <div className="bg-white p-12 rounded-[2.5rem] shadow-xl text-center border border-gray-100 relative overflow-hidden mt-10">
            <div className="w-24 h-24 bg-[#AEEED3] rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
               <svg className="w-12 h-12 text-[#287A74]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
            </div>
            <h1 className="text-5xl font-black text-[#287A74] mb-4">Exam Completed!</h1>
            <p className="text-gray-500 font-medium text-lg mb-8">Your exam has been successfully submitted.</p>
            
            <div className="bg-gray-50 border-2 border-dashed border-[#55A9A0] rounded-3xl py-8 px-10 inline-block mb-10 shadow-sm">
              <p className="text-xl text-gray-600 font-bold mb-2">Total Score</p>
              <p className="text-6xl font-black text-[#287A74]">
                {score} <span className="text-3xl text-gray-400">/ {questions.length}</span>
              </p>
            </div>
            
            <div>
              <button onClick={() => navigate('/user-dashboard')} className="bg-[#55A9A0] hover:bg-[#287A74] text-white font-bold py-4 px-10 rounded-2xl shadow-lg transition-all duration-300 transform hover:-translate-y-1 text-lg">
                Back to Dashboard
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex justify-end mb-6">
              <button onClick={() => navigate('/user-dashboard')} className="text-gray-500 font-bold hover:text-red-500 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                <span>Cancel Exam</span>
              </button>
            </div>
            
            {questions.length === 0 ? (
              <div className="bg-white p-12 text-center rounded-3xl shadow-sm border border-gray-100">
                <p className="text-xl font-bold text-gray-400">No questions added yet.</p>
              </div>
            ) : (
              <div className="space-y-8">
                {questions.map((q, index) => (
                  <div key={q.id} className="bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-gray-100 hover:shadow-lg transition-shadow duration-300">
                    <div className="flex items-start space-x-4 mb-6">
                      <div className="flex-shrink-0 w-10 h-10 bg-[#AEEED3]/50 text-[#287A74] font-black rounded-xl flex items-center justify-center text-lg">
                        {index + 1}
                      </div>
                      <h3 className="text-xl md:text-2xl font-bold text-gray-800 leading-snug pt-1">
                        {q.question_text}
                      </h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                      {Object.entries(q.options).map(([key, value]) => {
                        const isSelected = answers[q.id] === key;
                        return (
                          <label 
                            key={key} 
                            className={`flex items-center space-x-4 p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${
                              isSelected 
                                ? 'border-[#55A9A0] bg-[#AEEED3]/10 shadow-sm' 
                                : 'border-gray-100 bg-gray-50 hover:border-[#AEEED3] hover:bg-white'
                            }`}
                          >
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-[#287A74]' : 'border-gray-300'}`}>
                              {isSelected && <div className="w-3 h-3 bg-[#287A74] rounded-full"></div>}
                            </div>
                            
                            <input 
                              type="radio" name={`question-${q.id}`} value={key} 
                              onChange={(e) => handleOptionChange(q.id, e.target.value)} 
                              className="hidden" 
                            />
                            <span className={`font-medium text-lg ${isSelected ? 'text-[#287A74] font-bold' : 'text-gray-600'}`}>
                              {value}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
                
                <div className="pt-8">
                  <button onClick={handleSubmit} className="w-full bg-[#287A74] hover:bg-[#1f5c57] text-white font-black py-5 rounded-2xl text-xl transition-all duration-300 shadow-xl transform hover:-translate-y-1 flex items-center justify-center space-x-3">
                    <span>Submit Exam</span>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
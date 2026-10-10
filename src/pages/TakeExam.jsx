import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function TakeExam() {
  const { id } = useParams(); 
  const navigate = useNavigate();
  
  const [questions, setQuestions] = useState([]);
  const [examDetails, setExamDetails] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [userPhone, setUserPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // নতুন স্টেটগুলো (টাইম এবং এটেম্পট চেক করার জন্য)
  const [examStatus, setExamStatus] = useState(''); // 'upcoming', 'active', 'ended', 'blocked'
  const [attemptsCount, setAttemptsCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const fetchExamData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return navigate('/');
      
      const phone = session.user.email.split('@')[0];
      setUserPhone(phone);

      // ১. এক্সামের ডিটেইলস ফেচ করা
      const { data: examData } = await supabase.from('exams').select('*').eq('id', id).single();
      if (!examData) {
        alert("Exam not found!");
        return navigate('/user-dashboard');
      }
      setExamDetails(examData);

      // ২. ইউজারের আগের এটেম্পট (কয়বার পরীক্ষা দিয়েছে) চেক করা
      const { data: attempts } = await supabase.from('exam_attempts').select('*').eq('exam_id', id).eq('user_phone', phone);
      const currentAttempts = attempts ? attempts.length : 0;
      setAttemptsCount(currentAttempts);

      // যদি ২ বার বা তার বেশি পরীক্ষা দেওয়া হয়ে থাকে, তবে ব্লক করে দেবে
      if (currentAttempts >= 2) {
        setExamStatus('blocked');
        setLoading(false);
        return;
      }

      // ৩. লাইভ টাইম ভ্যালিডেশন
      const now = new Date().getTime();
      const startTime = new Date(examData.start_time).getTime();
      const endTime = new Date(examData.end_time).getTime();

      if (now < startTime) {
        setExamStatus('upcoming');
      } else if (now > endTime) {
        setExamStatus('ended');
      } else {
        setExamStatus('active');
        // শুধুমাত্র সময় ঠিক থাকলে প্রশ্নগুলো আনবে
        const { data: qData } = await supabase.from('questions').select('*').eq('exam_id', id);
        setQuestions(qData || []);
      }
      
      setLoading(false);
    };

    fetchExamData();
  }, [id, navigate]);

  // লাইভ টাইমার (Countdown) চালানোর ইফেক্ট
  useEffect(() => {
    if (examStatus !== 'active' || !examDetails) return;

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const end = new Date(examDetails.end_time).getTime();
      const distance = end - now;

      if (distance <= 0) {
        clearInterval(timer);
        setExamStatus('time_up'); // সময় শেষ হলে অটো সাবমিট ট্রিগার করবে
      } else {
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        setTimeLeft(`${hours > 0 ? hours + 'h ' : ''}${minutes}m ${seconds}s`);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [examStatus, examDetails]);

  // সময় শেষ হলে অটোমেটিক খাতা জমা নেওয়ার লজিক
  useEffect(() => {
    if (examStatus === 'time_up') {
      alert("Time is up! Submitting your exam automatically.");
      handleSubmitExam(true);
    }
  }, [examStatus]);

  const handleOptionSelect = (questionId, optionKey) => {
    setAnswers({ ...answers, [questionId]: optionKey });
  };

  const handleSubmitExam = async (isAutoSubmit = false) => {
    if (!isAutoSubmit && !window.confirm("Are you sure you want to submit the exam?")) return;
    setSubmitting(true);
    
    let score = 0;
    questions.forEach(q => {
      if (answers[q.id] === q.correct_answer) {
        score += 1;
      }
    });

    const { error } = await supabase.from('exam_attempts').insert([{
      user_phone: userPhone,
      exam_id: id,
      score: score
    }]);

    setSubmitting(false);

    if (error) {
      alert("Error submitting exam: " + error.message);
    } else {
      alert(`Exam submitted successfully! You got ${score} marks.`);
      navigate('/user-dashboard');
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-[#287A74] text-xl">Loading Exam...</div>;

  // ব্লক স্ক্রিন (২ বার পরীক্ষা দেওয়া শেষ)
  if (examStatus === 'blocked') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-10 rounded-3xl shadow-xl text-center max-w-lg w-full border-t-4 border-red-500">
          <div className="text-red-500 mb-4"><svg className="w-20 h-20 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg></div>
          <h2 className="text-3xl font-black text-gray-800 mb-2">Attempt Limit Reached!</h2>
          <p className="text-gray-500 font-medium mb-6">You have already taken this exam 2 times (Maximum limit). You cannot take it again.</p>
          <button onClick={() => navigate('/user-dashboard')} className="bg-[#287A74] text-white px-8 py-3 rounded-xl font-bold w-full">Back to Dashboard</button>
        </div>
      </div>
    );
  }

  // আপকামিং স্ক্রিন (এখনো শুরু হয়নি)
  if (examStatus === 'upcoming') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-10 rounded-3xl shadow-xl text-center max-w-lg w-full border-t-4 border-[#55A9A0]">
          <h2 className="text-3xl font-black text-gray-800 mb-2">Exam Not Started Yet</h2>
          <p className="text-gray-500 font-medium mb-4">This exam is scheduled to start at:</p>
          <div className="bg-[#AEEED3]/30 text-[#287A74] font-black text-xl py-4 rounded-xl mb-6">
            {new Date(examDetails.start_time).toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}
          </div>
          <button onClick={() => navigate('/user-dashboard')} className="bg-[#287A74] text-white px-8 py-3 rounded-xl font-bold w-full">Go Back</button>
        </div>
      </div>
    );
  }

  // এন্ড স্ক্রিন (সময় পার হয়ে গেছে)
  if (examStatus === 'ended') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-10 rounded-3xl shadow-xl text-center max-w-lg w-full border-t-4 border-gray-400">
          <h2 className="text-3xl font-black text-gray-800 mb-2">Exam Has Ended</h2>
          <p className="text-gray-500 font-medium mb-6">The time window for this examination is over.</p>
          <button onClick={() => navigate('/user-dashboard')} className="bg-gray-600 hover:bg-gray-700 text-white px-8 py-3 rounded-xl font-bold w-full">Back to Dashboard</button>
        </div>
      </div>
    );
  }

  // অ্যাক্টিভ স্ক্রিন (পরীক্ষা চলছে)
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans pb-10">
      {/* Exam Header with Live Timer */}
      <div className="bg-[#287A74] text-white p-6 shadow-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-black">{examDetails?.title || 'Examination'}</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="bg-white/20 text-white px-3 py-1 rounded-lg text-sm font-bold">{examDetails?.category || ''}</span>
              <span className="text-[#AEEED3] font-bold text-sm">Attempt: {attemptsCount + 1}/2</span>
            </div>
          </div>
          
          <div className="flex items-center bg-white/10 px-6 py-3 rounded-2xl border border-white/20 backdrop-blur-sm">
            <svg className="w-6 h-6 text-[#AEEED3] mr-2 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span className="font-black text-xl tracking-wider">{timeLeft}</span>
          </div>
        </div>
      </div>

      {/* Questions Area */}
      <div className="max-w-4xl mx-auto w-full px-4 mt-8 space-y-8">
        {questions.length === 0 ? (
          <div className="bg-white p-10 rounded-3xl shadow-sm text-center border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-500">No questions available for this exam yet.</h2>
          </div>
        ) : (
          questions.map((q, index) => (
            <div key={q.id} className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
              <h3 className="text-xl font-bold text-gray-800 mb-6"><span className="text-[#55A9A0] mr-2">{index + 1}.</span> {q.question_text}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(q.options).map(([key, value]) => (
                  <button
                    key={key}
                    onClick={() => handleOptionSelect(q.id, key)}
                    className={`p-4 text-left rounded-xl border-2 font-medium transition-all duration-300 ${answers[q.id] === key ? 'border-[#287A74] bg-[#AEEED3]/30 text-[#287A74] font-bold shadow-md' : 'border-gray-100 hover:border-[#55A9A0] hover:bg-gray-50 text-gray-600'}`}
                  >
                    <span className="mr-3 font-bold bg-white px-2 py-1 rounded shadow-sm text-gray-500">{['A', 'B', 'C', 'D'][key - 1]}</span>
                    {value}
                  </button>
                ))}
              </div>
            </div>
          ))
        )}

        {questions.length > 0 && (
          <div className="text-center pt-6">
            <button onClick={() => handleSubmitExam(false)} disabled={submitting} className={`px-12 py-4 text-white font-black rounded-2xl shadow-lg transition-all text-xl ${submitting ? 'bg-gray-400' : 'bg-[#287A74] hover:bg-[#1f5c57] hover:shadow-xl transform hover:-translate-y-1'}`}>
              {submitting ? 'Submitting...' : 'Submit Exam'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
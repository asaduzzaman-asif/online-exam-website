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
  const [examStatus, setExamStatus] = useState(''); 
  const [attemptsCount, setAttemptsCount] = useState(0);
  const [maxAllowed, setMaxAllowed] = useState(1);
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const fetchExamData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return navigate('/');
      const phone = session.user.email.split('@')[0];
      setUserPhone(phone);

      const { data: examData } = await supabase.from('exams').select('*').eq('id', id).single();
      if (!examData) return navigate('/user-dashboard');
      
      setExamDetails(examData);

      // টাইপ অনুযায়ী লিমিট সেট করা (Live = 1, Previous = 2)
      const allowedAttempts = examData.exam_type === 'previous' ? 2 : 1;
      setMaxAllowed(allowedAttempts);

      const { data: attempts } = await supabase.from('exam_attempts').select('*').eq('exam_id', id).eq('user_phone', phone);
      const currentAttempts = attempts ? attempts.length : 0;
      setAttemptsCount(currentAttempts);

      // লিমিট ক্রস করলে ব্লক
      if (currentAttempts >= allowedAttempts) {
        setExamStatus('blocked');
        setLoading(false);
        return;
      }

      // টাইম চেক
      const now = new Date().getTime();
      const startTime = new Date(examData.start_time).getTime();
      const endTime = new Date(examData.end_time).getTime();

      if (now < startTime) setExamStatus('upcoming');
      else if (now > endTime) setExamStatus('ended');
      else {
        setExamStatus('active');
        const { data: qData } = await supabase.from('questions').select('*').eq('exam_id', id);
        setQuestions(qData || []);
      }
      setLoading(false);
    };
    fetchExamData();
  }, [id, navigate]);

  // টাইমার (আগের মতোই থাকবে)
  useEffect(() => {
    if (examStatus !== 'active' || !examDetails) return;
    const timer = setInterval(() => {
      const distance = new Date(examDetails.end_time).getTime() - new Date().getTime();
      if (distance <= 0) {
        clearInterval(timer); setExamStatus('time_up');
      } else {
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        setTimeLeft(`${hours > 0 ? hours + 'h ' : ''}${minutes}m ${seconds}s`);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [examStatus, examDetails]);

  useEffect(() => {
    if (examStatus === 'time_up') { alert("Time is up!"); handleSubmitExam(true); }
  }, [examStatus]);

  const handleOptionSelect = (qId, optKey) => setAnswers({ ...answers, [qId]: optKey });

  const handleSubmitExam = async (isAuto = false) => {
    if (!isAuto && !window.confirm("Submit the exam?")) return;
    setSubmitting(true);
    let score = 0;
    questions.forEach(q => { if (answers[q.id] === q.correct_answer) score += 1; });
    await supabase.from('exam_attempts').insert([{ user_phone: userPhone, exam_id: id, score: score }]);
    alert(`Exam submitted! You got ${score} marks.`);
    navigate('/user-dashboard');
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-[#287A74] text-xl">Loading...</div>;

  if (examStatus === 'blocked') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-10 rounded-3xl shadow-xl text-center border-t-4 border-red-500">
          <h2 className="text-3xl font-black text-gray-800 mb-2">Limit Reached!</h2>
          <p className="text-gray-500 font-medium mb-6">You have reached the maximum allowed attempts ({maxAllowed}) for this exam.</p>
          <button onClick={() => navigate('/user-dashboard')} className="bg-[#287A74] text-white px-8 py-3 rounded-xl font-bold w-full">Back to Dashboard</button>
        </div>
      </div>
    );
  }

  // Active Screen
  if (examStatus === 'active') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col font-sans pb-10">
        <div className="bg-[#287A74] text-white p-6 shadow-md sticky top-0 z-50">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <h1 className="text-2xl font-black">{examDetails?.title}</h1>
              <span className="text-[#AEEED3] font-bold text-sm">Attempt: {attemptsCount + 1} of {maxAllowed}</span>
            </div>
            <div className="flex items-center bg-white/10 px-6 py-3 rounded-2xl">
              <span className="font-black text-xl tracking-wider">{timeLeft}</span>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto w-full px-4 mt-8 space-y-8">
          {questions.map((q, i) => (
            <div key={q.id} className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
              <h3 className="text-xl font-bold text-gray-800 mb-6">{i + 1}. {q.question_text}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(q.options).map(([key, val]) => (
                  <button key={key} onClick={() => handleOptionSelect(q.id, key)} className={`p-4 text-left rounded-xl border-2 font-medium ${answers[q.id] === key ? 'border-[#287A74] bg-[#AEEED3]/30 text-[#287A74]' : 'border-gray-100'}`}>
                    {val}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <div className="text-center pt-6">
            <button onClick={() => handleSubmitExam(false)} disabled={submitting} className={`px-12 py-4 text-white font-black rounded-2xl shadow-lg ${submitting ? 'bg-gray-400' : 'bg-[#287A74]'}`}>Submit Exam</button>
          </div>
        </div>
      </div>
    );
  }

  return <div className="text-center mt-20 text-xl font-bold">Exam is either Upcoming or Ended.</div>;
}
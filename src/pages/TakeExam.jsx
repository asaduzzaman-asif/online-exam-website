import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Swal from 'sweetalert2'; 

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
  const [timerTarget, setTimerTarget] = useState(null);
  const [isPracticeMode, setIsPracticeMode] = useState(false);

  useEffect(() => {
    const fetchExamData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return navigate('/');
      const phone = session.user.email.split('@')[0];
      setUserPhone(phone);

      const { data: examData } = await supabase.from('exams').select('*').eq('id', id).single();
      if (!examData) return navigate('/user-dashboard');
      
      setExamDetails(examData);

      const now = new Date().getTime();
      const startTime = new Date(examData.start_time).getTime();
      const endTime = new Date(examData.end_time).getTime();
      
      const isLive = now <= endTime;
      setIsPracticeMode(!isLive);
      
      const allowedAttempts = isLive ? 1 : 2;
      setMaxAllowed(allowedAttempts);

      const { data: attempts } = await supabase.from('exam_attempts').select('*').eq('exam_id', id).eq('user_phone', phone);
      const currentAttempts = attempts ? attempts.length : 0;
      setAttemptsCount(currentAttempts);

      if (currentAttempts >= allowedAttempts) {
        setExamStatus('blocked');
        setLoading(false);
        return;
      }

      if (now < startTime) {
        setExamStatus('upcoming');
      } else {
        setExamStatus('active');
        
        if (isLive) {
          setTimerTarget(endTime);
        } else {
          const durationInMs = endTime - startTime;
          setTimerTarget(now + durationInMs); 
        }

        const { data: qData } = await supabase.from('questions').select('*').eq('exam_id', id);
        setQuestions(qData || []);
      }
      setLoading(false);
    };
    fetchExamData();
  }, [id, navigate]);

  useEffect(() => {
    if (examStatus !== 'active' || !timerTarget) return;
    const timer = setInterval(() => {
      const distance = timerTarget - new Date().getTime();
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
  }, [examStatus, timerTarget]);

  useEffect(() => {
    if (examStatus === 'time_up') { 
      Swal.fire({
        title: 'Time is Up!',
        text: 'Your exam is being automatically submitted.',
        icon: 'warning',
        confirmButtonColor: '#287A74',
        allowOutsideClick: false
      }).then(() => {
        handleSubmitExam(true);
      });
    }
  }, [examStatus]);

  const handleOptionSelect = (qId, optKey) => setAnswers({ ...answers, [qId]: optKey });

  const handleSubmitExam = async (isAuto = false) => {
    if (!isAuto) {
      const result = await Swal.fire({
        title: 'Are you sure?',
        text: "Do you want to submit your answers?",
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#287A74',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, Submit!'
      });
      if (!result.isConfirmed) return; 
    }
    
    setSubmitting(true);
    let score = 0;
    questions.forEach(q => { if (answers[q.id] === q.correct_answer) score += 1; });
    
    // নতুন আপডেট: user_answers কলামে answers অবজেক্টটি সেভ করা হচ্ছে
    const { error } = await supabase.from('exam_attempts').insert([{ 
      user_phone: userPhone, 
      exam_id: id, 
      score: score,
      user_answers: answers 
    }]);
    
    if (error) {
      Swal.fire('Error!', error.message, 'error');
      setSubmitting(false);
    } else {
      await Swal.fire({
        title: 'Exam Submitted!',
        text: `You have successfully completed the exam. You got ${score} marks.`,
        icon: 'success',
        confirmButtonColor: '#287A74'
      });
      navigate('/user-dashboard', { state: { tab: 'results' } });
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-[#287A74] text-xl">Loading...</div>;

  if (examStatus === 'blocked') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-10 rounded-3xl shadow-xl text-center border-t-4 border-red-500 max-w-md w-full">
          <h2 className="text-3xl font-black text-gray-800 mb-2">Limit Reached!</h2>
          <p className="text-gray-500 font-medium mb-6">You have reached the maximum allowed attempts ({maxAllowed}) for this exam.</p>
          <button onClick={() => navigate('/user-dashboard')} className="bg-[#287A74] text-white px-8 py-3 rounded-xl font-bold w-full">Back to Dashboard</button>
        </div>
      </div>
    );
  }

  if (examStatus === 'upcoming') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-10 rounded-3xl shadow-xl text-center border-t-4 border-[#55A9A0] max-w-md w-full">
          <h2 className="text-3xl font-black text-gray-800 mb-2">Not Started Yet</h2>
          <p className="text-gray-500 font-medium mb-6">This exam will start on {new Date(examDetails.start_time).toLocaleString()}</p>
          <button onClick={() => navigate('/user-dashboard')} className="bg-[#287A74] text-white px-8 py-3 rounded-xl font-bold w-full">Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans pb-10">
      <div className={`text-white p-6 shadow-md sticky top-0 z-50 ${isPracticeMode ? 'bg-orange-500' : 'bg-[#287A74]'}`}>
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="bg-white/20 text-white px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider">{isPracticeMode ? 'Practice Mode' : 'Live Mode'}</span>
            </div>
            <h1 className="text-2xl font-black">{examDetails?.title}</h1>
            <span className="text-white/80 font-bold text-sm">Attempt: {attemptsCount + 1} of {maxAllowed}</span>
          </div>
          <div className="flex items-center bg-white/10 px-6 py-3 rounded-2xl border border-white/20">
            <span className="font-black text-xl tracking-wider">{timeLeft}</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto w-full px-4 mt-8 space-y-8">
        {questions.map((q, i) => (
          <div key={q.id} className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold text-gray-800 mb-6"><span className={isPracticeMode ? 'text-orange-500 mr-2' : 'text-[#55A9A0] mr-2'}>{i + 1}.</span> {q.question_text}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(q.options).map(([key, val]) => {
                const isSelected = answers[q.id] === key;
                return (
                  <button key={key} onClick={() => handleOptionSelect(q.id, key)} 
                    className={`p-4 text-left rounded-xl border-2 font-medium transition-all duration-300 ${isSelected ? (isPracticeMode ? 'border-orange-500 bg-orange-50 text-orange-700 font-bold' : 'border-[#287A74] bg-[#AEEED3]/30 text-[#287A74] font-bold') : 'border-gray-100 text-gray-600'}`}>
                    <span className="mr-3 font-bold bg-white px-2 py-1 rounded shadow-sm text-gray-400">{['A', 'B', 'C', 'D'][key - 1]}</span>{val}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
        {questions.length > 0 && (
          <div className="text-center pt-6">
            <button onClick={() => handleSubmitExam(false)} disabled={submitting} className={`px-12 py-4 text-white font-black rounded-2xl shadow-lg transition-all text-xl ${submitting ? 'bg-gray-400' : (isPracticeMode ? 'bg-orange-500 hover:bg-orange-600' : 'bg-[#287A74] hover:bg-[#1f5c57]')}`}>
              {submitting ? 'Submitting...' : 'Submit Exam'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
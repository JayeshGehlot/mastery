import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { initModel, predictNextDifficulty } from '../services/mlService';
import { fetchRecommendedTasks, submitTaskScore, getResources, getMessages, sendMessage } from '../services/mockDatabase';
import { generateAdaptiveQuiz } from '../services/aiService';
import { Task, ClassResource, ChatMessage, UserRole, QuizQuestion } from '../types';
import { Activity, BookOpen, TrendingUp, Cpu, Key, FileText, MessageSquare, Send, CheckCircle, BrainCircuit, X, Download, Lightbulb, Award, LogOut, Grid, Plus } from 'lucide-react';
import { BarChart, Bar, XAxis, Cell, ResponsiveContainer, Tooltip as RechartTooltip } from 'recharts';

const StudentDashboard: React.FC = () => {
  const { user, updateUser, joinClassroom, selectClass, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'path' | 'resources' | 'chat'>('path');
  
  // Adaptive Learning State
  const [predictedDiff, setPredictedDiff] = useState<number>(0);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completing, setCompleting] = useState<string | null>(null); // Task ID being processed
  const [feedback, setFeedback] = useState<{score: number, mastery: number} | null>(null);

  // Quiz State
  const [activeQuiz, setActiveQuiz] = useState<QuizQuestion[] | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [activeTaskTitle, setActiveTaskTitle] = useState('');

  // Classroom State (Join Code Input)
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [resources, setResources] = useState<ClassResource[]>([]);
  
  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [msgInput, setMsgInput] = useState('');

  // Initial Load - Only runs when specific class is selected
  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      if (!user.classCode) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      
      // Load ML Model
      await initModel();
      const difficulty = await predictNextDifficulty(user.recentScores);
      setPredictedDiff(difficulty);

      const recTasks = await fetchRecommendedTasks(difficulty);
      setTasks(recTasks);

      const res = await getResources();
      setResources(res);

      const msgs = await getMessages();
      setMessages(msgs);

      setLoading(false);
    };

    loadData();

    // Event listeners for real-time updates
    const handleChatUpdate = async () => setMessages(await getMessages());
    const handleResUpdate = async () => setResources(await getResources());
    
    window.addEventListener('chat_update', handleChatUpdate);
    window.addEventListener('resource_update', handleResUpdate);

    return () => {
        window.removeEventListener('chat_update', handleChatUpdate);
        window.removeEventListener('resource_update', handleResUpdate);
    }
  }, [user?.classCode]); // Re-run when class code changes

  // Handlers
  const handleJoinClass = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await joinClassroom(joinCodeInput);
    if (!success) {
        alert("Invalid Class Code");
    } else {
        setJoinCodeInput('');
        setShowJoinModal(false);
    }
  };

  const handleStartTask = async (task: Task) => {
    if (!user) return;
    setCompleting(task.id);
    setActiveTaskTitle(task.title);

    // Call AI to generate quiz based on STUDENT'S predicted difficulty, not the task's static difficulty
    try {
        const quizQuestions = await generateAdaptiveQuiz(task.topic, predictedDiff);
        setActiveQuiz(quizQuestions);
        setQuizAnswers({});
    } catch (e) {
        alert("Failed to generate quiz. Please try again.");
        setCompleting(null);
    }
  };

  const submitQuiz = async () => {
    if (!user || !activeQuiz || !completing) return;
    
    // Calculate Score
    let correctCount = 0;
    activeQuiz.forEach((q, idx) => {
        if (quizAnswers[idx] === q.correctAnswerIndex) {
            correctCount++;
        }
    });

    const finalScore = Math.round((correctCount / activeQuiz.length) * 100);

    const updatedUser = await submitTaskScore(
        user.id, 
        completing, 
        activeTaskTitle, 
        finalScore, 
        predictedDiff, // Record the difficulty level this was taken at
        activeQuiz // Save the questions generated
    );
    
    if (updatedUser) {
        updateUser(updatedUser);
        
        // Refresh Recommendations
        const newDifficulty = await predictNextDifficulty(updatedUser.recentScores);
        setPredictedDiff(newDifficulty);
        const newTasks = await fetchRecommendedTasks(newDifficulty);
        setTasks(newTasks);
        
        // Cleanup and Show Feedback
        setCompleting(null);
        setActiveQuiz(null);
        setFeedback({ score: finalScore, mastery: updatedUser.masteryScore });
    }
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgInput.trim() || !user) return;
    await sendMessage({
        id: Date.now().toString(),
        senderId: user.id,
        senderName: user.name,
        role: UserRole.STUDENT,
        text: msgInput,
        timestamp: Date.now()
    });
    setMsgInput('');
  };

  if (!user) return null;

  // --- VIEW 1: NO CLASSES ENROLLED ---
  if (user.enrolledClassCodes.length === 0) {
    return (
      <div className="min-h-screen bg-alabaster-grey flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
            <div className="bg-yale-blue/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Key className="w-8 h-8 text-yale-blue" />
            </div>
            <h2 className="text-2xl font-bold text-graphite mb-2">Enter Class Code</h2>
            <p className="text-graphite/60 mb-6">Ask your teacher for the unique code to join their classroom.</p>
            <form onSubmit={handleJoinClass}>
                <input 
                    type="text" 
                    value={joinCodeInput}
                    onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                    className="w-full text-center text-2xl tracking-widest border-2 border-alabaster-grey rounded-xl p-3 mb-4 focus:border-yale-blue outline-none uppercase text-graphite placeholder-graphite/40"
                    placeholder="MATH101"
                />
                <button type="submit" className="w-full bg-yale-blue text-white py-3 rounded-xl font-bold hover:bg-opacity-90 transition">
                    Join Classroom
                </button>
            </form>
            <button onClick={logout} className="mt-4 text-sm text-graphite/40 underline">Logout</button>
        </div>
      </div>
    );
  }

  // --- VIEW 2: CLASS LIST (My Classes) ---
  if (!user.classCode) {
    return (
       <div className="min-h-screen bg-alabaster-grey/40 p-6 flex flex-col items-center">
          <div className="w-full max-w-4xl animate-fade-in-up">
              <header className="flex justify-between items-center mb-10">
                  <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-yale-blue flex items-center justify-center text-white font-bold shadow-md">
                          {user.name[0]}
                      </div>
                      <h1 className="text-2xl font-bold text-graphite">My Classes</h1>
                  </div>
                  <button onClick={logout} className="text-graphite/50 hover:text-red-500 transition">
                      <LogOut className="w-6 h-6" />
                  </button>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {user.enrolledClassCodes.map((code) => (
                      <div 
                        key={code} 
                        onClick={() => selectClass(code)}
                        className="bg-white p-6 rounded-2xl border border-alabaster-grey shadow-sm hover:shadow-lg hover:border-yale-blue/30 transition cursor-pointer group"
                      >
                          <div className="bg-yale-blue/5 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:bg-yale-blue/10 transition">
                              <BookOpen className="w-6 h-6 text-yale-blue" />
                          </div>
                          <h3 className="text-xl font-bold text-graphite mb-1">{code}</h3>
                          <p className="text-sm text-graphite/50">View tasks & progress</p>
                          <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-yale-blue opacity-0 group-hover:opacity-100 transition transform translate-y-2 group-hover:translate-y-0">
                              Enter Classroom <div className="w-4 h-4 rounded-full bg-yale-blue text-white flex items-center justify-center">&rarr;</div>
                          </div>
                      </div>
                  ))}

                  {/* Add Class Button */}
                  <button 
                    onClick={() => setShowJoinModal(true)}
                    className="border-2 border-dashed border-alabaster-grey rounded-2xl p-6 flex flex-col items-center justify-center text-graphite/40 hover:bg-white hover:border-yale-blue hover:text-yale-blue transition"
                  >
                      <Plus className="w-10 h-10 mb-2" />
                      <span className="font-semibold">Join New Class</span>
                  </button>
              </div>
          </div>

          {/* Join Class Modal */}
          {showJoinModal && (
              <div className="fixed inset-0 bg-graphite/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
                  <div className="bg-white p-6 rounded-2xl shadow-xl max-w-sm w-full relative">
                      <button onClick={() => setShowJoinModal(false)} className="absolute top-4 right-4 text-graphite/40 hover:text-graphite"><X className="w-5 h-5"/></button>
                      <h2 className="text-xl font-bold text-graphite mb-4">Join a Class</h2>
                      <form onSubmit={handleJoinClass}>
                        <input 
                            type="text" 
                            value={joinCodeInput}
                            onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                            className="w-full text-center text-xl tracking-widest border-2 border-alabaster-grey rounded-xl p-3 mb-4 focus:border-yale-blue outline-none uppercase text-graphite placeholder-graphite/40"
                            placeholder="CODE"
                            autoFocus
                        />
                        <button type="submit" className="w-full bg-yale-blue text-white py-3 rounded-xl font-bold hover:bg-opacity-90 transition">
                            Join
                        </button>
                    </form>
                  </div>
              </div>
          )}
       </div>
    );
  }

  // --- VIEW 3: SPECIFIC CLASS DASHBOARD ---
  
  // Calculate History Data for Chart
  const historyData = user.taskHistory && user.taskHistory.length > 0 
    ? [...user.taskHistory].reverse().slice(-5).map(h => ({ // Show last 5 in chronological order
        name: h.taskTitle.length > 8 ? h.taskTitle.substring(0, 8) + '..' : h.taskTitle,
        fullTitle: h.taskTitle,
        score: h.score
    }))
    : [];

  // Determine area of improvement logic
  let improvementSuggestion = "Complete more tasks to get personalized suggestions.";
  if (user.taskHistory && user.taskHistory.length > 0) {
      // Find the task with lowest score
      const lowest = [...user.taskHistory].sort((a, b) => a.score - b.score)[0];
      if (lowest.score < 60) {
          improvementSuggestion = `Consider reviewing material for "${lowest.taskTitle}" to boost your foundational knowledge.`;
      } else if (lowest.score < 80) {
          improvementSuggestion = `You're doing well! Focus on "${lowest.taskTitle}" to reach mastery level.`;
      } else {
          improvementSuggestion = "Excellent performance across the board! Challenge yourself with higher difficulty tasks.";
      }
  }

  return (
    <div className="min-h-screen bg-alabaster-grey/40 flex flex-col md:flex-row relative">
      
      {/* Sidebar Nav */}
      <nav className="w-full md:w-20 bg-white border-r border-alabaster-grey flex md:flex-col items-center py-4 gap-6 sticky top-0 z-10 md:h-screen">
         <div className="font-bold text-yale-blue p-2 rounded-lg bg-yale-blue/10 mb-4 hidden md:block">
            <Award className="w-6 h-6" />
         </div>
         
         <button onClick={() => selectClass(null)} className="p-3 text-graphite/50 hover:bg-alabaster-grey rounded-xl mb-2" title="Switch Class">
             <Grid className="w-6 h-6" />
         </button>
         
         <div className="w-10 h-0.5 bg-alabaster-grey hidden md:block mb-2"></div>

         <button onClick={() => setActiveTab('path')} className={`p-3 rounded-xl transition ${activeTab === 'path' ? 'bg-yale-blue text-white shadow-lg shadow-yale-blue/20' : 'text-graphite/50 hover:bg-alabaster-grey'}`}>
            <TrendingUp className="w-6 h-6" />
         </button>
         <button onClick={() => setActiveTab('resources')} className={`p-3 rounded-xl transition ${activeTab === 'resources' ? 'bg-yale-blue text-white shadow-lg shadow-yale-blue/20' : 'text-graphite/50 hover:bg-alabaster-grey'}`}>
            <BookOpen className="w-6 h-6" />
         </button>
         <button onClick={() => setActiveTab('chat')} className={`p-3 rounded-xl transition ${activeTab === 'chat' ? 'bg-yale-blue text-white shadow-lg shadow-yale-blue/20' : 'text-graphite/50 hover:bg-alabaster-grey'}`}>
            <MessageSquare className="w-6 h-6" />
         </button>
         <div className="flex-grow"></div>
         <button onClick={logout} className="p-3 text-red-400 hover:bg-red-50 rounded-xl mb-4" title="Logout">
             <LogOut className="w-6 h-6" /> 
         </button>
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-y-auto">
        <header className="flex justify-between items-center mb-8">
            <div>
                <h1 className="text-2xl font-bold text-graphite">Hello, {user.name}</h1>
                <p className="text-graphite/60 font-medium flex items-center gap-2">
                    Class: <span className="text-yale-blue font-bold px-2 py-0.5 bg-yale-blue/5 rounded">{user.classCode}</span>
                </p>
            </div>
            <div className="flex items-center gap-3 bg-white p-2 px-4 rounded-full border border-alabaster-grey shadow-sm">
                <div className="text-right">
                    <p className="text-xs text-graphite/50 font-bold uppercase">Mastery</p>
                    <p className="font-bold text-yale-blue">{user.masteryScore}%</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-yale-blue to-stormy-teal flex items-center justify-center text-white font-bold shadow-md">
                    {user.name[0]}
                </div>
            </div>
        </header>

        {activeTab === 'path' && (
            <div className="animate-fade-in-up">
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {/* Mastery Card */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-alabaster-grey">
                        <p className="text-graphite/50 text-xs font-bold uppercase tracking-wide">Overall Mastery</p>
                        <h2 className="text-4xl font-bold text-yale-blue mt-2">{user.masteryScore}%</h2>
                        <div className="mt-4 w-full bg-alabaster-grey rounded-full h-2">
                            <div className="bg-yale-blue h-2 rounded-full transition-all duration-500" style={{ width: `${user.masteryScore}%` }}></div>
                        </div>
                    </div>

                    {/* AI Prediction */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-alabaster-grey">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                            <p className="text-graphite/50 text-xs font-bold uppercase tracking-wide flex items-center gap-2">
                                <Cpu className="w-4 h-4" /> Adaptive AI
                            </p>
                            <h3 className="text-lg font-semibold text-graphite mt-1">Next Challenge Level</h3>
                            </div>
                        </div>
                        <div className="flex items-end gap-2">
                            <span className="text-4xl font-bold text-stormy-teal">{predictedDiff}</span>
                            <span className="text-graphite/40 mb-1">/ 100</span>
                        </div>
                        <p className="text-xs text-graphite/50 mt-2">Adjusted automatically based on performance</p>
                    </div>

                    {/* Performance History */}
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-alabaster-grey flex flex-col">
                        <div className="flex items-center justify-between mb-2">
                             <p className="text-graphite/50 text-xs font-bold uppercase tracking-wide flex items-center gap-2">
                                <TrendingUp className="w-4 h-4" /> Recent Performance
                            </p>
                        </div>
                        
                        <div className="h-28 w-full mb-3">
                            {historyData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={historyData}>
                                         <XAxis dataKey="name" tick={{fontSize: 9, fill: '#353535'}} interval={0} stroke="#d9d9d9" />
                                         <RechartTooltip 
                                            contentStyle={{backgroundColor: '#ffffff', color: '#353535', fontSize: '12px', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                                            itemStyle={{color: '#353535'}}
                                            labelStyle={{color: '#284b63', fontWeight: 'bold'}}
                                            cursor={{fill: '#d9d9d9', opacity: 0.2}}
                                         />
                                         <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                                            {historyData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.score >= 70 ? '#3c6e71' : '#284b63'} /> // Stormy Teal for good, Yale Blue for standard
                                            ))}
                                         </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-xs text-graphite/40 italic">
                                    No test history yet. Start a task!
                                </div>
                            )}
                        </div>

                        <div className="bg-yale-blue/5 p-3 rounded-lg mt-auto border border-yale-blue/10">
                            <div className="flex items-center gap-1.5 mb-1">
                                <Lightbulb className="w-3 h-3 text-yale-blue" />
                                <p className="text-[10px] uppercase font-bold text-yale-blue">AI Suggestion</p>
                            </div>
                            <p className="text-xs font-medium text-graphite leading-snug">
                                {improvementSuggestion}
                            </p>
                        </div>
                    </div>
                </div>

                <h2 className="text-xl font-bold text-graphite mb-4 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-yale-blue" />
                    Recommended Tasks
                </h2>
                {loading ? <p className="text-graphite/50">Loading AI recommendations...</p> : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {tasks.map(task => (
                            <div key={task.id} className="bg-white border border-alabaster-grey rounded-xl p-5 hover:shadow-md transition group">
                                <div className="flex justify-between items-start mb-3">
                                    <span className={`px-2 py-1 rounded text-xs font-semibold ${task.type === 'project' ? 'bg-purple-100 text-purple-700' : 'bg-yale-blue/10 text-yale-blue'}`}>
                                        {task.type.toUpperCase()}
                                    </span>
                                    <span className="text-xs font-bold text-stormy-teal flex items-center gap-1">
                                        <Cpu className="w-3 h-3" /> Adaptive
                                    </span>
                                </div>
                                <h3 className="font-bold text-graphite mb-1 group-hover:text-yale-blue transition">{task.title}</h3>
                                <p className="text-sm text-graphite/60 mb-4">{task.topic}</p>
                                <button 
                                    onClick={() => handleStartTask(task)}
                                    disabled={completing === task.id}
                                    className="w-full py-2 bg-graphite text-white rounded-lg hover:bg-yale-blue transition font-medium flex justify-center items-center gap-2 shadow-sm"
                                >
                                    {completing === task.id ? 'Generating...' : 'Start Task'}
                                    {completing === task.id ? <BrainCircuit className="w-4 h-4 animate-pulse" /> : <Activity className="w-4 h-4" />}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )}

        {activeTab === 'resources' && (
            <div className="animate-fade-in-up">
                <h2 className="text-xl font-bold text-graphite mb-6">Class Resources & Notes</h2>
                <div className="space-y-4">
                    {resources.length === 0 && <p className="text-graphite/50">No resources uploaded yet.</p>}
                    {resources.map(res => (
                        <div key={res.id} className="bg-white p-5 rounded-xl border border-alabaster-grey shadow-sm flex items-start gap-4">
                            <div className={`${res.type === 'pdf' ? 'bg-red-50' : 'bg-amber-50'} p-3 rounded-lg`}>
                                {res.type === 'pdf' ? <FileText className="w-6 h-6 text-red-500" /> : <FileText className="w-6 h-6 text-amber-500" />}
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-start">
                                    <h3 className="font-bold text-graphite">{res.title}</h3>
                                    <span className="text-xs text-graphite/40">{res.date}</span>
                                </div>
                                <p className="text-graphite/70 text-sm mt-1 mb-2">{res.content}</p>
                                
                                {res.type === 'pdf' && res.fileUrl && (
                                    <a 
                                        href={res.fileUrl} 
                                        download={res.fileName}
                                        className="inline-flex items-center gap-2 text-sm text-yale-blue font-medium hover:underline bg-yale-blue/5 px-3 py-2 rounded-lg transition hover:bg-yale-blue/10"
                                    >
                                        <Download className="w-4 h-4" />
                                        Download {res.fileName}
                                    </a>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {activeTab === 'chat' && (
             <div className="animate-fade-in-up h-[calc(100vh-140px)] flex flex-col bg-white rounded-2xl border border-alabaster-grey shadow-sm overflow-hidden">
                <div className="bg-yale-blue/5 p-4 border-b border-yale-blue/10">
                    <h3 className="font-bold text-yale-blue">Class Chatroom</h3>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map(msg => (
                        <div key={msg.id} className={`flex flex-col ${msg.senderId === user.id ? 'items-end' : 'items-start'}`}>
                            <div className={`max-w-[80%] p-3 rounded-xl text-sm ${msg.senderId === user.id ? 'bg-yale-blue text-white rounded-tr-none shadow-md' : 'bg-alabaster-grey/50 text-graphite rounded-tl-none border border-alabaster-grey'}`}>
                                {msg.role === UserRole.TEACHER && <p className="text-xs font-bold mb-1 text-stormy-teal">Teacher</p>}
                                {msg.senderId !== user.id && msg.role !== UserRole.TEACHER && <p className="text-xs font-bold mb-1 text-graphite/60">{msg.senderName}</p>}
                                {msg.text}
                            </div>
                            <span className="text-[10px] text-graphite/40 mt-1">{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                    ))}
                </div>
                <form onSubmit={handleSendChat} className="p-4 border-t border-alabaster-grey flex gap-2">
                    <input 
                        value={msgInput}
                        onChange={(e) => setMsgInput(e.target.value)}
                        className="flex-1 border border-alabaster-grey rounded-lg px-4 py-2 focus:ring-2 focus:ring-yale-blue outline-none text-graphite placeholder-graphite/40"
                        placeholder="Type a message..."
                    />
                    <button type="submit" className="bg-yale-blue text-white p-2 rounded-lg hover:bg-opacity-90 transition">
                        <Send className="w-5 h-5" />
                    </button>
                </form>
             </div>
        )}

      </main>

      {/* QUIZ MODAL */}
      {activeQuiz && (
          <div className="fixed inset-0 bg-graphite/80 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto p-4 animate-in fade-in duration-200">
              <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] border border-yale-blue/20">
                  <div className="p-6 border-b border-alabaster-grey flex justify-between items-center bg-yale-blue/5 rounded-t-2xl">
                      <div>
                          <h2 className="text-xl font-bold text-graphite">{activeTaskTitle}</h2>
                          <p className="text-sm text-yale-blue font-medium">Adaptive AI Quiz (Level {predictedDiff})</p>
                      </div>
                      <button 
                        onClick={() => { setActiveQuiz(null); setCompleting(null); }} 
                        className="p-2 hover:bg-alabaster-grey rounded-full text-graphite/50 hover:text-graphite transition"
                      >
                          <X className="w-6 h-6" />
                      </button>
                  </div>
                  
                  <div className="p-6 overflow-y-auto space-y-8">
                      {activeQuiz.map((q, qIdx) => (
                          <div key={qIdx} className="space-y-3">
                              <p className="font-semibold text-graphite text-lg flex gap-2">
                                  <span className="text-yale-blue">{qIdx + 1}.</span> 
                                  {q.question}
                              </p>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-6">
                                  {q.options.map((opt, optIdx) => (
                                      <button
                                          key={optIdx}
                                          onClick={() => setQuizAnswers(prev => ({...prev, [qIdx]: optIdx}))}
                                          className={`text-left p-3 rounded-xl border transition ${
                                              quizAnswers[qIdx] === optIdx 
                                              ? 'bg-yale-blue text-white border-yale-blue shadow-md' 
                                              : 'bg-white border-alabaster-grey hover:border-yale-blue/50 hover:bg-alabaster-grey/20 text-graphite'
                                          }`}
                                      >
                                          {opt}
                                      </button>
                                  ))}
                              </div>
                          </div>
                      ))}
                  </div>

                  <div className="p-6 border-t border-alabaster-grey bg-alabaster-grey/10 rounded-b-2xl flex justify-between items-center">
                        <span className="text-sm text-graphite/50">
                            Answered: {Object.keys(quizAnswers).length} / {activeQuiz.length}
                        </span>
                        <button 
                            onClick={submitQuiz}
                            disabled={Object.keys(quizAnswers).length < activeQuiz.length}
                            className={`px-8 py-3 rounded-xl font-bold transition flex items-center gap-2 ${
                                Object.keys(quizAnswers).length < activeQuiz.length
                                ? 'bg-alabaster-grey text-graphite/40 cursor-not-allowed'
                                : 'bg-stormy-teal text-white hover:bg-stormy-teal/90 shadow-lg shadow-stormy-teal/20'
                            }`}
                        >
                            Submit Quiz <CheckCircle className="w-5 h-5" />
                        </button>
                  </div>
              </div>
          </div>
      )}

      {/* Feedback Overlay */}
        {feedback && (
             <div className="fixed inset-0 bg-graphite/80 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
                <div className="bg-white p-8 rounded-2xl shadow-2xl text-center max-w-sm w-full mx-4 animate-in zoom-in-95 duration-200 border border-white/20">
                    <div className="w-20 h-20 bg-stormy-teal/10 rounded-full flex items-center justify-center mx-auto mb-4 ring-8 ring-white">
                        <CheckCircle className="w-10 h-10 text-stormy-teal" />
                    </div>
                    <h2 className="text-2xl font-bold text-graphite mb-2">Task Completed!</h2>
                    <p className="text-graphite/60 mb-6">Your progress has been recorded.</p>
                    
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-alabaster-grey/30 p-4 rounded-xl border border-alabaster-grey">
                            <p className="text-xs text-graphite/50 uppercase font-bold mb-1">Score</p>
                            <p className="text-3xl font-bold text-yale-blue">{feedback.score}%</p>
                        </div>
                         <div className="bg-alabaster-grey/30 p-4 rounded-xl border border-alabaster-grey">
                            <p className="text-xs text-graphite/50 uppercase font-bold mb-1">New Mastery</p>
                            <p className="text-3xl font-bold text-stormy-teal">{feedback.mastery}%</p>
                        </div>
                    </div>
                    
                    <button 
                        onClick={() => setFeedback(null)}
                        className="w-full bg-yale-blue text-white py-3 rounded-xl font-bold hover:bg-opacity-90 transition shadow-lg shadow-yale-blue/20"
                    >
                        Continue Learning
                    </button>
                </div>
            </div>
        )}
    </div>
  );
};

export default StudentDashboard;
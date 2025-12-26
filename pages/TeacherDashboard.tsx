import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { getClassStudents, addResource, getResources, getMessages, sendMessage, getAllTasks, addTask } from '../services/mockDatabase';
import { User, ClassResource, ChatMessage, UserRole, Task, TaskAttempt } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Users, Radio, AlertCircle, FileText, Upload, MessageSquare, PieChart as PieIcon, Send, ClipboardList, PlusCircle, X, ChevronRight, ChevronDown, CheckCircle, BrainCircuit, Cpu, Award } from 'lucide-react';

const TeacherDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { startPoll, activePoll } = useSocket();
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'resources' | 'tasks' | 'chat'>('overview');
  
  // Data State
  const [students, setStudents] = useState<User[]>([]);
  const [resources, setResources] = useState<ClassResource[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);

  // Detailed Student View State
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);

  // Inputs - Polls & Resources & Chat
  const [pollQuestion, setPollQuestion] = useState('How well do you understand React Hooks?');
  const [pollOptions, setPollOptions] = useState('Not at all, Somewhat, Very well, I can teach it');
  const [resTitle, setResTitle] = useState('');
  const [resContent, setResContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [chatInput, setChatInput] = useState('');

  // Inputs - Tasks
  const [taskTitle, setTaskTitle] = useState('');
  const [taskTopic, setTaskTopic] = useState('');
  const [taskType, setTaskType] = useState<'quiz' | 'project'>('quiz');

  useEffect(() => {
    if (!user?.classCode) return;
    
    const loadData = async () => {
        setStudents(await getClassStudents(user.classCode!));
        setResources(await getResources());
        setMessages(await getMessages());
        setAllTasks(await getAllTasks());
    };
    loadData();

    // Listeners
    const handleChatUpdate = async () => setMessages(await getMessages());
    const handleResUpdate = async () => setResources(await getResources());
    
    window.addEventListener('chat_update', handleChatUpdate);
    window.addEventListener('resource_update', handleResUpdate);

    return () => {
        window.removeEventListener('chat_update', handleChatUpdate);
        window.removeEventListener('resource_update', handleResUpdate);
    }
  }, [user]);


  const handleLaunchPoll = () => {
    const optionsArray = pollOptions.split(',').map(s => s.trim());
    startPoll(pollQuestion, optionsArray);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let fileUrl: string | undefined = undefined;
    let fileName: string | undefined = undefined;
    let type: 'note' | 'pdf' = 'note';

    if (selectedFile) {
        type = 'pdf';
        fileName = selectedFile.name;
        // Simple file read to base64 for demo purposes
        fileUrl = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.readAsDataURL(selectedFile);
        });
    }

    await addResource({
        id: Date.now().toString(),
        title: resTitle,
        type: type,
        content: resContent,
        date: new Date().toLocaleDateString(),
        fileUrl,
        fileName
    });

    setResTitle('');
    setResContent('');
    setSelectedFile(null);
    alert('Resource Posted');
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const newTask: Task = {
        id: Date.now().toString(),
        title: taskTitle,
        topic: taskTopic,
        type: taskType,
        // Difficulty removed - logic is now fully adaptive
    };
    await addTask(newTask);
    setAllTasks(await getAllTasks()); // Refresh list
    setTaskTitle('');
    setTaskTopic('');
    alert('Task Created Successfully');
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!chatInput.trim() || !user) return;
    await sendMessage({
        id: Date.now().toString(),
        senderId: user.id,
        senderName: user.name,
        role: UserRole.TEACHER,
        text: chatInput,
        timestamp: Date.now()
    });
    setChatInput('');
  };

  if (!user) return null;

  // Mock Analytics
  const classData = [
    { name: 'Mon', engagement: 65, mastery: 58 },
    { name: 'Tue', engagement: 75, mastery: 62 },
    { name: 'Wed', engagement: 55, mastery: 65 },
    { name: 'Thu', engagement: 85, mastery: 70 },
    { name: 'Fri', engagement: 90, mastery: 75 },
  ];

  const toggleHistory = (id: string) => {
      setExpandedHistoryId(expandedHistoryId === id ? null : id);
  }

  // Calculate Engagement Score helper
  const getEngagementScore = (s: User) => Math.round((s.softSkills.collaboration + s.softSkills.communication) / 2);

  return (
    <div className="min-h-screen bg-alabaster-grey/40 flex flex-col md:flex-row">
       {/* Sidebar */}
       <nav className="w-full md:w-20 bg-graphite flex md:flex-col items-center py-4 gap-6 sticky top-0 z-10 md:h-screen text-white border-r border-graphite">
         <div className="font-bold text-2xl mb-4 hidden md:block text-white p-2 bg-yale-blue rounded-lg">
             <Award className="w-6 h-6" />
         </div>
         <button onClick={() => {setActiveTab('overview'); setSelectedStudent(null);}} className={`p-3 rounded-xl transition ${activeTab === 'overview' ? 'bg-yale-blue' : 'hover:bg-yale-blue/50'}`}>
            <PieIcon className="w-6 h-6" />
         </button>
         <button onClick={() => setActiveTab('students')} className={`p-3 rounded-xl transition ${activeTab === 'students' ? 'bg-yale-blue' : 'hover:bg-yale-blue/50'}`}>
            <Users className="w-6 h-6" />
         </button>
         <button onClick={() => {setActiveTab('tasks'); setSelectedStudent(null);}} className={`p-3 rounded-xl transition ${activeTab === 'tasks' ? 'bg-yale-blue' : 'hover:bg-yale-blue/50'}`}>
            <ClipboardList className="w-6 h-6" />
         </button>
         <button onClick={() => {setActiveTab('resources'); setSelectedStudent(null);}} className={`p-3 rounded-xl transition ${activeTab === 'resources' ? 'bg-yale-blue' : 'hover:bg-yale-blue/50'}`}>
            <FileText className="w-6 h-6" />
         </button>
         <button onClick={() => {setActiveTab('chat'); setSelectedStudent(null);}} className={`p-3 rounded-xl transition ${activeTab === 'chat' ? 'bg-yale-blue' : 'hover:bg-yale-blue/50'}`}>
            <MessageSquare className="w-6 h-6" />
         </button>
         <div className="flex-grow"></div>
         <button onClick={logout} className="p-3 text-red-300 hover:bg-red-900 rounded-xl mb-4">
             <Upload className="w-6 h-6 rotate-90" /> 
         </button>
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-y-auto text-graphite">
        <header className="flex justify-between items-center mb-8">
            <div>
                <h1 className="text-2xl font-bold text-graphite">Class Control</h1>
                <p className="text-graphite/60">Real-time Dashboard</p>
            </div>
            <div className="bg-white text-yale-blue px-6 py-2 rounded-lg font-mono text-sm border border-alabaster-grey shadow-sm">
                Code: <span className="font-bold text-lg">{user.classCode}</span>
            </div>
        </header>

        {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in-up">
                {/* Main Analytics Area */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-alabaster-grey">
                        <h3 className="text-lg font-bold text-graphite mb-4">Weekly Class Performance</h3>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={classData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#d9d9d9" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#353535'}} />
                                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#353535'}} />
                                    <Tooltip contentStyle={{borderColor: '#d9d9d9', borderRadius: '8px'}} />
                                    <Line type="monotone" dataKey="engagement" stroke="#284b63" strokeWidth={3} dot={{r: 4, fill: '#284b63'}} />
                                    <Line type="monotone" dataKey="mastery" stroke="#3c6e71" strokeWidth={3} dot={{r: 4, fill: '#3c6e71'}} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Live Poll Sidebar */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-alabaster-grey">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="bg-yale-blue/10 p-2 rounded-lg"><Radio className="w-5 h-5 text-yale-blue" /></div>
                            <h3 className="text-lg font-bold text-graphite">Live Poll</h3>
                        </div>

                        {activePoll ? (
                            <div className="text-center py-8">
                                <div className="animate-pulse flex flex-col items-center">
                                    <div className="h-4 w-4 bg-red-500 rounded-full mb-2"></div>
                                    <p className="text-graphite font-medium">Poll is Active</p>
                                    <p className="text-sm text-graphite/50">Students are voting...</p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <input type="text" value={pollQuestion} onChange={(e) => setPollQuestion(e.target.value)} className="w-full border border-alabaster-grey p-2 rounded text-sm text-graphite" />
                                <textarea value={pollOptions} onChange={(e) => setPollOptions(e.target.value)} className="w-full border border-alabaster-grey p-2 rounded text-sm text-graphite" rows={3} />
                                <button onClick={handleLaunchPoll} className="w-full bg-yale-blue text-white py-2 rounded-lg font-medium hover:bg-opacity-90">Launch Poll</button>
                            </div>
                        )}
                    </div>
                    
                    <div className="bg-graphite p-6 rounded-2xl text-white text-center shadow-lg">
                        <Users className="w-8 h-8 mb-4 mx-auto text-alabaster-grey" />
                        <h3 className="text-3xl font-bold">{students.length}</h3>
                        <p className="text-alabaster-grey">Students Enrolled</p>
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'students' && !selectedStudent && (
             <div className="bg-white rounded-2xl border border-alabaster-grey shadow-sm overflow-hidden animate-fade-in-up">
                <table className="w-full text-left">
                    <thead className="bg-alabaster-grey/20 border-b border-alabaster-grey">
                        <tr>
                            <th className="p-4 text-sm font-semibold text-graphite/60">Student Name</th>
                            <th className="p-4 text-sm font-semibold text-graphite/60">Mastery</th>
                            <th className="p-4 text-sm font-semibold text-graphite/60">Soft Skills</th>
                            <th className="p-4 text-sm font-semibold text-graphite/60">Status</th>
                            <th className="p-4 text-sm font-semibold text-graphite/60">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {students.map(s => (
                            <tr key={s.id} className="border-b border-alabaster-grey hover:bg-alabaster-grey/10 transition">
                                <td className="p-4 font-medium text-graphite">{s.name}</td>
                                <td className="p-4 text-yale-blue font-bold">{s.masteryScore}%</td>
                                <td className="p-4 text-sm text-graphite/70">
                                    Collab: {s.softSkills.collaboration} | Comm: {s.softSkills.communication}
                                </td>
                                <td className="p-4">
                                    {s.masteryScore < 50 ? (
                                        <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full flex items-center w-fit gap-1">
                                            <AlertCircle className="w-3 h-3" /> At Risk
                                        </span>
                                    ) : (
                                        <span className="bg-stormy-teal/20 text-stormy-teal text-xs px-2 py-1 rounded-full font-semibold">On Track</span>
                                    )}
                                </td>
                                <td className="p-4">
                                    <button 
                                        onClick={() => setSelectedStudent(s)}
                                        className="text-sm bg-graphite text-white px-3 py-1 rounded-md hover:bg-yale-blue transition"
                                    >
                                        View Analytics
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
             </div>
        )}

        {/* Detailed Student View */}
        {activeTab === 'students' && selectedStudent && (
            <div className="animate-fade-in-up space-y-6">
                <button 
                    onClick={() => setSelectedStudent(null)}
                    className="flex items-center gap-1 text-sm text-graphite/50 hover:text-yale-blue mb-2 transition"
                >
                    <ChevronRight className="w-4 h-4 rotate-180" /> Back to List
                </button>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Profile Card */}
                    <div className="bg-white p-6 rounded-2xl border border-alabaster-grey shadow-sm">
                        <div className="flex items-center gap-4 mb-6">
                             <div className="w-16 h-16 bg-yale-blue text-white rounded-full flex items-center justify-center text-xl font-bold">
                                 {selectedStudent.name[0]}
                             </div>
                             <div>
                                 <h2 className="text-xl font-bold text-graphite">{selectedStudent.name}</h2>
                                 <p className="text-graphite/50 text-sm">{selectedStudent.email}</p>
                             </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                             <div className="bg-alabaster-grey/30 p-3 rounded-xl">
                                 <p className="text-xs text-graphite/50 uppercase font-bold">Mastery</p>
                                 <p className="text-2xl font-bold text-yale-blue">{selectedStudent.masteryScore}%</p>
                             </div>
                             <div className="bg-alabaster-grey/30 p-3 rounded-xl">
                                 <p className="text-xs text-graphite/50 uppercase font-bold">Risk Level</p>
                                 <p className={`text-xl font-bold ${selectedStudent.masteryScore < 50 ? 'text-red-500' : 'text-stormy-teal'}`}>
                                     {selectedStudent.masteryScore < 50 ? 'High' : 'Low'}
                                 </p>
                             </div>
                        </div>
                    </div>

                    {/* Engagement vs Mastery Chart (Replaces Soft Skills) */}
                    <div className="bg-white p-6 rounded-2xl border border-alabaster-grey shadow-sm">
                         <h3 className="font-bold text-graphite mb-2">Engagement vs Mastery</h3>
                         <div className="h-40 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie 
                                        data={[
                                            { name: 'Engagement', value: getEngagementScore(selectedStudent) },
                                            { name: 'Mastery', value: selectedStudent.masteryScore }
                                        ]} 
                                        dataKey="value" innerRadius={40} outerRadius={60} paddingAngle={2}
                                    >
                                        <Cell fill="#3c6e71" /> {/* Stormy Teal for Engagement */}
                                        <Cell fill="#284b63" /> {/* Yale Blue for Mastery */}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex justify-center gap-4 text-xs">
                             <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-stormy-teal"></div> Engagement</span>
                             <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-yale-blue"></div> Mastery</span>
                        </div>
                    </div>
                </div>

                {/* History Section */}
                <div className="bg-white rounded-2xl border border-alabaster-grey shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-alabaster-grey bg-alabaster-grey/10">
                        <h3 className="font-bold text-graphite flex items-center gap-2">
                            <BrainCircuit className="w-5 h-5 text-yale-blue" />
                            Adaptive Learning History
                        </h3>
                    </div>
                    
                    {(!selectedStudent.taskHistory || selectedStudent.taskHistory.length === 0) ? (
                        <div className="p-12 text-center text-graphite/40">
                            No learning history available for this student yet.
                        </div>
                    ) : (
                        <div>
                            {selectedStudent.taskHistory.map((attempt) => (
                                <div key={attempt.id} className="border-b border-alabaster-grey last:border-0">
                                    <div 
                                        onClick={() => toggleHistory(attempt.id)}
                                        className="p-4 flex items-center justify-between cursor-pointer hover:bg-alabaster-grey/10 transition"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`p-2 rounded-lg ${attempt.score >= 70 ? 'bg-stormy-teal/20 text-stormy-teal' : 'bg-amber-100 text-amber-600'}`}>
                                                <CheckCircle className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-graphite">{attempt.taskTitle}</h4>
                                                <p className="text-xs text-graphite/50">
                                                    {new Date(attempt.timestamp).toLocaleDateString()} at {new Date(attempt.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                             <div className="text-right">
                                                 <p className="text-xs text-graphite/40 uppercase font-bold">Difficulty</p>
                                                 <p className="font-bold text-graphite">{attempt.difficulty}/100</p>
                                             </div>
                                             <div className="text-right">
                                                 <p className="text-xs text-graphite/40 uppercase font-bold">Score</p>
                                                 <p className={`font-bold ${attempt.score >= 70 ? 'text-stormy-teal' : 'text-amber-600'}`}>{attempt.score}%</p>
                                             </div>
                                             <ChevronDown className={`w-5 h-5 text-graphite/40 transition-transform ${expandedHistoryId === attempt.id ? 'rotate-180' : ''}`} />
                                        </div>
                                    </div>

                                    {/* Expanded Questions View */}
                                    {expandedHistoryId === attempt.id && (
                                        <div className="bg-alabaster-grey/20 p-6 space-y-4 border-t border-alabaster-grey animate-in slide-in-from-top-2 duration-200">
                                            <h5 className="text-xs font-bold uppercase text-graphite/50 tracking-wider mb-2">Generated Questions</h5>
                                            {attempt.questions && attempt.questions.length > 0 ? (
                                                <div className="grid grid-cols-1 gap-3">
                                                    {attempt.questions.map((q, idx) => (
                                                        <div key={idx} className="bg-white p-3 rounded-lg border border-alabaster-grey">
                                                            <div className="flex gap-2">
                                                                <span className="text-yale-blue font-bold">{idx + 1}.</span>
                                                                <p className="text-sm font-medium text-graphite">{q.question}</p>
                                                            </div>
                                                            <div className="mt-2 pl-6 grid grid-cols-2 gap-2">
                                                                {q.options.map((opt, oIdx) => (
                                                                    <div key={oIdx} className={`text-xs px-2 py-1 rounded border ${oIdx === q.correctAnswerIndex ? 'bg-stormy-teal/10 border-stormy-teal/30 text-stormy-teal font-bold' : 'bg-alabaster-grey/30 border-alabaster-grey text-graphite/60'}`}>
                                                                        {opt} {oIdx === q.correctAnswerIndex && '(Correct)'}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-sm text-graphite/40 italic">Question data not available for this session.</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        )}

        {activeTab === 'tasks' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in-up">
                <div className="bg-white p-6 rounded-2xl border border-alabaster-grey shadow-sm h-fit">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-graphite">
                        <PlusCircle className="w-5 h-5 text-yale-blue" />
                        Create New Task
                    </h3>
                    <p className="text-sm text-graphite/60 mb-4">
                        Define a topic. The difficulty will be automatically adapted for each student by the AI.
                    </p>
                    <form onSubmit={handleCreateTask} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-graphite/50 uppercase mb-1">Title</label>
                            <input 
                                value={taskTitle} 
                                onChange={e => setTaskTitle(e.target.value)} 
                                placeholder="e.g. Advanced Chemistry Quiz" 
                                className="w-full border border-alabaster-grey p-2 rounded focus:ring-2 focus:ring-yale-blue outline-none text-graphite" 
                                required 
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-graphite/50 uppercase mb-1">Topic</label>
                                <input 
                                    value={taskTopic} 
                                    onChange={e => setTaskTopic(e.target.value)} 
                                    placeholder="Science" 
                                    className="w-full border border-alabaster-grey p-2 rounded focus:ring-2 focus:ring-yale-blue outline-none text-graphite" 
                                    required 
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-graphite/50 uppercase mb-1">Type</label>
                                <select 
                                    value={taskType}
                                    onChange={e => setTaskType(e.target.value as 'quiz' | 'project')}
                                    className="w-full border border-alabaster-grey p-2 rounded focus:ring-2 focus:ring-yale-blue outline-none text-graphite"
                                >
                                    <option value="quiz">Quiz</option>
                                    <option value="project">Project</option>
                                </select>
                            </div>
                        </div>
                        
                        <div className="bg-yale-blue/5 p-3 rounded-lg flex items-center gap-2 text-yale-blue text-xs border border-yale-blue/10">
                             <BrainCircuit className="w-4 h-4" />
                             <span>Difficulty is set automatically by AI based on student mastery.</span>
                        </div>

                        <button type="submit" className="w-full bg-yale-blue text-white py-2 rounded-lg font-medium hover:bg-opacity-90 transition shadow-md">
                            Create Task
                        </button>
                    </form>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-alabaster-grey shadow-sm overflow-hidden flex flex-col h-[500px]">
                    <h3 className="font-bold text-lg mb-4 text-graphite">Class Task Library</h3>
                    <div className="overflow-y-auto space-y-3 flex-1 pr-2">
                        {allTasks.length === 0 && <p className="text-graphite/40 text-center py-10">No tasks created yet.</p>}
                        {allTasks.map(task => (
                            <div key={task.id} className="p-4 border border-alabaster-grey rounded-xl hover:bg-alabaster-grey/10 transition">
                                <div className="flex justify-between items-start mb-1">
                                    <h4 className="font-bold text-graphite">{task.title}</h4>
                                    <span className={`px-2 py-0.5 text-[10px] rounded uppercase font-bold ${task.type === 'project' ? 'bg-purple-100 text-purple-700' : 'bg-yale-blue/10 text-yale-blue'}`}>
                                        {task.type}
                                    </span>
                                </div>
                                <div className="flex justify-between text-xs text-graphite/50">
                                    <span>{task.topic}</span>
                                    <span className="font-medium text-stormy-teal flex items-center gap-1">
                                        <Cpu className="w-3 h-3" /> Adaptive
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'resources' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in-up">
                <div className="bg-white p-6 rounded-2xl border border-alabaster-grey shadow-sm h-fit">
                    <h3 className="font-bold text-lg mb-4 text-graphite">Upload Class Note / Homework</h3>
                    <form onSubmit={handleUpload} className="space-y-4">
                        <input 
                            value={resTitle} 
                            onChange={e => setResTitle(e.target.value)} 
                            placeholder="Title (e.g., Week 2 Notes)" 
                            className="w-full border border-alabaster-grey p-2 rounded text-graphite" 
                            required 
                        />
                        <textarea 
                            value={resContent} 
                            onChange={e => setResContent(e.target.value)} 
                            placeholder="Content or Instructions..." 
                            className="w-full border border-alabaster-grey p-2 rounded h-32 text-graphite" 
                            required 
                        />
                        
                        {/* File Upload Section */}
                        <div className="space-y-2">
                             <label className="block text-sm font-medium text-graphite/70">Attachment (PDF)</label>
                             {!selectedFile ? (
                                 <div className="border-2 border-dashed border-alabaster-grey rounded-lg p-6 flex flex-col items-center justify-center text-graphite/50 hover:bg-alabaster-grey/10 transition relative">
                                    <input 
                                        type="file" 
                                        accept="application/pdf"
                                        onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                    />
                                    <Upload className="w-8 h-8 mb-2 text-graphite/30" />
                                    <span className="text-sm">Click to upload PDF</span>
                                 </div>
                             ) : (
                                 <div className="flex items-center justify-between p-3 bg-yale-blue/5 rounded-lg border border-yale-blue/10">
                                     <div className="flex items-center gap-2 overflow-hidden">
                                         <FileText className="w-5 h-5 text-yale-blue flex-shrink-0" />
                                         <span className="text-sm text-yale-blue truncate">{selectedFile.name}</span>
                                     </div>
                                     <button 
                                        type="button" 
                                        onClick={() => setSelectedFile(null)} 
                                        className="text-graphite/40 hover:text-red-500"
                                     >
                                         <X className="w-4 h-4" />
                                     </button>
                                 </div>
                             )}
                        </div>

                        <button type="submit" className="w-full bg-yale-blue text-white py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-opacity-90 transition shadow-md">
                            <Upload className="w-4 h-4" /> Post Resource
                        </button>
                    </form>
                </div>
                <div className="space-y-4">
                    {resources.map(res => (
                        <div key={res.id} className="bg-white p-4 rounded-xl border border-alabaster-grey shadow-sm">
                             <div className="flex items-start gap-3">
                                 <div className={`p-2 rounded-lg ${res.type === 'pdf' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
                                     <FileText className="w-5 h-5" />
                                 </div>
                                 <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-bold text-graphite truncate">{res.title}</h4>
                                        <span className="text-xs text-graphite/40 flex-shrink-0 ml-2">{res.date}</span>
                                    </div>
                                    <p className="text-sm text-graphite/70 mt-1 line-clamp-3">{res.content}</p>
                                    {res.type === 'pdf' && (
                                        <div className="mt-2 text-xs text-red-500 font-medium flex items-center gap-1">
                                            <FileText className="w-3 h-3" /> PDF Attachment
                                        </div>
                                    )}
                                 </div>
                             </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {activeTab === 'chat' && (
            <div className="h-[calc(100vh-140px)] flex flex-col bg-white rounded-2xl border border-alabaster-grey shadow-sm overflow-hidden animate-fade-in-up">
                <div className="bg-yale-blue/5 p-4 border-b border-yale-blue/10">
                    <h3 className="font-bold text-yale-blue">Class Chatroom</h3>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map(msg => (
                        <div key={msg.id} className={`flex flex-col ${msg.senderId === user.id ? 'items-end' : 'items-start'}`}>
                            <div className={`max-w-[80%] p-3 rounded-xl text-sm ${msg.senderId === user.id ? 'bg-yale-blue text-white rounded-tr-none shadow-md' : 'bg-alabaster-grey/50 text-graphite rounded-tl-none border border-alabaster-grey'}`}>
                                {msg.role === UserRole.TEACHER && <p className="text-xs font-bold mb-1 text-stormy-teal">You (Teacher)</p>}
                                {msg.role !== UserRole.TEACHER && <p className="text-xs font-bold mb-1 text-graphite/60">{msg.senderName}</p>}
                                {msg.text}
                            </div>
                        </div>
                    ))}
                </div>
                <form onSubmit={handleSendChat} className="p-4 border-t border-alabaster-grey flex gap-2">
                    <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} className="flex-1 border border-alabaster-grey rounded-lg px-4 py-2 outline-none text-graphite" placeholder="Message class..." />
                    <button type="submit" className="bg-yale-blue text-white p-2 rounded-lg hover:bg-opacity-90"><Send className="w-5 h-5" /></button>
                </form>
            </div>
        )}

      </main>
    </div>
  );
};

export default TeacherDashboard;
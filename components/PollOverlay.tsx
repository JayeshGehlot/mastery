import React from 'react';
import { useSocket } from '../context/SocketContext';
import { UserRole } from '../types';
import { useAuth } from '../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const PollOverlay: React.FC = () => {
  const { activePoll, submitVote, endPoll } = useSocket();
  const { user } = useAuth();

  if (!activePoll || !user) return null;

  const isTeacher = user.role === UserRole.TEACHER;

  // Prepare data for chart
  const data = activePoll.options.map((opt, idx) => ({
    name: opt,
    votes: activePoll.responses[idx] || 0
  }));

  const totalVotes = data.reduce((acc, curr) => acc + curr.votes, 0);

  return (
    <div className="fixed bottom-4 right-4 w-96 bg-white shadow-2xl rounded-xl border border-yale-blue/20 overflow-hidden z-50 animate-fade-in-up">
      <div className="bg-yale-blue p-4 flex justify-between items-center">
        <h3 className="text-white font-semibold">Live Poll Active</h3>
        {isTeacher && (
          <button 
            onClick={endPoll}
            className="text-xs bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded transition"
          >
            End Poll
          </button>
        )}
      </div>
      
      <div className="p-4">
        <p className="text-lg font-medium text-graphite mb-4">{activePoll.question}</p>

        {/* Student View: Voting Options */}
        {!isTeacher && !activePoll.hasVoted && (
          <div className="space-y-2">
            {activePoll.options.map((option, idx) => (
              <button
                key={idx}
                onClick={() => submitVote(idx)}
                className="w-full text-left p-3 rounded-lg border border-alabaster-grey hover:bg-yale-blue/5 hover:border-yale-blue/30 transition flex justify-between items-center group text-graphite"
              >
                <span>{option}</span>
                <span className="text-yale-blue opacity-0 group-hover:opacity-100 transition font-bold text-sm">Vote</span>
              </button>
            ))}
          </div>
        )}

        {/* Results View (Teacher or Voted Student) */}
        {(isTeacher || activePoll.hasVoted) && (
          <div className="h-48 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} layout="vertical">
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12, fill: '#353535'}} />
                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderColor: '#d9d9d9'}} />
                <Bar dataKey="votes" radius={[0, 4, 4, 0]}>
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill="#3c6e71" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="text-center text-sm text-graphite/60 mt-2">
              Total Votes: {totalVotes} {activePoll.hasVoted && !isTeacher && "(You Voted)"}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PollOverlay;
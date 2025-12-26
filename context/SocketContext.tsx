import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Poll } from '../types';

interface SocketContextType {
  activePoll: Poll | null;
  startPoll: (question: string, options: string[]) => void;
  submitVote: (optionIndex: number) => void;
  endPoll: () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

// In a real app, this would wrap the socket.io-client connection
export const SocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activePoll, setActivePoll] = useState<Poll | null>(null);

  // Simulate receiving updates from server
  useEffect(() => {
    const checkStorage = () => {
        // We use localStorage to simulate socket broadcasting between "tabs" or views
        const savedPoll = localStorage.getItem('amep_active_poll');
        if (savedPoll) {
            setActivePoll(JSON.parse(savedPoll));
        } else {
            setActivePoll(null);
        }
    };

    window.addEventListener('storage', checkStorage);
    // Initial check
    checkStorage();

    return () => window.removeEventListener('storage', checkStorage);
  }, []);

  const startPoll = (question: string, options: string[]) => {
    const newPoll: Poll = {
      id: Date.now().toString(),
      question,
      options,
      active: true,
      responses: options.map(() => 0) as any, // Initialize counts
    };
    setActivePoll(newPoll);
    // Broadcast
    localStorage.setItem('amep_active_poll', JSON.stringify(newPoll));
    // Trigger local update manually since storage event doesn't fire on same window
    window.dispatchEvent(new Event('storage'));
  };

  const submitVote = (optionIndex: number) => {
    if (!activePoll) return;
    
    const updatedPoll = { ...activePoll };
    // In real socket io, we send vote to server, server updates count, then broadcasts back.
    // Here we update locally and "broadcast".
    if (!updatedPoll.responses[optionIndex]) updatedPoll.responses[optionIndex] = 0;
    updatedPoll.responses[optionIndex]++;
    updatedPoll.hasVoted = true;

    setActivePoll(updatedPoll);
    localStorage.setItem('amep_active_poll', JSON.stringify(updatedPoll));
    window.dispatchEvent(new Event('storage'));
  };

  const endPoll = () => {
    setActivePoll(null);
    localStorage.removeItem('amep_active_poll');
    window.dispatchEvent(new Event('storage'));
  };

  return (
    <SocketContext.Provider value={{ activePoll, startPoll, submitVote, endPoll }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
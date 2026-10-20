import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import ANNPage from './pages/ANNPage';
import CNNPage from './pages/CNNPage';
import RNNPage from './pages/RNNPage';
import QuizPage from './pages/QuizPage';
import ProgressPage from './pages/ProgressPage';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderActivePage = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard setActiveTab={setActiveTab} />;
      case 'ann':
        return <ANNPage />;
      case 'cnn':
        return <CNNPage />;
      case 'rnn':
        return <RNNPage />;
      case 'quiz':
        return <QuizPage />;
      case 'progress':
        return <ProgressPage />;
      default:
        return <Dashboard setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="flex flex-1 flex-col lg:flex-row min-w-0">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {renderActivePage()}
        </main>
      </div>
    </div>
  );
}

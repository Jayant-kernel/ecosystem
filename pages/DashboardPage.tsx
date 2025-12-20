import React, { useState } from 'react';
import { View } from '../App';
import { JAVASCRIPT_COURSE } from '../constants';
import { useCourseProgress } from '../hooks/useCourseProgress';
import { useUserStats, formatTimeSpent } from '../hooks/useUserStats';
import { useAuth } from '../contexts/AuthContext';
import { StatCard, DailyGoalsWidget } from '../components/DashboardWidgets';
import { StopwatchWidget } from '../components/StopwatchWidget';
import CourseDetailsModal from '../components/CourseDetailsModal';
import CertificateModal from '../components/CertificateModal';

interface DashboardPageProps {
  navigateTo: (view: View) => void;
}

const DashboardPage: React.FC<DashboardPageProps> = ({ navigateTo }) => {
  const { user } = useAuth();
  const { progress } = useCourseProgress(JAVASCRIPT_COURSE.id);
  const [showDetails, setShowDetails] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);
  const [showAddQuest, setShowAddQuest] = useState(false);
  const [newQuestTitle, setNewQuestTitle] = useState('');

  const totalLessons = JAVASCRIPT_COURSE.modules.reduce((acc, module) => acc + module.lessons.length, 0);
  const completedLessonsCount = progress.completedLessons.length;
  const progressPercentage = totalLessons > 0 ? (completedLessonsCount / totalLessons) * 100 : 0;

  // Get real-time stats from Firebase
  const { totalXP, dayStreak, totalTimeMinutes, isLoading: statsLoading } = useUserStats(completedLessonsCount);

  const [goals, setGoals] = useState([
    { id: '1', title: 'Complete 2 Lessons', completed: false },
    { id: '2', title: 'Practice "Variables"', completed: true },
    { id: '3', title: 'Spend 30 mins coding', completed: false },
  ]);

  const toggleGoal = (id: string) => {
    setGoals(goals.map(g => g.id === id ? { ...g, completed: !g.completed } : g));
  };

  const addQuest = () => {
    if (!newQuestTitle.trim()) return;
    const newGoal = {
      id: Date.now().toString(),
      title: newQuestTitle.trim(),
      completed: false
    };
    setGoals([...goals, newGoal]);
    setNewQuestTitle('');
    setShowAddQuest(false);
  };

  return (
    <div className="pt-24 md:pt-28 pb-12 px-6 min-h-screen bg-[#0D0D0D] text-white font-sans selection:bg-orange-500/30 selection:text-orange-200">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="text-zinc-500 font-medium mb-1">Overview</p>
            <h1 className="text-4xl md:text-5xl font-medium tracking-tight font-manrope">
              Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">{user?.name.split(' ')[0] || 'Coder'}</span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCertificate(true)}
              className="h-10 px-4 rounded-full bg-gradient-to-r from-orange-600 to-orange-500 text-white border border-orange-400 text-sm font-bold shadow-[0_0_15px_-3px_rgba(249,115,22,0.4)] hover:scale-105 transition-all flex items-center gap-2"
            >
              <i className="fas fa-certificate"></i> Get Certificate
            </button>
            <button className="h-10 px-4 rounded-full bg-zinc-900 border border-white/10 text-zinc-400 text-sm font-medium hover:text-white hover:border-white/20 transition-all flex items-center gap-2">
              <i className="fas fa-calendar-alt"></i> Today
            </button>
            <button
              onClick={() => setShowAddQuest(true)}
              className="h-10 w-10 rounded-full bg-zinc-800 text-zinc-400 border border-white/5 flex items-center justify-center hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-all"
              title="Add Daily Quest"
            >
              <i className="fas fa-plus"></i>
            </button>
          </div>
        </header>

        {/* Stats Row - Real-time data */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total XP"
            value={statsLoading ? '...' : totalXP.toLocaleString()}
            icon="fa-bolt"
            trend={totalXP > 0 ? `+${completedLessonsCount * 50} XP` : undefined}
          />
          <StatCard
            label="Day Streak"
            value={statsLoading ? '...' : `${dayStreak} ${dayStreak === 1 ? 'Day' : 'Days'}`}
            icon="fa-fire"
            trend={dayStreak >= 3 ? 'On fire!' : undefined}
          />
          <StatCard
            label="Lessons Done"
            value={completedLessonsCount}
            icon="fa-check-circle"
            trend={completedLessonsCount > 0 ? `${Math.round(progressPercentage)}% complete` : undefined}
          />
          <StatCard
            label="Time Spent"
            value={statsLoading ? '...' : formatTimeSpent(totalTimeMinutes)}
            icon="fa-clock"
          />
        </div>

        {/* Main Grid: Activity + Courses vs Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left Column (2/3) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Learning Timer - Stopwatch */}
            <StopwatchWidget />

            {/* Course Cards Section */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold font-manrope">Your Courses</h2>
                <button className="text-orange-500 hover:text-orange-400 text-sm font-bold uppercase tracking-wider transition-colors">View All</button>
              </div>

              {/* Enhanced Course Card */}
              <div className="group relative bg-zinc-900/40 border border-white/5 rounded-[2.5rem] p-8 hover:bg-zinc-900/60 transition-all duration-500 overflow-hidden backdrop-blur-sm">
                {/* Background Glow */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 blur-[100px] rounded-full group-hover:bg-orange-500/10 transition-all"></div>

                <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start md:items-center">
                  {/* Icon/Thumbnail */}
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-zinc-800/80 border border-white/5 flex items-center justify-center flex-shrink-0 shadow-xl group-hover:scale-105 transition-transform duration-500">
                    <i className="fab fa-js text-5xl text-yellow-400"></i>
                  </div>

                  {/* Content */}
                  <div className="flex-grow w-full">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-2xl font-bold text-white font-manrope">{JAVASCRIPT_COURSE.title}</h3>
                          <span className="bg-zinc-800 border border-white/10 text-xs font-bold px-2 py-0.5 rounded text-gray-400">BEGINNER</span>
                        </div>
                        <p className="text-zinc-500 text-sm">Master the language of the web.</p>
                      </div>
                      <div className="text-right hidden md:block">
                        <p className="text-3xl font-bold text-white font-manrope">{Math.round(progressPercentage)}%</p>
                        <p className="text-xs text-zinc-500 uppercase tracking-wide">Complete</p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-zinc-800 rounded-full h-2 mb-6 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-orange-600 to-orange-400 h-full rounded-full transition-all duration-1000 ease-out relative"
                        style={{ width: `${Math.max(progressPercentage, 5)}%` }}
                      >
                        <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-4">
                      <button onClick={() => navigateTo('lesson')} className="bg-white text-black hover:bg-orange-500 hover:text-white transition-colors px-6 py-3 rounded-xl font-bold text-sm tracking-wide flex items-center gap-2 group/btn">
                        {progressPercentage > 0 ? 'Continue Lesson' : 'Start Course'}
                        <i className="fas fa-arrow-right transform group-hover/btn:translate-x-1 transition-transform"></i>
                      </button>
                      <button
                        onClick={() => setShowDetails(true)}
                        className="px-4 py-3 rounded-xl border border-white/10 hover:bg-white/5 text-gray-400 hover:text-white transition-colors text-sm font-bold"
                      >
                        <i className="fas fa-list-ul mr-2"></i> Details
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (Sidebar) */}
          <div className="space-y-8">
            {/* Daily Goals */}
            <div className="h-[400px]">
              <DailyGoalsWidget goals={goals} onToggle={toggleGoal} />
            </div>

            {/* AI Assistant Promo Card */}
            <div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-white/5 rounded-[2rem] p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/20 blur-[50px] rounded-full"></div>
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300 mb-4">
                  <i className="fas fa-robot text-xl"></i>
                </div>
                <h3 className="text-xl font-bold text-white font-manrope mb-2">Stuck on code?</h3>
                <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
                  Your AI tutor is ready to help you debug and understand complex concepts instantly.
                </p>
                <button onClick={() => navigateTo('lesson')} className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm transition-colors shadow-lg shadow-purple-600/20">
                  Ask AI Tutor
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>

      <CourseDetailsModal
        isOpen={showDetails}
        onClose={() => setShowDetails(false)}
        course={{ ...JAVASCRIPT_COURSE, totalDuration: '4 Weeks' }} // Augment with duration as per typical display
        onStartCourse={() => {
          setShowDetails(false);
          navigateTo('lesson');
        }}
      />

      <CertificateModal
        isOpen={showCertificate}
        onClose={() => setShowCertificate(false)}
        courseName="JavaScript Mastery"
      />

      {/* Add Quest Modal */}
      {showAddQuest && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2 font-manrope">
              <i className="fas fa-plus-circle text-orange-500"></i>
              Add Daily Quest
            </h3>

            <input
              type="text"
              value={newQuestTitle}
              onChange={(e) => setNewQuestTitle(e.target.value)}
              placeholder="e.g., Complete 1 lesson today"
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500/50 mb-4"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && addQuest()}
            />

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowAddQuest(false);
                  setNewQuestTitle('');
                }}
                className="flex-1 px-4 py-3 rounded-xl bg-white/5 text-zinc-400 hover:bg-white/10 transition-all font-medium"
              >
                Cancel
              </button>
              <button
                onClick={addQuest}
                disabled={!newQuestTitle.trim()}
                className={`flex-1 px-4 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${newQuestTitle.trim()
                  ? 'bg-gradient-to-r from-orange-600 to-orange-500 text-white hover:from-orange-500 hover:to-orange-400'
                  : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                  }`}
              >
                <i className="fas fa-plus"></i>
                Add Quest
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
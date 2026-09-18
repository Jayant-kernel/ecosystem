
import React, { useState, useCallback, useEffect } from 'react';
import LandingPage from './components/CourseSelection';
import DashboardPage from './pages/DashboardPage';
import LearningView from './components/LearningView';
import { DEFAULT_COURSE_ID, getCourseById, isCoursePublic } from './constants';
import CoursesPage from './pages/CoursesPage';
import ExplanationsPage from './pages/ExplanationsPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';

export type View = 'landing' | 'courses' | 'dashboard' | 'lesson' | 'explanations' | 'login' | 'signup';

/** Navigate to a view, optionally switching the active course first. */
export type NavigateFn = (view: View, courseId?: string) => void;

const MainApp: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('landing');
  const [activeCourseId, setActiveCourseId] = useState<string>(DEFAULT_COURSE_ID);
  const { user, loading } = useAuth();

  const activeCourse = getCourseById(activeCourseId);

  const navigateTo = useCallback<NavigateFn>((view, courseId) => {
    const targetCourseId = courseId ?? activeCourseId;
    if (courseId) {
      setActiveCourseId(courseId);
    }
    // Protected routes — skipped for public (no-auth) courses.
    const protectedViews: View[] = ['dashboard', 'lesson', 'explanations'];
    const bypassAuth = isCoursePublic(targetCourseId);
    if (protectedViews.includes(view) && !user && !loading && !bypassAuth) {
       setCurrentView('login');
       window.scrollTo(0, 0);
       return;
    }
    setCurrentView(view);
    window.scrollTo(0, 0);
  }, [user, loading, activeCourseId]);

  // Effect to handle initial load redirection if on a protected route
  useEffect(() => {
      if (!loading) {
          const protectedViews: View[] = ['dashboard', 'lesson', 'explanations'];
          const bypassAuth = isCoursePublic(activeCourseId);
          if (protectedViews.includes(currentView) && !user && !bypassAuth) {
              setCurrentView('login');
          }
          // Redirect from auth pages if already logged in
          if ((currentView === 'login' || currentView === 'signup') && user) {
              setCurrentView('dashboard');
          }
      }
  }, [currentView, user, loading, activeCourseId]);

  const renderContent = () => {
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                 <i className="fas fa-circle-notch fa-spin text-brand-green text-4xl"></i>
            </div>
        );
    }

    switch (currentView) {
      case 'landing':
        return <LandingPage navigateTo={navigateTo} />;
      case 'courses':
        return <CoursesPage navigateTo={navigateTo} activeCourseId={activeCourseId} />;
      case 'dashboard':
        return <DashboardPage navigateTo={navigateTo} activeCourse={activeCourse} />;
      case 'lesson':
        return <LearningView course={activeCourse} navigateTo={navigateTo} />;
      case 'explanations':
        return <ExplanationsPage navigateTo={navigateTo} />;
      case 'login':
        return <LoginPage navigateTo={navigateTo} />;
      case 'signup':
        return <SignupPage navigateTo={navigateTo} />;
      default:
        return <LandingPage navigateTo={navigateTo} />;
    }
  };
  
  // Views that don't need standard Nav/Footer
  if (currentView === 'lesson') {
    return renderContent();
  }

  return (
    <>
      <Navbar navigateTo={navigateTo} currentView={currentView} />
      <main>{renderContent()}</main>
      <Footer />
    </>
  );
};

const App: React.FC = () => {
    return (
        <ThemeProvider>
            <AuthProvider>
                <MainApp />
            </AuthProvider>
        </ThemeProvider>
    );
};

export default App;

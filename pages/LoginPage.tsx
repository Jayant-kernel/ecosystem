
import React, { useState } from 'react';
import { View } from '../App';
import { useAuth } from '../contexts/AuthContext';

interface LoginPageProps {
    navigateTo: (view: View) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ navigateTo }) => {
    const { login, loginWithGoogle, loginAsGuest } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await login(email, password);
            navigateTo('courses');
        } catch (err: any) {
            setError(err.message || 'Failed to sign in');
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            setError('');
            await loginWithGoogle();
            // Redirect handled by auth state listener
        } catch (err: any) {
             setError(err.message || 'Failed to sign in with Google');
        }
    }

    const handleGuestLogin = async () => {
        try {
            setError('');
            setIsLoading(true);
            await loginAsGuest();
             // Redirect handled by auth state listener
        } catch (err: any) {
            setError(err.message || 'Failed to sign in as guest');
            setIsLoading(false);
        }
    }

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 flex items-center justify-center relative">
            {/* Test Mode Button */}
            <button 
                onClick={handleGuestLogin}
                className="absolute top-24 right-4 md:right-8 text-gray-600 hover:text-brand-green text-xs flex items-center gap-2 opacity-60 hover:opacity-100 transition-all border border-[#262626] hover:border-brand-green/30 rounded-full px-3 py-1.5"
                title="Use for testing without an account"
            >
                <i className="fas fa-user-secret"></i>
                Test Mode (Guest)
            </button>

            <div className="dark-card w-full max-w-md p-8 rounded-xl border-[#262626]">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
                    <p className="text-gray-400">Sign in to continue your learning</p>
                </div>

                {error && (
                    <div className="bg-red-900/20 border border-red-500/50 text-red-200 p-3 rounded-lg mb-6 text-sm">
                        <i className="fas fa-exclamation-circle mr-2"></i>
                        {error}
                    </div>
                )}

                <div className="space-y-4">
                    <button
                        onClick={handleGoogleLogin}
                        type="button"
                        className="w-full bg-white text-gray-900 py-3 rounded-lg font-semibold text-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
                    >
                        <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-6 h-6 mr-3" />
                        Sign in with Google
                    </button>

                    <div className="flex items-center my-6">
                        <div className="flex-grow h-px bg-[#262626]"></div>
                        <span className="px-4 text-gray-500 text-sm">OR</span>
                        <div className="flex-grow h-px bg-[#262626]"></div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <i className="fas fa-envelope text-gray-500"></i>
                            </div>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-[#0D0D0D] border border-[#262626] rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-brand-green transition-colors"
                                placeholder="you@example.com"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <i className="fas fa-lock text-gray-500"></i>
                            </div>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-[#0D0D0D] border border-[#262626] rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-brand-green transition-colors"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className={`w-full btn-primary py-3 rounded-lg font-semibold text-lg flex items-center justify-center ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        {isLoading ? (
                            <><i className="fas fa-spinner fa-spin mr-2"></i> Signing in...</>
                        ) : (
                            'Sign In'
                        )}
                    </button>
                </form>

                <p className="text-center text-gray-400 mt-8">
                    Ready to start learning?{' '}
                    <button onClick={() => navigateTo('courses')} className="text-brand-green hover:underline font-medium">
                        Browse Courses
                    </button>
                </p>
            </div>
        </div>
    );
};

export default LoginPage;

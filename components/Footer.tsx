import React from 'react';

const Footer: React.FC = () => {
    return (
        <footer className="relative w-full bg-zinc-900/30 pt-24 pb-8 border-t border-white/5 backdrop-blur-sm z-20">
            <div className="w-full max-w-7xl mx-auto px-6">
                <div className="grid lg:grid-cols-12 gap-16 mb-24">
                    {/* Brand Column */}
                    <div className="lg:col-span-5 flex flex-col">
                        <h3 className="text-5xl font-medium text-white tracking-tighter font-manrope mb-4">Eco<span className="text-zinc-600">system</span></h3>
                        <p className="text-zinc-500 text-sm font-sans max-w-xs">
                            The conversational coding companion for the next generation of developers.
                        </p>
                    </div>

                    {/* Links Columns */}
                    <div className="lg:col-span-7">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-10">
                            <div className="flex flex-col gap-8">
                                <h4 className="text-base font-medium text-white font-manrope">Product</h4>
                                <div className="flex flex-col gap-4">
                                    <a href="#" className="text-zinc-400 hover:text-white transition-colors text-sm font-sans">Features</a>
                                    <a href="#" className="text-zinc-400 hover:text-white transition-colors text-sm font-sans">Integrations</a>
                                    <a href="#" className="text-zinc-400 hover:text-white transition-colors text-sm font-sans">Changelog</a>
                                </div>
                            </div>

                            <div className="flex flex-col gap-8">
                                <h4 className="text-base font-medium text-white font-manrope">Resources</h4>
                                <div className="flex flex-col gap-4">
                                    <a href="#" className="text-zinc-400 hover:text-white transition-colors text-sm font-sans">Documentation</a>
                                    <a href="#" className="text-zinc-400 hover:text-white transition-colors text-sm font-sans">Community</a>
                                    <a href="#" className="text-zinc-400 hover:text-white transition-colors text-sm font-sans">Help Center</a>
                                    <a href="#" className="text-zinc-400 hover:text-white transition-colors text-sm font-sans">API Status</a>
                                </div>
                            </div>

                            <div className="flex flex-col gap-8">
                                <h4 className="text-base font-medium text-white font-manrope">Social</h4>
                                <div className="flex flex-col gap-4">
                                    <a href="#" className="group flex items-center gap-3 text-zinc-400 hover:text-white transition-colors text-sm font-sans">
                                        <i className="fab fa-twitter text-lg"></i>
                                        Twitter
                                    </a>
                                    <a href="#" className="group flex items-center gap-3 text-zinc-400 hover:text-white transition-colors text-sm font-sans">
                                        <i className="fab fa-github text-lg"></i>
                                        GitHub
                                    </a>
                                    <a href="#" className="group flex items-center gap-3 text-zinc-400 hover:text-white transition-colors text-sm font-sans">
                                        <i className="fab fa-discord text-lg"></i>
                                        Discord
                                    </a>
                                    <a href="#" className="group flex items-center gap-3 text-zinc-400 hover:text-white transition-colors text-sm font-sans">
                                        <i className="fab fa-youtube text-lg"></i>
                                        YouTube
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
                    <p className="text-xs text-zinc-500 font-sans">Copyright © 2024 Ecosystem</p>

                    <div className="flex items-center gap-10">
                        <a href="#" className="text-xs text-zinc-500 hover:text-white transition-colors font-sans">Privacy Policy</a>
                        <a href="#" className="text-xs text-zinc-500 hover:text-white transition-colors font-sans">Terms of Service</a>
                        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="group flex items-center gap-3 text-xs text-zinc-500 hover:text-white transition-colors font-sans uppercase tracking-wider">
                            Back to top
                            <div className="w-6 h-6 rounded border border-zinc-800 flex items-center justify-center group-hover:border-zinc-600 group-hover:bg-zinc-800 transition-all">
                                <i className="fas fa-arrow-up"></i>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;

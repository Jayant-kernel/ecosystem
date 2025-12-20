import React, { useState } from 'react';
import { View } from '../App';

interface PricingPageProps {
    navigateTo: (view: View) => void;
}

const PricingPage: React.FC<PricingPageProps> = ({ navigateTo }) => {
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

    const plans = [
        {
            name: 'Starter',
            price: 0,
            description: 'Perfect for exploring the basics.',
            features: [
                '30 min daily voice sessions',
                'Basic debugging help',
                'Community support',
                'Access to free courses'
            ],
            cta: 'Get Started',
            highlight: false
        },
        {
            name: 'Pro',
            price: billingCycle === 'monthly' ? 499 : 399,
            description: 'For serious learners who want mastery.',
            features: [
                'Unlimited voice sessions',
                'Advanced AI debugging (GPT-4)',
                'Code quality reviews',
                'Priority 24/7 support',
                'Real-world projects',
                'Certificate of completion'
            ],
            cta: 'Start Free Trial',
            highlight: true
        },
        {
            name: 'Team',
            price: billingCycle === 'monthly' ? 1999 : 1599,
            description: 'Scale your team\'s engineering skills.',
            features: [
                'Everything in Pro',
                'Team collaboration tools',
                'Custom learning paths',
                'Admin dashboard',
                'Single Sign-On (SSO)',
                'Dedicated Success Manager'
            ],
            cta: 'Contact Sales',
            highlight: false
        }
    ];

    return (
        <section id="pricing" className="pt-32 pb-20 px-4 min-h-screen bg-[#0D0D0D] text-white selection:bg-orange-500/30 selection:text-orange-200">
            <div className="max-w-7xl mx-auto relative">
                {/* Background glow for Pricing */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-500/5 blur-[100px] rounded-full pointer-events-none -z-10"></div>

                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-6xl font-bold font-manrope mb-6">
                        Invest in Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">Future</span>
                    </h2>
                    <p className="text-xl text-zinc-400 mb-10 max-w-2xl mx-auto">
                        Simple, transparent pricing. No hidden fees. Cancel anytime.
                    </p>

                    {/* Billing Toggle */}
                    <div className="flex items-center justify-center gap-4 mb-4">
                        <span className={`text-sm font-bold tracking-wide transition-colors ${billingCycle === 'monthly' ? 'text-white' : 'text-zinc-500'}`}>Monthly</span>
                        <button
                            onClick={() => setBillingCycle(prev => prev === 'monthly' ? 'yearly' : 'monthly')}
                            className="w-16 h-8 bg-zinc-800 rounded-full relative border border-white/10 transition-colors hover:border-orange-500/50"
                        >
                            <div className={`absolute top-1 left-1 w-6 h-6 bg-orange-500 rounded-full transition-transform duration-300 shadow-lg ${billingCycle === 'yearly' ? 'translate-x-8' : ''}`}></div>
                        </button>
                        <span className={`text-sm font-bold tracking-wide transition-colors ${billingCycle === 'yearly' ? 'text-white' : 'text-zinc-500'}`}>
                            Yearly <span className="text-orange-500 text-xs ml-1 font-extrabold uppercase">Save 20%</span>
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-center">
                    {plans.map((plan, index) => (
                        <div
                            key={plan.name}
                            className={`
                            relative p-8 rounded-[2rem] border transition-all duration-500 flex flex-col h-full
                            ${plan.highlight
                                    ? 'bg-zinc-900/60 border-orange-500/50 shadow-2xl shadow-orange-500/10 scale-105 z-10 backdrop-blur-xl'
                                    : 'bg-zinc-900/20 border-white/5 hover:bg-zinc-900/40 hover:border-white/10 backdrop-blur-sm scale-100'}
                        `}
                        >
                            {plan.highlight && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-600 to-orange-500 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg">
                                    Most Popular
                                </div>
                            )}

                            <div className="mb-8">
                                <h3 className="text-2xl font-bold font-manrope mb-2">{plan.name}</h3>
                                <p className="text-zinc-400 text-sm h-10">{plan.description}</p>
                            </div>

                            <div className="mb-8 flex items-baseline">
                                <span className="text-5xl font-bold font-manrope tracking-tight">₹{plan.price}</span>
                                <span className="text-zinc-500 ml-2">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
                            </div>

                            <ul className="space-y-4 mb-8 flex-grow">
                                {plan.features.map((feature, i) => (
                                    <li key={i} className="flex items-start gap-3 text-sm text-zinc-300">
                                        <div className={`mt-1 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${plan.highlight ? 'bg-orange-500/20 text-orange-500' : 'bg-zinc-800 text-zinc-500'}`}>
                                            <i className="fas fa-check text-[10px]"></i>
                                        </div>
                                        {feature}
                                    </li>
                                ))}
                            </ul>

                            <button
                                onClick={() => navigateTo('dashboard')}
                                className={`
                                w-full py-4 rounded-xl font-bold text-sm tracking-wide transition-all duration-300
                                ${plan.highlight
                                        ? 'bg-gradient-to-r from-orange-600 to-orange-500 text-white hover:shadow-lg hover:shadow-orange-500/25 hover:scale-[1.02]'
                                        : 'bg-white text-black hover:bg-zinc-200'}
                            `}
                            >
                                {plan.cta}
                            </button>
                        </div>
                    ))}
                </div>

                <div className="mt-20 text-center border-t border-white/5 pt-12">
                    <p className="text-zinc-500 text-sm">
                        Trusted by developers from leading companies
                    </p>
                    <div className="flex justify-center gap-8 mt-6 opacity-30 grayscale hover:grayscale-0 transition-all duration-500">
                        <i className="fab fa-google text-2xl"></i>
                        <i className="fab fa-microsoft text-2xl"></i>
                        <i className="fab fa-amazon text-2xl"></i>
                        <i className="fab fa-spotify text-2xl"></i>
                        <i className="fab fa-airbnb text-2xl"></i>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default PricingPage;

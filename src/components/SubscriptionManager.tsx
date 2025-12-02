const STRIPE_PRICES = {
    'SingleGame': 'prod_TX2ui0KGIr7cPq', 
    'SeasonPass': 'prod_TX2wbve6RNrxVW',
    'ProMonthly': 'prod_TX2zJzJsKM5Wm3',
    'ProAnnual':  'prod_TX36ZrnaHQU1Mu',
};
import React, { useState } from 'react';
import { SubscriptionTier } from '../types';
import { Check, X, Zap, Crown, Activity, BarChart2, CreditCard, Lock, Loader2, ShieldCheck, Calendar } from 'lucide-react';
import SeamStrikeLogo from './SeamStrikeLogo.tsx';

interface SubscriptionManagerProps {
  currentTier: SubscriptionTier;
  onUpgrade: (tier: SubscriptionTier) => void;
  sport?: 'Baseball' | 'Softball';
}

interface PlanDetails {
    tier: SubscriptionTier;
    name: string;
    price: string;
    period?: string;
}

const PaymentModal = ({ plan, onClose, onConfirm }: { plan: PlanDetails, onClose: () => void, onConfirm: () => void }) => {
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<'form' | 'processing' | 'success'>('form');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setStep('processing');
        
        // Simulate payment processing
        setTimeout(() => {
            setStep('success');
            setTimeout(() => {
                onConfirm();
            }, 1500);
        }, 2000);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 z-10">
                    <X className="w-6 h-6" />
                </button>

                <div className="bg-slate-50 p-6 border-b border-slate-100">
                    <div className="flex items-center space-x-3 mb-1">
                        <div className="bg-indigo-600 p-2 rounded-lg">
                            <CreditCard className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">Secure Checkout</h3>
                    </div>
                    <div className="flex justify-between items-end mt-4">
                        <div>
                            <p className="text-sm text-slate-500 font-medium">Selected Plan</p>
                            <p className="text-xl font-bold text-indigo-900">{plan.name}</p>
                        </div>
                        <div className="text-right">
                            <span className="text-2xl font-bold text-slate-900">{plan.price}</span>
                            {plan.period && <span className="text-slate-500 text-sm font-medium">{plan.period}</span>}
                        </div>
                    </div>
                </div>

                <div className="p-6">
                    {step === 'form' && (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Name on Card</label>
                                    <input required type="text" placeholder="Coach John Doe" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium transition-all" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Card Number</label>
                                    <div className="relative">
                                        <input required type="text" placeholder="0000 0000 0000 0000" className="w-full p-3 pl-12 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-mono font-medium transition-all" />
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex space-x-1">
                                            <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                            <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Expiry</label>
                                        <input required type="text" placeholder="MM/YY" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-mono font-medium transition-all text-center" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">CVC</label>
                                        <input required type="text" placeholder="123" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-mono font-medium transition-all text-center" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Billing Zip</label>
                                    <input required type="text" placeholder="12345" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium transition-all" />
                                </div>
                            </div>

                            <button type="submit" className="w-full py-4 bg-emerald-600 text-white font-bold rounded-xl shadow-lg hover:bg-emerald-700 transition-all transform active:scale-[0.98] mt-6 flex items-center justify-center">
                                <Lock className="w-4 h-4 mr-2" />
                                Pay {plan.price}
                            </button>
                            
                            <div className="flex items-center justify-center text-xs text-slate-400 mt-4">
                                <ShieldCheck className="w-3 h-3 mr-1.5 text-emerald-500" />
                                SSL Encrypted Payment
                            </div>
                        </form>
                    )}

                    {step === 'processing' && (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
                            <h4 className="text-lg font-bold text-slate-800">Processing Payment...</h4>
                            <p className="text-slate-500 text-sm">Securely contacting bank</p>
                        </div>
                    )}

                    {step === 'success' && (
                        <div className="flex flex-col items-center justify-center py-8 animate-in zoom-in duration-300">
                            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4 text-emerald-600">
                                <Check className="w-8 h-8" />
                            </div>
                            <h4 className="text-xl font-bold text-emerald-700 mb-1">Payment Successful!</h4>
                            <p className="text-slate-500 text-sm">Upgrading your account...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

const SubscriptionManager: React.FC<SubscriptionManagerProps> = ({ currentTier, onUpgrade, sport }) => {
  const [selectedPlan, setSelectedPlan] = useState<PlanDetails | null>(null);
  
  const isPro = currentTier === 'ProAnnual' || currentTier === 'ProMonthly';

const handleSelectPlan = async (tier: SubscriptionTier, name: string, price: string, period?: string) => {
    
    const priceId = STRIPE_PRICES[tier as keyof typeof STRIPE_PRICES];
    if (!priceId) {
        alert("Configuration Error: Price ID not found.");
        return;
    }

    try {
        const response = await fetch('/api/create-checkout-session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ priceId }),
        });

        const data = await response.json();
        
        if (data.url) {
            // Redirect the user to Stripe to pay
            window.location.href = data.url;
        } else {
            alert("Error creating payment session.");
        }
    } catch (error) {
        console.error("Payment Error:", error);
        alert("Could not connect to payment processor.");
    }
};

  const handleCheckoutComplete = () => {
      if (selectedPlan) {
          onUpgrade(selectedPlan.tier);
          setSelectedPlan(null);
      }
  };

  const features = [
    // Core / Free Features
    { name: "Roster Management (40 Players)", free: true, single: true, season: true, pro: true },
    { name: "Game Mode (Scoreboard, Field & Whiteboard)", free: true, single: true, season: true, pro: true },
    { name: "Lineup Builder (AI & Manual Interactive)", free: true, single: true, season: true, pro: true },
    { name: "Seam Meeting (Coaches Chat)", free: true, single: true, season: true, pro: true },
    
    // Flexible / Season Features
    { name: "Season Manager (Schedule, Standings & Weather)", free: false, single: false, season: true, pro: true },
    { name: "SeamScore™ (Live Lineup & Pitch Counts)", free: false, single: "1 Game", season: true, pro: true },
    { name: "SeamStats™ (Spray Charts & Trends)", free: false, single: false, season: true, pro: true },
    { name: "Practice Planner & Individual Workouts", free: false, single: "1 Plan", season: true, pro: true },
    
    // Pro Features
    { name: "AI Video Analysis (Mechanics & Drills)", free: false, single: false, season: false, pro: true },
    { name: "Defense Builder (AI & Manual Grid)", free: false, single: false, season: false, pro: true },
    { name: "Opponent Scouting Reports", free: false, single: false, season: false, pro: true },
    { name: "Priority Support", free: false, single: false, season: false, pro: true },
  ];

  const renderCheck = (value: boolean | string) => {
      if (value === true) return <Check className="w-5 h-5 text-emerald-500 mx-auto" />;
      if (value === false) return <div className="w-1.5 h-1.5 bg-slate-300 rounded-full mx-auto"></div>;
      return <span className="text-xs font-bold text-slate-700 bg-slate-200 px-2 py-1 rounded-full">{value}</span>;
  };

  return (
    <div className="h-full bg-slate-50 overflow-y-auto">
      {selectedPlan && (
          <PaymentModal 
            plan={selectedPlan} 
            onClose={() => setSelectedPlan(null)} 
            onConfirm={handleCheckoutComplete} 
          />
      )}

      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-16">
          <div className="flex justify-center mb-4">
            <SeamStrikeLogo className="w-16 h-16" sport={sport} />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4">
            Unleash Your Team's <span className="text-indigo-600">Full Potential</span>
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Get the competitive advantage with SeamStrike Pro. Advanced analytics, AI-powered strategy, and professional management tools.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12 relative">
             {/* Free Tier */}
             <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 flex flex-col">
                <div className="mb-4">
                    <h3 className="text-lg font-bold text-slate-500 uppercase tracking-wider">Starter</h3>
                    <div className="mt-4 flex items-baseline text-slate-900">
                        <span className="text-5xl font-extrabold tracking-tight">Free</span>
                    </div>
                    <p className="mt-2 text-slate-500">Essential tools for managing your team.</p>
                </div>
                <div className="flex-grow">
                   <ul className="space-y-4">
                      <li className="flex items-start">
                          <Check className="w-5 h-5 text-emerald-500 mr-3 shrink-0" />
                          <span className="text-slate-600 font-medium">Roster Management</span>
                      </li>
                      <li className="flex items-start">
                          <Check className="w-5 h-5 text-emerald-500 mr-3 shrink-0" />
                          <span className="text-slate-600 font-medium">Game Mode & Whiteboard</span>
                      </li>
                      <li className="flex items-start">
                          <Check className="w-5 h-5 text-emerald-500 mr-3 shrink-0" />
                          <span className="text-slate-600 font-medium">Team Chat</span>
                      </li>
                      <li className="flex items-start">
                          <Check className="w-5 h-5 text-emerald-500 mr-3 shrink-0" />
                          <span className="text-slate-600 font-medium">SeamStrike Intelligence</span>
                      </li>
                   </ul>
                </div>
                <button className="mt-8 block w-full py-3 px-6 border border-slate-300 rounded-xl text-center font-bold text-slate-600 bg-slate-50 cursor-default">
                    Current Plan
                </button>
             </div>

             {/* Monthly Pro */}
             <div className="bg-white rounded-2xl shadow-lg border border-indigo-100 p-8 flex flex-col relative transform md:-translate-y-4">
                <div className="absolute top-0 inset-x-0 h-2 bg-indigo-500 rounded-t-2xl"></div>
                <div className="mb-4">
                    <h3 className="text-lg font-bold text-indigo-600 uppercase tracking-wider flex items-center">
                        <Zap className="w-4 h-4 mr-2" />
                        Pro Monthly
                    </h3>
                    <div className="mt-4 flex items-baseline text-slate-900">
                        <span className="text-5xl font-extrabold tracking-tight">$19.99</span>
                        <span className="ml-1 text-xl font-semibold text-slate-500">/mo</span>
                    </div>
                    <p className="mt-2 text-slate-500">Flexible access to all premium features.</p>
                </div>
                <div className="flex-grow">
                   <ul className="space-y-4">
                      <li className="flex items-center text-indigo-900 font-bold">
                          <Check className="w-5 h-5 text-indigo-600 mr-3 shrink-0" />
                          Everything in Free, plus:
                      </li>
                      <li className="flex items-start">
                          <Check className="w-5 h-5 text-emerald-500 mr-3 shrink-0" />
                          <span className="text-slate-600 font-medium">Season Manager & AI</span>
                      </li>
                      <li className="flex items-start">
                          <Check className="w-5 h-5 text-emerald-500 mr-3 shrink-0" />
                          <span className="text-slate-600 font-medium">Video Analysis</span>
                      </li>
                      <li className="flex items-start">
                          <Check className="w-5 h-5 text-emerald-500 mr-3 shrink-0" />
                          <span className="text-slate-600 font-medium">Scouting Reports</span>
                      </li>
                   </ul>
                </div>
                <button 
                    onClick={() => handleSelectPlan('ProMonthly', 'SeamStrike Pro Monthly', '$19.99', '/mo')}
                    className={`mt-8 block w-full py-3 px-6 rounded-xl text-center font-bold text-white transition-all shadow-lg hover:shadow-xl ${currentTier === 'ProMonthly' ? 'bg-slate-800 cursor-default' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                    disabled={currentTier === 'ProMonthly'}
                >
                    {currentTier === 'ProMonthly' ? 'Active Plan' : 'Subscribe Monthly'}
                </button>
             </div>

             {/* Annual Pro */}
             <div className="bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 p-8 flex flex-col relative overflow-hidden transform md:-translate-y-8">
                <div className="absolute top-0 right-0 bg-amber-500 text-amber-900 text-xs font-bold px-4 py-1 rounded-bl-xl z-10">
                    SAVE 58%
                </div>
                {/* Background glow */}
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-600/20 rounded-full blur-3xl"></div>
                
                <div className="mb-4 relative z-10">
                    <h3 className="text-lg font-bold text-amber-400 uppercase tracking-wider flex items-center">
                        <Crown className="w-4 h-4 mr-2" />
                        Pro Annual
                    </h3>
                    <div className="mt-4 flex items-baseline text-white">
                        <span className="text-5xl font-extrabold tracking-tight">$99.99</span>
                        <span className="ml-1 text-xl font-semibold text-slate-400">/yr</span>
                    </div>
                    <p className="mt-2 text-slate-400 italic">Total Domination 24/7/365</p>
                </div>
                <div className="flex-grow relative z-10">
                   <ul className="space-y-4">
                      <li className="flex items-center text-white font-bold">
                          <Check className="w-5 h-5 text-amber-400 mr-3 shrink-0" />
                          All Pro Features Included
                      </li>
                      <li className="flex items-start">
                          <Check className="w-5 h-5 text-emerald-500 mr-3 shrink-0" />
                          <span className="text-slate-300 font-medium">Unlimited Access</span>
                      </li>
                      <li className="flex items-start">
                          <Check className="w-5 h-5 text-emerald-500 mr-3 shrink-0" />
                          <span className="text-slate-300 font-medium">Priority Support</span>
                      </li>
                      <li className="flex items-start">
                          <Check className="w-5 h-5 text-emerald-500 mr-3 shrink-0" />
                          <span className="text-slate-300 font-medium">Early Access to New Features</span>
                      </li>
                   </ul>
                </div>
                <button 
                    onClick={() => handleSelectPlan('ProAnnual', 'SeamStrike Pro Annual', '$99.99', '/yr')}
                    className={`mt-8 block w-full py-4 px-6 rounded-xl text-center font-bold text-slate-900 transition-all shadow-lg hover:shadow-xl hover:scale-105 ${currentTier === 'ProAnnual' ? 'bg-slate-700 text-white cursor-default' : 'bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400'}`}
                    disabled={currentTier === 'ProAnnual'}
                >
                    {currentTier === 'ProAnnual' ? 'Active Plan' : 'Get Annual Access'}
                </button>
             </div>
        </div>

        {/* Flexible Passes Section */}
        <div className="max-w-4xl mx-auto mb-16">
            <div className="flex items-center justify-center mb-8 space-x-4">
                <div className="h-px bg-slate-300 w-16"></div>
                <h3 className="text-lg font-bold text-slate-500 uppercase tracking-widest">Flexible Passes</h3>
                <div className="h-px bg-slate-300 w-16"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Single Game Option */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col items-center text-center hover:border-amber-400 transition-all group">
                    <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-4 text-amber-600 group-hover:scale-110 transition-transform">
                        <Activity className="w-6 h-6" /> 
                    </div>
                    <h4 className="text-lg font-bold text-slate-800">SeamScore™ Single Game</h4>
                    <p className="text-slate-500 text-sm mb-4">One-time unlock for live lineup tracking and real-time scoring.</p>
                    <span className="text-3xl font-bold text-slate-900 mb-6">$0.99</span>
                    <button 
                        onClick={() => handleSelectPlan('SingleGame', 'Single Game Pass', '$0.99', '')}
                        className="w-full py-2 border border-slate-300 rounded-lg text-slate-600 font-bold hover:bg-amber-50 hover:text-amber-700 hover:border-amber-300 transition-colors"
                    >
                        Buy Single Pass
                    </button>
                </div>

                {/* Season Pass Option */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col items-center text-center hover:border-emerald-500 transition-all relative overflow-hidden group">
                    <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl shadow-sm">SEASON VALUE</div>
                    <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-4 text-emerald-600 group-hover:scale-110 transition-transform">
                        <BarChart2 className="w-6 h-6" />
                    </div>
                    <h4 className="text-lg font-bold text-slate-800">Seamhead Season Pass</h4>
                    <p className="text-slate-500 text-sm mb-4">
                        Full season access to <span className="font-bold text-slate-700">Season Manager</span>, <span className="font-bold text-slate-700">SeamScore™</span> & <span className="font-bold text-slate-700">SeamStats™</span>.
                    </p>
                    <span className="text-3xl font-bold text-slate-900 mb-6">$9.99</span>
                    <button 
                        onClick={() => handleSelectPlan('SeasonPass', 'Seamhead Season Pass', '$9.99', '')}
                        className="w-full py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition-colors shadow-md hover:shadow-lg"
                    >
                        Buy Season Pass
                    </button>
                </div>
            </div>
        </div>

        {/* Comparison Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
             <div className="p-6 bg-slate-50 border-b border-slate-200">
                 <h2 className="text-2xl font-bold text-slate-900 text-center">Feature Comparison</h2>
             </div>
             <div className="overflow-x-auto">
                 <table className="w-full">
                     <thead>
                         <tr className="bg-white">
                             <th className="py-4 px-6 text-left text-sm font-bold text-slate-500 uppercase tracking-wider w-1/3">Feature</th>
                             <th className="py-4 px-4 text-center text-sm font-bold text-slate-500 uppercase tracking-wider">Free</th>
                             <th className="py-4 px-4 text-center text-sm font-bold text-amber-600 uppercase tracking-wider bg-amber-50/30">Single</th>
                             <th className="py-4 px-4 text-center text-sm font-bold text-emerald-600 uppercase tracking-wider bg-emerald-50/30">Season</th>
                             <th className="py-4 px-4 text-center text-sm font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50/50">Pro</th>
                         </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                         {features.map((feature, idx) => (
                             <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                 <td className="py-4 px-6 text-slate-800 font-medium">{feature.name}</td>
                                 <td className="py-4 px-4 text-center">
                                     {renderCheck(feature.free)}
                                 </td>
                                 <td className="py-4 px-4 text-center bg-amber-50/10">
                                     {renderCheck(feature.single)}
                                 </td>
                                 <td className="py-4 px-4 text-center bg-emerald-50/10">
                                     {renderCheck(feature.season)}
                                 </td>
                                 <td className="py-4 px-4 text-center bg-indigo-50/30">
                                     {renderCheck(feature.pro)}
                                 </td>
                             </tr>
                         ))}
                     </tbody>
                 </table>
             </div>
        </div>

        <div className="mt-12 text-center">
             <p className="text-slate-500 text-sm mb-4">
                 Need to manage a large organization or league?
             </p>
             <button className="text-indigo-600 font-bold hover:underline">Contact Sales for Enterprise</button>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionManager;

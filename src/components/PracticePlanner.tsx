
import React, { useState } from 'react';
import { LeagueSettings, PracticePlanRequest, SeasonPhase, SubscriptionTier, Player, IndividualWorkoutRequest } from '../types';
import { generatePracticePlan, generateIndividualWorkout } from '../services/geminiService.ts';
import { Lock, Zap, Calendar, Clipboard, Download, Mail, Loader2, CheckCircle2, Star, User, Activity, AlertTriangle } from 'lucide-react';
import InfoTooltip from './InfoTooltip.tsx';

interface PracticePlannerProps {
  league: LeagueSettings;
  subscriptionTier: SubscriptionTier;
  onUpgrade: (tier: SubscriptionTier) => void;
  roster: Player[];
}

type Tab = 'team' | 'individual';

const PracticePlanner: React.FC<PracticePlannerProps> = ({ league, subscriptionTier, onUpgrade, roster }) => {
  const [activeTab, setActiveTab] = useState<Tab>('team');
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState("");
  
  // Team Request State
  const [request, setRequest] = useState<PracticePlanRequest>({
    numPractices: 2,
    seasonPhase: 'Regular Season',
    opponentName: '',
    scoutingNotes: '',
    focusAreas: '',
    practiceDurationMinutes: 60,
    numberOfPlayers: roster.length || 9,
    selectedFocuses: []
  });

  // Individual Request State
  const [indivRequest, setIndivRequest] = useState<IndividualWorkoutRequest>({
    playerId: '',
    playerName: '',
    position: '',
    focusArea: '',
    intensity: 'Maintenance',
    durationMinutes: 30
  });

  const hasAccess = subscriptionTier !== 'Free';

  const handleGenerate = async () => {
    setLoading(true);
    setPlan(""); // Clear previous
    if (activeTab === 'team') {
        const result = await generatePracticePlan(request, league);
        setPlan(result);
    } else {
        const player = roster.find(p => p.id === indivRequest.playerId);
        const statsStr = player ? `AVG: ${player.battingAvg}, OPS: ${player.ops}, ERR: ${player.fieldingErrors}` : '';
        const result = await generateIndividualWorkout(indivRequest, statsStr, league);
        setPlan(result);
    }
    setLoading(false);
  };

  const handleDownload = () => {
    // Mock download
    const element = document.createElement("a");
    const file = new Blob([plan], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `Plan_${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(element);
    element.click();
    alert("Plan downloaded successfully!");
  };

  const handleEmail = () => {
    alert(`Plan sent to coach@${league.name.replace(/\s+/g, '').toLowerCase()}.com`);
  };

  const handlePlayerSelect = (playerId: string) => {
      const player = roster.find(p => p.id === playerId);
      if (player) {
          setIndivRequest({
              ...indivRequest,
              playerId: player.id,
              playerName: player.name,
              position: player.primaryPosition
          });
      }
  };

  if (!hasAccess) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Feature Teaser */}
          <div className="space-y-6">
            <h1 className="text-4xl font-extrabold text-slate-900 leading-tight">
              Unlock Elite <span className="text-indigo-600">Practice Planning</span>
            </h1>
            <p className="text-lg text-slate-600">
              Don't just practice. Practice with a purpose. SeamStrike generates comprehensive, opponent-specific plans tailored to your schedule.
            </p>
            <ul className="space-y-4">
               {[
                 "AI-driven drill recommendations based on scouting reports",
                 "Multi-day schedules (1, 2, or 3+ practices)",
                 "Individual tailored workouts & skill progression",
                 "Downloadable PDF & Email integration"
               ].map((item, i) => (
                 <li key={i} className="flex items-center text-slate-700">
                   <CheckCircle2 className="w-5 h-5 text-emerald-500 mr-3" />
                   {item}
                 </li>
               ))}
            </ul>
          </div>

          {/* Pricing Cards */}
          <div className="space-y-4">
            {/* Single Game */}
            <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6 relative overflow-hidden group hover:border-indigo-400 transition-all cursor-pointer" onClick={() => onUpgrade('SingleGame')}>
              <div className="flex justify-between items-center mb-4">
                 <div>
                    <h3 className="text-lg font-bold text-slate-800">Next Game Prep</h3>
                    <p className="text-slate-500 text-sm">One-time generation</p>
                 </div>
                 <span className="text-2xl font-bold text-slate-900">$0.99</span>
              </div>
              <button className="w-full py-2 rounded-lg border border-indigo-600 text-indigo-600 font-semibold group-hover:bg-indigo-50 transition-colors">
                Get Access
              </button>
            </div>

            {/* Season Pass */}
            <div className="bg-slate-900 rounded-xl shadow-xl border border-slate-800 p-6 relative overflow-hidden cursor-pointer transform hover:scale-105 transition-all" onClick={() => onUpgrade('SeasonPass')}>
               <div className="absolute top-0 right-0 bg-amber-400 text-amber-900 text-xs font-bold px-3 py-1 rounded-bl-lg">
                 BEST VALUE
               </div>
               <div className="flex justify-between items-center mb-4">
                 <div className="flex items-center">
                    <Star className="w-6 h-6 text-amber-400 mr-2 fill-amber-400" />
                    <div>
                        <h3 className="text-lg font-bold text-white">Seamhead Pro</h3>
                        <p className="text-slate-400 text-sm">Full Season Access</p>
                    </div>
                 </div>
                 <span className="text-3xl font-bold text-white">$9.99</span>
               </div>
               <p className="text-slate-300 text-sm mb-6">Unlimited practice plans, advanced scouting integration, individual workouts, and priority support.</p>
               <button className="w-full py-3 rounded-lg bg-gradient-to-r from-amber-400 to-amber-500 text-amber-900 font-bold hover:from-amber-300 hover:to-amber-400 shadow-lg flex justify-center items-center">
                 <Zap className="w-4 h-4 mr-2" />
                 Unlock Full Season
               </button>
            </div>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
       {/* Input Panel */}
       <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-slate-200 p-6 overflow-y-auto flex flex-col">
          <div className="flex items-center justify-between mb-4">
             <h2 className="text-xl font-bold text-slate-800 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-indigo-600" />
                Planner
             </h2>
             {subscriptionTier === 'SeasonPass' && (
                <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-1 rounded-full flex items-center">
                    <Star className="w-3 h-3 mr-1 fill-amber-600" /> PRO
                </span>
             )}
          </div>

          {/* Tab Switcher */}
          <div className="flex bg-slate-100 p-1 rounded-lg mb-6">
            <button 
                onClick={() => setActiveTab('team')}
                className={`flex-1 py-1.5 rounded-md text-sm font-bold transition-all ${activeTab === 'team' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
                Team Practice
            </button>
            <button 
                onClick={() => setActiveTab('individual')}
                className={`flex-1 py-1.5 rounded-md text-sm font-bold transition-all ${activeTab === 'individual' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
                Individual
            </button>
          </div>

          <div className="space-y-4 flex-grow">
             {activeTab === 'team' ? (
                 <>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Practices Before Game</label>
                        <div className="flex gap-2">
                        {[1, 2, 3, 4].map(num => (
                            <button 
                                key={num}
                                onClick={() => setRequest({...request, numPractices: num})}
                                className={`flex-1 py-2 rounded-lg text-sm font-bold border ${request.numPractices === num ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}
                            >
                                {num}
                            </button>
                        ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1 flex items-center">
                            Season Phase
                            <InfoTooltip text="Helps the AI determine drill intensity (e.g., lower intensity during Postseason)." />
                        </label>
                        <select 
                            value={request.seasonPhase}
                            onChange={(e) => setRequest({...request, seasonPhase: e.target.value as SeasonPhase})}
                            className="w-full p-2 border rounded-lg bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                            <option value="Preseason">Preseason (Fundamentals)</option>
                            <option value="Regular Season">Regular Season</option>
                            <option value="Postseason">Postseason (High Intensity)</option>
                            <option value="Offseason">Offseason (Development)</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Next Opponent</label>
                        <input 
                            type="text" 
                            placeholder="e.g. River Cats"
                            className="w-full p-2 border rounded-lg bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={request.opponentName}
                            onChange={(e) => setRequest({...request, opponentName: e.target.value})}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Opponent Intel / Scouting</label>
                        <textarea 
                            className="w-full p-2 border rounded-lg bg-slate-50 h-20 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                            placeholder="e.g. Weak against curveballs..."
                            value={request.scoutingNotes}
                            onChange={(e) => setRequest({...request, scoutingNotes: e.target.value})}
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Coach's Focus</label>
                        <textarea 
                            className="w-full p-2 border rounded-lg bg-slate-50 h-20 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                            placeholder="e.g. Bunt defense..."
                            value={request.focusAreas}
                            onChange={(e) => setRequest({...request, focusAreas: e.target.value})}
                        />
                    </div>
                 </>
             ) : (
                 <>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Select Player</label>
                        <select 
                            value={indivRequest.playerId}
                            onChange={(e) => handlePlayerSelect(e.target.value)}
                            className="w-full p-2 border rounded-lg bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                            <option value="">-- Choose Player --</option>
                            {roster.map(p => (
                                <option key={p.id} value={p.id}>{p.name} ({p.primaryPosition})</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1 flex items-center">
                            Workload / Intensity
                            <InfoTooltip text="Sets the physical demand of the workout." />
                        </label>
                        <select 
                            value={indivRequest.intensity}
                            onChange={(e) => setIndivRequest({...indivRequest, intensity: e.target.value as any})}
                            className="w-full p-2 border rounded-lg bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                            <option value="Recovery">Recovery (Low Impact)</option>
                            <option value="Maintenance">Maintenance (Standard)</option>
                            <option value="High Performance">High Performance (Push Limits)</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Duration</label>
                        <div className="flex gap-2">
                        {[15, 30, 45, 60].map(num => (
                            <button 
                                key={num}
                                onClick={() => setIndivRequest({...indivRequest, durationMinutes: num})}
                                className={`flex-1 py-2 rounded-lg text-xs font-bold border ${indivRequest.durationMinutes === num ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}
                            >
                                {num}m
                            </button>
                        ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Focus Area</label>
                        <input 
                            type="text" 
                            placeholder="e.g. Bat speed, slider mechanics, footwork"
                            className="w-full p-2 border rounded-lg bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={indivRequest.focusArea}
                            onChange={(e) => setIndivRequest({...indivRequest, focusArea: e.target.value})}
                        />
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded p-3 text-xs text-amber-900 mt-2">
                        <p className="font-bold flex items-center mb-1"><AlertTriangle className="w-3 h-3 mr-1"/> Medical Disclaimer</p>
                        <p>This plan is for coaching purposes only. Consult a physician before starting any new exercise program.</p>
                    </div>
                 </>
             )}

             <button 
                onClick={handleGenerate}
                disabled={loading || (activeTab === 'individual' && !indivRequest.playerId)}
                className="w-full py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 shadow-lg flex items-center justify-center disabled:opacity-70 transition-all mt-4"
             >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (activeTab === 'team' ? 'Generate Practice Plan' : 'Generate Workout')}
             </button>
          </div>
       </div>

       {/* Result View */}
       <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-8 flex flex-col h-full min-h-[500px]">
          {plan ? (
              <>
                 <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">{activeTab === 'team' ? 'Practice Plan' : 'Individual Workout'}</h2>
                        {activeTab === 'individual' && <p className="text-sm text-slate-500">For: {indivRequest.playerName}</p>}
                    </div>
                    <div className="flex space-x-2">
                        <button onClick={handleDownload} className="flex items-center px-3 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded hover:bg-slate-200 transition-colors">
                            <Download className="w-4 h-4 mr-2" /> Download
                        </button>
                        <button onClick={handleEmail} className="flex items-center px-3 py-2 text-sm font-medium text-white bg-indigo-600 rounded hover:bg-indigo-700 transition-colors">
                            <Mail className="w-4 h-4 mr-2" /> Email
                        </button>
                    </div>
                 </div>
                 <div className="prose prose-slate max-w-none flex-grow overflow-y-auto">
                    <div dangerouslySetInnerHTML={{ __html: plan.replace(/\n/g, '<br/>').replace(/##/g, '').replace(/\*\*(.*?)\*\*/g, '<strong class="text-indigo-700">$1</strong>') }} />
                 </div>
                 {activeTab === 'individual' && (
                     <div className="mt-4 pt-4 border-t border-slate-200 text-xs text-slate-400 text-center">
                         Disclaimer: Exercises suggested by AI. Ensure player health and safety protocols are followed.
                     </div>
                 )}
              </>
          ) : (
            <div className="flex flex-col items-center justify-center flex-grow text-slate-400 opacity-60">
                 {activeTab === 'team' ? <Clipboard className="w-24 h-24 mb-4 stroke-1" /> : <Activity className="w-24 h-24 mb-4 stroke-1" />}
                 <p className="text-xl font-light">Configure {activeTab} parameters to generate a plan.</p>
            </div>
          )}
       </div>
    </div>
  );
};

export default PracticePlanner;

import React, { useState, useEffect } from 'react';
import { GameState, LeagueSettings, Player, SubscriptionTier } from '../types';
import { getStrategyAdvice } from '../services/geminiService';
import { Loader2, RefreshCw, AlertTriangle, Shield, ArrowLeftRight, User, Lock, Activity, CheckCircle2, Info, X, Edit2, HelpCircle, Trophy, FastForward, Check, PenTool, StickyNote, Plus, Minus, ChevronUp, ChevronDown } from 'lucide-react';
import InfoTooltip from './InfoTooltip';
import SeamStrikeLogo from './SeamStrikeLogo';
import Whiteboard from './Whiteboard';

interface GameModeProps {
  league: LeagueSettings;
  roster: Player[];
  subscriptionTier: SubscriptionTier;
  onUpgrade: (tier: SubscriptionTier) => void;
  initialOpponent?: string;
}

type InfieldShift = 'Standard' | 'Infield In' | 'Corners In' | 'Double Play' | 'Pull (Righty)' | 'Pull (Lefty)';
type OutfieldShift = 'Standard' | 'Deep' | 'Shallow' | 'Shift Left' | 'Shift Right';
type Tab = 'field' | 'lineup' | 'whiteboard';
type HitType = '1B' | '2B' | '3B' | 'HR' | 'BB' | 'HBP' | 'ROE' | 'FC';

const SEAMSCORE_FEATURES = [
    "Live Lineup Tracking (At Bat / On Deck)",
    "Real-time Scoring Controls",
    "One-Click Substitutions",
    "Opponent Pitch Count Tracking",
    "Game Log Export"
];

const GameMode: React.FC<GameModeProps> = ({ league, roster, subscriptionTier, onUpgrade, initialOpponent }) => {
  const [activeTab, setActiveTab] = useState<Tab>('field');
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [opponentName, setOpponentName] = useState(initialOpponent || "Opponent");
  const [isEditingOpponent, setIsEditingOpponent] = useState(false);
  const [showQuickGuide, setShowQuickGuide] = useState(false);

  // Hit Modal State
  const [isHitModalOpen, setIsHitModalOpen] = useState(false);
  const [hitModalStage, setHitModalStage] = useState<'select' | 'adjust'>('select');
  const [pendingHitType, setPendingHitType] = useState<HitType | null>(null);
  const [proposedRunners, setProposedRunners] = useState({ first: false, second: false, third: false });
  const [proposedRuns, setProposedRuns] = useState(0);

  // Fielding Note Popover State
  const [selectedFieldingNote, setSelectedFieldingNote] = useState<{name: string, note: string, pos: string} | null>(null);

  const [gameState, setGameState] = useState<GameState>({
    inning: 1,
    isTop: true,
    outs: 0,
    balls: 0,
    strikes: 0,
    scoreUs: 0,
    scoreThem: 0,
    runners: { first: false, second: false, third: false },
    pitchCount: 0,
    lineup: roster.slice(0, league.fielderCount === 10 ? 10 : 9),
    currentBatterIndex: 0
  });

  const [infieldShift, setInfieldShift] = useState<InfieldShift>('Standard');
  const [outfieldShift, setOutfieldShift] = useState<OutfieldShift>('Standard');
  const [advice, setAdvice] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [customQuery, setCustomQuery] = useState("");

  const hasSeamScoreAccess = subscriptionTier !== 'Free';
  const isPro = ['SeasonPass', 'ProMonthly', 'ProAnnual'].includes(subscriptionTier);

  const fetchAdvice = async (query?: string) => {
    setLoading(true);
    const currentBatter = gameState.lineup[gameState.currentBatterIndex];
    const context = query 
      ? `${query} (Current Defense: Infield ${infieldShift}, Outfield ${outfieldShift}, Batter: ${currentBatter?.name || 'Unknown'}, Opponent: ${opponentName})` 
      : `Current Defense: Infield ${infieldShift}, Outfield ${outfieldShift}, Batter: ${currentBatter?.name || 'Unknown'}, Opponent: ${opponentName}`;
    
    const result = await getStrategyAdvice(gameState, league, context);
    setAdvice(result);
    setLoading(false);
  };
  
  const toggleRunner = (base: 'first' | 'second' | 'third') => {
    setGameState(prev => ({
      ...prev,
      runners: { ...prev.runners, [base]: !prev.runners[base] }
    }));
  };

  const addBall = () => setGameState(prev => ({ ...prev, balls: (prev.balls + 1) % 5 })); 
  const addStrike = () => setGameState(prev => ({ ...prev, strikes: (prev.strikes + 1) % 4 })); 
  const addOut = () => setGameState(prev => ({ ...prev, outs: (prev.outs + 1) % 4 })); 

  // --- Hit / Walk Logic ---
  const openHitModal = () => {
      setHitModalStage('select');
      setPendingHitType(null);
      setIsHitModalOpen(true);
  };

  const calculateDefaultOutcome = (type: HitType) => {
      const { runners } = gameState;
      let newRunners = { ...runners };
      let runsAdded = 0;

      if (type === 'BB' || type === 'HBP') {
          if (newRunners.first) {
              if (newRunners.second) {
                  if (newRunners.third) {
                      runsAdded += 1;
                  }
                  newRunners.third = true;
              }
              newRunners.second = true;
          }
          newRunners.first = true;
          applyHitResult(type, newRunners, runsAdded);
      } else if (type === 'HR') {
          runsAdded = 1 + (runners.first ? 1 : 0) + (runners.second ? 1 : 0) + (runners.third ? 1 : 0);
          newRunners = { first: false, second: false, third: false };
          applyHitResult(type, newRunners, runsAdded);
      } else {
          // Defaults for ball in play
          runsAdded = 0;
          if (type === '1B' || type === 'ROE' || type === 'FC') {
              if (runners.third) runsAdded++;
              newRunners.third = runners.second;
              newRunners.second = runners.first;
              newRunners.first = true;
          } else if (type === '2B') {
              if (runners.third) runsAdded++;
              if (runners.second) runsAdded++;
              newRunners.third = runners.first;
              newRunners.second = true;
              newRunners.first = false;
          } else if (type === '3B') {
              if (runners.third) runsAdded++;
              if (runners.second) runsAdded++;
              if (runners.first) runsAdded++;
              newRunners.third = true;
              newRunners.second = false;
              newRunners.first = false;
          }
          setPendingHitType(type);
          setProposedRunners(newRunners);
          setProposedRuns(runsAdded);
          setHitModalStage('adjust');
      }
  };

  const applyHitResult = (type: HitType, finalRunners: { first: boolean, second: boolean, third: boolean }, runs: number) => {
      setGameState(prev => ({
          ...prev,
          runners: finalRunners,
          scoreUs: prev.isTop ? prev.scoreUs + runs : prev.scoreUs,
          scoreThem: !prev.isTop ? prev.scoreThem + runs : prev.scoreThem,
          balls: 0,
          strikes: 0,
          currentBatterIndex: (prev.currentBatterIndex + 1) % prev.lineup.length
      }));
      setIsHitModalOpen(false);
  };

  const recordOut = () => {
      setGameState(prev => {
          const newOuts = prev.outs + 1;
          const inningChange = newOuts >= 3;
          return {
              ...prev,
              outs: inningChange ? 0 : newOuts,
              inning: inningChange ? (prev.isTop ? prev.inning : prev.inning + 1) : prev.inning,
              isTop: inningChange ? !prev.isTop : prev.isTop,
              balls: 0,
              strikes: 0,
              runners: inningChange ? { first: false, second: false, third: false } : prev.runners,
              currentBatterIndex: (prev.currentBatterIndex + 1) % prev.lineup.length
          };
      });
  };

  // --- 2D Positioning Logic ---
  const getPositions = () => {
    // Standard 2D Top-Down Coordinates (percentages)
    // Adjusted slightly to look good on the new field asset
    let pos: Record<string, { top: number, left: number, color: string, label?: string }> = {
      P: { top: 50, left: 50, color: 'bg-emerald-600' },
      C: { top: 82, left: 50, color: 'bg-indigo-600' },
      '1B': { top: 52, left: 74, color: 'bg-indigo-600' },
      '2B': { top: 35, left: 65, color: 'bg-indigo-600' },
      '3B': { top: 52, left: 26, color: 'bg-indigo-600' },
      SS: { top: 35, left: 35, color: 'bg-indigo-600' },
      LF: { top: 20, left: 20, color: 'bg-blue-600' },
      CF: { top: 10, left: 50, color: 'bg-blue-600' },
      RF: { top: 20, left: 80, color: 'bg-blue-600' },
    };

    if (league.fielderCount === 10) {
       pos['LF'] = { top: 20, left: 20, color: 'bg-blue-600' };
       pos['LC'] = { top: 15, left: 40, color: 'bg-blue-600', label: 'LC' };
       pos['RC'] = { top: 15, left: 60, color: 'bg-blue-600', label: 'RC' };
       pos['RF'] = { top: 20, left: 80, color: 'bg-blue-600' };
       delete pos['CF'];
    }

    // Apply shifts simply by adjusting %
    switch (infieldShift) {
      case 'Infield In':
        pos['1B'].top += 8; pos['1B'].left -= 5;
        pos['3B'].top += 8; pos['3B'].left += 5;
        pos['2B'].top += 8; 
        pos['SS'].top += 8; 
        break;
      case 'Corners In':
        pos['1B'].top += 10; pos['1B'].left -= 5;
        pos['3B'].top += 10; pos['3B'].left += 5;
        break;
      case 'Double Play':
        pos['2B'].top = 42; pos['2B'].left = 58;
        pos['SS'].top = 42; pos['SS'].left = 42;
        break;
      case 'Pull (Righty)': 
        pos['2B'].left = 58; pos['SS'].left = 28; pos['3B'].left = 20; pos['1B'].left = 78; 
        break;
      case 'Pull (Lefty)': 
        pos['3B'].left = 40; pos['SS'].left = 58; pos['2B'].left = 78; pos['1B'].left = 80;
        break;
    }

    const outfielders = league.fielderCount === 10 ? ['LF', 'LC', 'RC', 'RF'] : ['LF', 'CF', 'RF'];
    outfielders.forEach(pName => {
        const p = pos[pName];
        if (!p) return;
        switch (outfieldShift) {
            case 'Deep': p.top -= 5; break;
            case 'Shallow': p.top += 10; break;
            case 'Shift Left': p.left -= 10; break;
            case 'Shift Right': p.left += 10; break;
        }
    });

    return Object.entries(pos).map(([name, coords]) => ({ name, ...coords }));
  };

  const positions = getPositions();
  const limit = league.pitchCountLimit;
  const isWarning = gameState.pitchCount >= (limit - 15) && gameState.pitchCount < limit;
  const isOverLimit = gameState.pitchCount >= limit;

  // --- Quick Guide Overlay ---
  const GuideOverlay = ({ target, text, position = 'bottom' }: { target: string, text: string, position?: 'top'|'bottom'|'left'|'right' }) => (
      <div className={`absolute z-50 pointer-events-none animate-in fade-in zoom-in duration-300 ${target}`}>
          <div className="relative">
              <span className="absolute -inset-1 rounded-full bg-indigo-500 opacity-25 animate-ping"></span>
              <div className="relative bg-indigo-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-xl whitespace-nowrap">
                  {text}
                  <div className={`absolute w-2 h-2 bg-indigo-600 rotate-45 
                      ${position === 'bottom' ? '-top-1 left-1/2 -translate-x-1/2' : ''}
                      ${position === 'top' ? '-bottom-1 left-1/2 -translate-x-1/2' : ''}
                      ${position === 'left' ? '-right-1 top-1/2 -translate-y-1/2' : ''}
                      ${position === 'right' ? '-left-1 top-1/2 -translate-y-1/2' : ''}
                  `}></div>
              </div>
          </div>
      </div>
  );

  return (
    <div className="flex flex-col h-full bg-slate-100 overflow-hidden relative">
      
      {/* Hit / Walk Modal */}
      {isHitModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                  <div className="bg-slate-900 text-white p-4 border-b border-slate-700 flex justify-between items-center">
                      <h3 className="font-bold flex items-center">
                          <Trophy className="w-5 h-5 mr-2 text-amber-500" />
                          Record At-Bat
                      </h3>
                      <button onClick={() => setIsHitModalOpen(false)} className="text-slate-400 hover:text-white">
                          <X className="w-6 h-6" />
                      </button>
                  </div>
                  
                  {hitModalStage === 'select' ? (
                      <div className="p-6">
                          <p className="text-sm text-slate-500 mb-4 font-bold uppercase tracking-wider text-center">Select Result</p>
                          <div className="grid grid-cols-2 gap-3">
                              <button onClick={() => calculateDefaultOutcome('1B')} className="p-4 bg-indigo-50 text-indigo-700 font-bold rounded-xl hover:bg-indigo-100 border border-indigo-200">Single</button>
                              <button onClick={() => calculateDefaultOutcome('2B')} className="p-4 bg-indigo-50 text-indigo-700 font-bold rounded-xl hover:bg-indigo-100 border border-indigo-200">Double</button>
                              <button onClick={() => calculateDefaultOutcome('3B')} className="p-4 bg-indigo-50 text-indigo-700 font-bold rounded-xl hover:bg-indigo-100 border border-indigo-200">Triple</button>
                              <button onClick={() => calculateDefaultOutcome('HR')} className="p-4 bg-amber-50 text-amber-700 font-bold rounded-xl hover:bg-amber-100 border border-amber-200 flex items-center justify-center"><Trophy className="w-4 h-4 mr-2" /> HR</button>
                              <button onClick={() => calculateDefaultOutcome('BB')} className="p-3 bg-emerald-50 text-emerald-700 font-semibold rounded-xl hover:bg-emerald-100 border border-emerald-200">Walk</button>
                              <button onClick={() => calculateDefaultOutcome('HBP')} className="p-3 bg-emerald-50 text-emerald-700 font-semibold rounded-xl hover:bg-emerald-100 border border-emerald-200">HBP</button>
                              <button onClick={() => calculateDefaultOutcome('ROE')} className="p-3 bg-slate-50 text-slate-700 font-semibold rounded-xl hover:bg-slate-100 border border-slate-200">Error</button>
                              <button onClick={() => calculateDefaultOutcome('FC')} className="p-3 bg-slate-50 text-slate-700 font-semibold rounded-xl hover:bg-slate-100 border border-slate-200">Fielder's Choice</button>
                          </div>
                      </div>
                  ) : (
                      <div className="p-6">
                          <p className="text-sm text-slate-500 mb-2 font-bold uppercase tracking-wider text-center">Base Runners</p>
                          <div className="relative w-40 h-40 mx-auto mb-6 bg-slate-100 rounded-lg rotate-45 border-2 border-slate-200">
                              <button 
                                  onClick={() => setProposedRunners(p => ({...p, second: !p.second}))}
                                  className={`absolute top-0 left-0 -mt-3 -ml-3 w-10 h-10 -rotate-45 rounded-full flex items-center justify-center font-bold border-2 transition-all z-10 ${proposedRunners.second ? 'bg-indigo-600 border-white shadow-lg text-white' : 'bg-white border-slate-300 text-slate-400'}`}
                              >2B</button>
                              <button 
                                  onClick={() => setProposedRunners(p => ({...p, third: !p.third}))}
                                  className={`absolute bottom-0 left-0 -mb-3 -ml-3 w-10 h-10 -rotate-45 rounded-full flex items-center justify-center font-bold border-2 transition-all z-10 ${proposedRunners.third ? 'bg-indigo-600 border-white shadow-lg text-white' : 'bg-white border-slate-300 text-slate-400'}`}
                              >3B</button>
                              <button 
                                  onClick={() => setProposedRunners(p => ({...p, first: !p.first}))}
                                  className={`absolute top-0 right-0 -mt-3 -mr-3 w-10 h-10 -rotate-45 rounded-full flex items-center justify-center font-bold border-2 transition-all z-10 ${proposedRunners.first ? 'bg-indigo-600 border-white shadow-lg text-white' : 'bg-white border-slate-300 text-slate-400'}`}
                              >1B</button>
                          </div>
                          <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl mb-4">
                              <span className="font-bold text-slate-700">Runs Scored:</span>
                              <div className="flex items-center space-x-3">
                                  <button onClick={() => setProposedRuns(Math.max(0, proposedRuns - 1))} className="w-8 h-8 bg-white border rounded-full flex items-center justify-center font-bold">-</button>
                                  <span className="text-xl font-bold text-emerald-600">{proposedRuns}</span>
                                  <button onClick={() => setProposedRuns(proposedRuns + 1)} className="w-8 h-8 bg-white border rounded-full flex items-center justify-center font-bold">+</button>
                              </div>
                          </div>
                          <div className="flex gap-3">
                              <button onClick={() => setHitModalStage('select')} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl">Back</button>
                              <button onClick={() => pendingHitType && applyHitResult(pendingHitType, proposedRunners, proposedRuns)} className="flex-1 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 flex items-center justify-center"><Check className="w-5 h-5 mr-2" /> Confirm</button>
                          </div>
                      </div>
                  )}
              </div>
          </div>
      )}

      {/* SCOREBOARD (Non-Fixed on small landscape) */}
      <div className="bg-slate-900 text-white p-2 md:p-4 shadow-lg border-b-4 border-emerald-500 z-30 flex-shrink-0 landscape:max-h-[80px] landscape:overflow-hidden md:landscape:max-h-none">
        
        {/* Top Row: Teams & Inning */}
        <div className="grid grid-cols-3 items-center mb-2">
             {/* Home */}
             <div className="text-center">
                <span className="block text-xs md:text-sm font-bold font-mono tracking-tight truncate text-slate-400 uppercase">
                   {league.name.substring(0, 12)}
                </span>
                <span className="block text-3xl md:text-4xl font-bold font-mono text-emerald-400 leading-none">{gameState.scoreUs}</span>
             </div>
             
             {/* Inning Indicator */}
             <div className="flex flex-col items-center justify-center">
                <div className="bg-slate-800 px-2 py-1 rounded flex items-center space-x-1">
                    {gameState.isTop ? <ChevronUp className="w-4 h-4 text-white" /> : <ChevronDown className="w-4 h-4 text-white" />}
                    <span className="text-lg font-bold font-mono">{gameState.inning}</span>
                </div>
             </div>

             {/* Guest */}
             <div className="text-center">
                {isEditingOpponent ? (
                     <input 
                        autoFocus
                        className="bg-slate-800 text-white text-xs font-bold font-mono border border-slate-600 rounded px-1 w-full outline-none text-center"
                        value={opponentName}
                        onChange={(e) => setOpponentName(e.target.value)}
                        onBlur={() => setIsEditingOpponent(false)}
                        onKeyDown={(e) => e.key === 'Enter' && setIsEditingOpponent(false)}
                     />
                ) : (
                     <div className="flex flex-col items-center cursor-pointer" onClick={() => setIsEditingOpponent(true)}>
                        <span className="block text-xs md:text-sm font-bold font-mono tracking-tight truncate text-slate-400 uppercase flex items-center justify-center">
                            {opponentName.substring(0, 12)} <Edit2 className="w-2 h-2 ml-1 opacity-50" />
                        </span>
                        <span className="block text-3xl md:text-4xl font-bold font-mono text-red-400 leading-none">{gameState.scoreThem}</span>
                     </div>
                )}
             </div>
        </div>
        
        {/* Bottom Row: Controls */}
        <div className="flex justify-between items-center bg-slate-800/50 p-1.5 rounded-lg gap-2">
          {/* Count */}
          <div className="flex space-x-3 md:space-x-5 flex-shrink-0">
            <div className="flex flex-col items-center cursor-pointer select-none" onClick={addBall}>
              <span className="text-[9px] text-slate-500 uppercase font-bold">B</span>
              <span className={`text-xl font-bold font-mono ${gameState.balls === 4 ? 'text-green-400' : 'text-white'}`}>{gameState.balls}</span>
            </div>
            <div className="flex flex-col items-center cursor-pointer select-none" onClick={addStrike}>
              <span className="text-[9px] text-slate-500 uppercase font-bold">S</span>
              <span className={`text-xl font-bold font-mono ${gameState.strikes === 3 ? 'text-red-400' : 'text-white'}`}>{gameState.strikes}</span>
            </div>
            <div className="flex flex-col items-center cursor-pointer select-none" onClick={addOut}>
              <span className="text-[9px] text-slate-500 uppercase font-bold">O</span>
              <span className={`text-xl font-bold font-mono ${gameState.outs === 3 ? 'text-red-500' : 'text-white'}`}>{gameState.outs}</span>
            </div>
          </div>

          {/* Action Buttons (Centered, flex-1 to take space) */}
          <div className="flex space-x-2 flex-grow justify-center">
              <button onClick={openHitModal} className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded text-xs font-bold shadow flex items-center flex-shrink-0 active:scale-95 transition-transform">
                  HIT/WALK
              </button>
              <button onClick={recordOut} className="bg-red-600 hover:bg-red-500 text-white px-3 py-1.5 rounded text-xs font-bold shadow flex items-center flex-shrink-0 active:scale-95 transition-transform">
                  OUT
              </button>
          </div>

          {/* Pitch Count */}
          <div className="flex flex-col items-end flex-shrink-0">
             <div className="text-[9px] text-slate-500 uppercase mb-0.5 font-bold">Pitches</div>
             <div className="flex items-center space-x-1">
                <button onClick={() => setGameState(p => ({...p, pitchCount: Math.max(0, p.pitchCount - 1)}))} className="w-5 h-5 rounded bg-slate-700 flex items-center justify-center hover:bg-slate-600"><Minus className="w-3 h-3" /></button>
                <span className={`text-sm font-mono w-6 text-center font-bold ${isOverLimit ? 'text-red-500' : isWarning ? 'text-yellow-400' : 'text-white'}`}>{gameState.pitchCount}</span>
                <button onClick={() => setGameState(p => ({...p, pitchCount: p.pitchCount + 1}))} className="w-5 h-5 rounded bg-emerald-600 flex items-center justify-center hover:bg-emerald-500"><Plus className="w-3 h-3" /></button>
             </div>
          </div>
        </div>
      </div>

      {/* SCROLLABLE CONTENT AREA */}
      <div className="flex-grow overflow-y-auto p-2 md:p-4 space-y-3">
          
          {/* View Switcher */}
          <div className="flex space-x-2 bg-white p-1 rounded-lg border border-slate-200 shadow-sm flex-shrink-0 sticky top-0 z-20">
             <button 
               onClick={() => setActiveTab('field')}
               className={`flex-1 py-1.5 rounded-md text-xs font-bold flex items-center justify-center transition-all ${activeTab === 'field' ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 hover:bg-slate-50'}`}
             >
               <Shield className="w-3 h-3 mr-1.5" /> Field
             </button>
             <button 
               onClick={() => setActiveTab('whiteboard')}
               className={`flex-1 py-1.5 rounded-md text-xs font-bold flex items-center justify-center transition-all ${activeTab === 'whiteboard' ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:bg-slate-50'}`}
             >
               <PenTool className="w-3 h-3 mr-1.5" /> Board
             </button>
             <div className="flex-1 relative">
                <button 
                    onClick={() => setActiveTab('lineup')}
                    className={`w-full py-1.5 rounded-md text-xs font-bold flex items-center justify-center transition-all ${activeTab === 'lineup' ? 'bg-amber-500 text-white shadow' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                    <Activity className="w-3 h-3 mr-1.5" /> Lineup
                    {!hasSeamScoreAccess && <Lock className="w-3 h-3 ml-1 opacity-50" />}
                </button>
             </div>
          </div>

          {/* Feature Info Modal */}
          {showInfoModal && (
            <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in" onClick={() => setShowInfoModal(false)}>
                <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6" onClick={e => e.stopPropagation()}>
                    <h3 className="font-bold text-lg mb-4 flex items-center text-slate-800"><Activity className="w-5 h-5 mr-2 text-amber-500" /> SeamScore™</h3>
                    <div className="space-y-2 mb-6">
                        {SEAMSCORE_FEATURES.map((f, i) => <div key={i} className="flex items-center text-sm text-slate-600"><CheckCircle2 className="w-4 h-4 text-emerald-500 mr-2" /> {f}</div>)}
                    </div>
                    {!hasSeamScoreAccess && (
                        <button onClick={() => { setShowInfoModal(false); setActiveTab('lineup'); }} className="w-full py-2 bg-amber-500 text-white font-bold rounded-lg hover:bg-amber-600">Get Access</button>
                    )}
                    <button onClick={() => setShowInfoModal(false)} className="w-full mt-2 py-2 text-slate-400 text-sm hover:text-slate-600">Close</button>
                </div>
            </div>
          )}

          {/* FIELD TAB CONTENT */}
          {activeTab === 'field' && (
            <div className="flex flex-col gap-3 pb-10">
                {/* 2D Field - Improved Visuals */}
                <div className="relative w-full max-w-[500px] aspect-square mx-auto rounded-xl shadow-inner overflow-hidden border-4 border-slate-300 flex-shrink-0 bg-[#2d5a27] landscape:max-h-[70vh]">
                    
                    {/* Quick Guide Toggle - Moved to top-left of field container to avoid blocking score */}
                    <div className="absolute top-2 left-2 z-40">
                        <button 
                            onClick={() => setShowQuickGuide(!showQuickGuide)}
                            className={`flex items-center text-[10px] font-bold px-2 py-1 rounded shadow-md transition-all ${showQuickGuide ? 'bg-indigo-600 text-white' : 'bg-white/90 text-slate-600'}`}
                        >
                            <HelpCircle className="w-3 h-3 mr-1" />
                            Guide
                        </button>
                    </div>

                    {showQuickGuide && <GuideOverlay target="top-[45%] left-[50%] -translate-x-1/2" text="Tap players for notes" position="bottom" />}

                    {/* Grass Texture (Radial Gradient) */}
                    <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 50% 100%, #3a7532 0%, #2d5a27 60%, #1e3f1b 100%)' }}></div>
                    
                    {/* Dirt Diamond - Improved Shape & Color */}
                    <div 
                        className="absolute top-[50%] left-[50%] w-[55%] h-[55%] bg-[#a17f5a] shadow-sm"
                        style={{ 
                            transform: 'translate(-50%, -60%) rotate(45deg)',
                            borderRadius: '15px'
                        }}
                    ></div>
                    {/* Infield Grass Patch */}
                    {league.sport === 'Baseball' && (
                        <div 
                            className="absolute top-[50%] left-[50%] w-[48%] h-[48%] bg-[#3a7532]"
                            style={{ transform: 'translate(-50%, -60%) rotate(45deg)', borderRadius: '10px' }}
                        ></div>
                    )}
                    
                    {/* Bases - Crisp White Squares */}
                    <div onClick={() => toggleRunner('second')} className={`absolute top-[22.5%] left-[50%] w-5 h-5 -ml-2.5 bg-white transform rotate-45 border border-slate-300 z-10 cursor-pointer shadow-sm ${gameState.runners.second ? 'bg-yellow-400 ring-2 ring-yellow-500' : ''}`}></div>
                    <div onClick={() => toggleRunner('third')} className={`absolute top-[50%] left-[22.5%] w-5 h-5 -mt-2.5 -ml-2.5 bg-white transform rotate-45 border border-slate-300 z-10 cursor-pointer shadow-sm ${gameState.runners.third ? 'bg-yellow-400 ring-2 ring-yellow-500' : ''}`}></div>
                    <div onClick={() => toggleRunner('first')} className={`absolute top-[50%] left-[77.5%] w-5 h-5 -mt-2.5 -ml-2.5 bg-white transform rotate-45 border border-slate-300 z-10 cursor-pointer shadow-sm ${gameState.runners.first ? 'bg-yellow-400 ring-2 ring-yellow-500' : ''}`}></div>
                    
                    {/* Home Plate */}
                    <div className="absolute top-[77.5%] left-[50%] w-5 h-5 -ml-2.5 bg-white transform z-10" style={{ clipPath: 'polygon(0 0, 50% 100%, 100% 0)' }}></div>

                    {/* Mound */}
                    <div className="absolute top-[50%] left-[50%] w-8 h-8 -mt-8 -ml-4 bg-[#a17f5a] rounded-full border border-[#8b6d4d] z-0"></div>
                    <div className="absolute top-[50%] left-[50%] w-4 h-1 -mt-6 -ml-2 bg-white z-0"></div>

                    {/* Players */}
                    {positions.map(p => {
                        const playerAtPos = roster.find(pl => pl.primaryPosition === p.name);
                        return (
                            <div 
                                key={p.name}
                                className="absolute w-8 h-8 -ml-4 -mt-4 flex flex-col items-center justify-center z-20 cursor-pointer transition-all duration-300 hover:scale-110"
                                style={{ top: `${p.top}%`, left: `${p.left}%` }}
                                onClick={() => {
                                    if (playerAtPos?.fieldingNotes && isPro) {
                                        setSelectedFieldingNote({ name: playerAtPos.name, note: playerAtPos.fieldingNotes, pos: p.name });
                                    }
                                }}
                            >
                                <div className={`w-7 h-7 rounded-full border-2 border-white shadow-md flex items-center justify-center text-[9px] font-bold text-white ${p.color}`}>
                                    {p.label || p.name}
                                </div>
                                {playerAtPos && <div className="mt-0.5 bg-black/60 text-white text-[7px] px-1.5 rounded whitespace-nowrap backdrop-blur-sm">{playerAtPos.name}</div>}
                            </div>
                        );
                    })}

                    {/* Note Popover */}
                    {selectedFieldingNote && (
                        <div className="absolute inset-x-4 top-10 bg-white p-3 rounded-lg shadow-xl z-50 animate-in fade-in zoom-in-95">
                            <div className="flex justify-between items-start mb-1">
                                <span className="font-bold text-xs text-indigo-900">{selectedFieldingNote.name} ({selectedFieldingNote.pos})</span>
                                <button onClick={() => setSelectedFieldingNote(null)}><X className="w-4 h-4 text-slate-400" /></button>
                            </div>
                            <p className="text-[10px] text-slate-600 italic leading-snug">"{selectedFieldingNote.note}"</p>
                        </div>
                    )}
                </div>

                {/* Controls */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Shifts */}
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm">
                        <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">Defensive Shifts</label>
                        <div className="grid grid-cols-2 gap-2">
                            <select value={infieldShift} onChange={e => setInfieldShift(e.target.value as InfieldShift)} className="text-xs p-1.5 border rounded bg-slate-50 outline-none truncate">
                                <option>Standard</option>
                                <option>Infield In</option>
                                <option>Corners In</option>
                                <option>Double Play</option>
                                <option>Pull (Righty)</option>
                                <option>Pull (Lefty)</option>
                            </select>
                            <select value={outfieldShift} onChange={e => setOutfieldShift(e.target.value as OutfieldShift)} className="text-xs p-1.5 border rounded bg-slate-50 outline-none truncate">
                                <option>Standard</option>
                                <option>Deep</option>
                                <option>Shallow</option>
                                <option>Shift Left</option>
                                <option>Shift Right</option>
                            </select>
                        </div>
                    </div>

                    {/* AI Console */}
                    <div className="bg-slate-50 rounded-xl shadow-sm border border-slate-200 p-2.5 flex flex-col">
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-xs font-bold flex items-center text-slate-800">
                                <SeamStrikeLogo className="w-3 h-3 mr-1.5" sport={league.sport} />
                                Intelligence
                            </h2>
                            <button onClick={() => fetchAdvice()} disabled={loading} className="bg-indigo-600 text-white px-2 py-1 rounded text-[10px] hover:bg-indigo-700 disabled:opacity-50 flex items-center">
                                {loading ? <Loader2 className="w-2.5 h-2.5 animate-spin mr-1"/> : <RefreshCw className="w-2.5 h-2.5 mr-1"/>} Analyze
                            </button>
                        </div>
                        <div className="bg-white border border-slate-200 rounded p-2 text-[10px] text-slate-600 min-h-[50px] max-h-[80px] overflow-y-auto mb-2 leading-relaxed">
                            {advice ? <div dangerouslySetInnerHTML={{ __html: advice.replace(/\n/g, '<br/>') }} /> : "Ready for analysis..."}
                        </div>
                        <div className="relative">
                            <input 
                                className="w-full border rounded pl-2 pr-7 py-1 text-[10px] outline-none focus:border-indigo-500"
                                placeholder="Ask AI..."
                                value={customQuery}
                                onChange={e => setCustomQuery(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && fetchAdvice(customQuery)}
                            />
                            <button onClick={() => fetchAdvice(customQuery)} className="absolute right-1 top-1/2 -translate-y-1/2 text-indigo-500"><ArrowLeftRight className="w-2.5 h-2.5" /></button>
                        </div>
                    </div>
                </div>
            </div>
          )}

          {/* WHITEBOARD TAB */}
          {activeTab === 'whiteboard' && (
              <div className="h-[500px] bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <Whiteboard sport={league.sport} />
              </div>
          )}

          {/* LINEUP TAB */}
          {activeTab === 'lineup' && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 relative overflow-hidden flex flex-col min-h-[400px]">
                {/* Premium Gate */}
                {!hasSeamScoreAccess && (
                    <div className="absolute inset-0 bg-slate-900/95 z-50 flex flex-col items-center justify-center p-6 text-center">
                        <Activity className="w-12 h-12 text-amber-500 mb-4" />
                        <h2 className="text-2xl font-bold text-white mb-2">Unlock SeamScore™</h2>
                        <p className="text-slate-400 text-sm mb-6 max-w-xs">Upgrade to see live batter tracking and real-time lineup management.</p>
                        <button onClick={() => onUpgrade('SeasonPass')} className="bg-amber-500 text-white px-6 py-3 rounded-lg font-bold hover:bg-amber-600">Upgrade Now</button>
                    </div>
                )}

                <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                    <span className="font-bold text-slate-700">Live Batting Order</span>
                    <span className="text-xs text-slate-500">{gameState.lineup.length} Batters</span>
                </div>
                <div className="flex-grow overflow-y-auto p-2">
                    {gameState.lineup.map((player, index) => {
                        const isUp = index === gameState.currentBatterIndex;
                        const isOnDeck = index === (gameState.currentBatterIndex + 1) % gameState.lineup.length;
                        return (
                            <div key={player.id} className={`flex items-center p-3 mb-2 rounded-lg border ${isUp ? 'bg-amber-50 border-amber-300 ring-1 ring-amber-200' : 'bg-white border-slate-100'}`}>
                                <span className="w-6 text-xs font-mono text-slate-400 font-bold">{index + 1}</span>
                                <div className="flex-grow">
                                    <div className="flex items-center justify-between">
                                        <span className={`font-bold ${isUp ? 'text-slate-900' : 'text-slate-600'}`}>{player.name}</span>
                                        {isUp && <span className="bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded font-bold uppercase">At Bat</span>}
                                        {isOnDeck && <span className="bg-slate-200 text-slate-600 text-[10px] px-2 py-0.5 rounded font-bold uppercase">On Deck</span>}
                                    </div>
                                    <div className="text-xs text-slate-400 mt-0.5">#{player.number} • {player.primaryPosition} • {player.batHand}/{player.throwHand}</div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
          )}
      </div>
    </div>
  );
};

export default GameMode;
import React, { useState } from 'react';
import type { GameState, LeagueSettings, Player, SubscriptionTier } from '../types';
import { getStrategyAdvice } from '../services/geminiService';
import { Loader2, RefreshCw, Shield, Activity, Info, X, Edit2, HelpCircle, Trophy, Check } from 'lucide-react';
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

const GameMode: React.FC<GameModeProps> = ({ league, roster, subscriptionTier, initialOpponent }) => {
  const [activeTab, setActiveTab] = useState<Tab>('field');
  const [opponentName, setOpponentName] = useState(initialOpponent || "Opponent");
  const [isEditingOpponent, setIsEditingOpponent] = useState(false);
  const [showQuickGuide, setShowQuickGuide] = useState(false);

  // Hit Modal State
  const [isHitModalOpen, setIsHitModalOpen] = useState(false);
  const [hitModalStage, setHitModalStage] = useState<'select' | 'adjust'>('select');
  const [pendingHitType, setPendingHitType] = useState<HitType | null>(null);
  const [proposedRunners, setProposedRunners] = useState({ first: false, second: false, third: false });
  const [proposedRuns, setProposedRuns] = useState(0);

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
    // Initialize Lineup from first 9 (or 10) players of roster for demo purposes
    lineup: roster.slice(0, league.fielderCount === 10 ? 10 : 9),
    currentBatterIndex: 0
  });

  const [infieldShift, setInfieldShift] = useState<InfieldShift>('Standard');
  const [outfieldShift, setOutfieldShift] = useState<OutfieldShift>('Standard');
  const [advice, setAdvice] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const hasSeamScoreAccess = subscriptionTier !== 'Free';

  const fetchAdvice = async (query?: string) => {
    setLoading(true);
    // Include shift info in context
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
          // Force logic
          if (newRunners.first) {
              if (newRunners.second) {
                  if (newRunners.third) {
                      runsAdded += 1; // Bases loaded walk
                  }
                  newRunners.third = true;
              }
              newRunners.second = true;
          }
          newRunners.first = true;
          
          // Apply immediately for Walk/HBP
          applyHitResult(newRunners, runsAdded);
      } else if (type === 'HR') {
          // Clear bases, count runs
          runsAdded = 1 + (runners.first ? 1 : 0) + (runners.second ? 1 : 0) + (runners.third ? 1 : 0);
          newRunners = { first: false, second: false, third: false };
          applyHitResult(newRunners, runsAdded);
      } else {
          // Ball in play - Setup defaults for adjustment stage
          runsAdded = 0;
          
          if (type === '1B' || type === 'ROE' || type === 'FC') {
              // Default: runners advance 1 base. R3 scores.
              if (runners.third) runsAdded++;
              newRunners.third = runners.second;
              newRunners.second = runners.first;
              newRunners.first = true; // Batter
          } else if (type === '2B') {
              // Default: runners advance 2 bases. R2, R3 score.
              if (runners.third) runsAdded++;
              if (runners.second) runsAdded++;
              newRunners.third = runners.first;
              newRunners.second = true; // Batter
              newRunners.first = false;
          } else if (type === '3B') {
              // Default: all score. Batter on 3rd.
              if (runners.third) runsAdded++;
              if (runners.second) runsAdded++;
              if (runners.first) runsAdded++;
              newRunners.third = true; // Batter
              newRunners.second = false;
              newRunners.first = false;
          }

          setPendingHitType(type);
          setProposedRunners(newRunners);
          setProposedRuns(runsAdded);
          setHitModalStage('adjust');
      }
  };

  const applyHitResult = (finalRunners: { first: boolean, second: boolean, third: boolean }, runs: number) => {
      setGameState(prev => ({
          ...prev,
          runners: finalRunners,
          scoreUs: prev.isTop ? prev.scoreUs + runs : prev.scoreUs, // Assuming user is batting for simplified demo logic, or track 'us' vs 'them' inning
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

  // --- Positioning Logic ---
  const getPositions = () => {
    let pos: Record<string, { top: number, left: number, color: string, label?: string }> = {
      P: { top: 50, left: 50, color: 'bg-emerald-600' },
      C: { top: 86, left: 50, color: 'bg-indigo-600' },
      '1B': { top: 53, left: 74, color: 'bg-indigo-600' },
      '2B': { top: 38, left: 62, color: 'bg-indigo-600' },
      '3B': { top: 53, left: 26, color: 'bg-indigo-600' },
      SS: { top: 38, left: 38, color: 'bg-indigo-600' },
      LF: { top: 25, left: 15, color: 'bg-blue-600' },
      CF: { top: 10, left: 50, color: 'bg-blue-600' },
      RF: { top: 25, left: 85, color: 'bg-blue-600' },
    };

    if (league.fielderCount === 10) {
       pos['LF'] = { top: 25, left: 15, color: 'bg-blue-600' };
       pos['LC'] = { top: 15, left: 35, color: 'bg-blue-600', label: 'LC' };
       pos['RC'] = { top: 15, left: 65, color: 'bg-blue-600', label: 'RC' };
       pos['RF'] = { top: 25, left: 85, color: 'bg-blue-600' };
       delete pos['CF'];
    }

    switch (infieldShift) {
      case 'Infield In':
        pos['1B'].top += 10; pos['1B'].left -= 5;
        pos['3B'].top += 10; pos['3B'].left += 5;
        pos['2B'].top += 10; 
        pos['SS'].top += 10; 
        break;
      case 'Corners In':
        pos['1B'].top += 12; pos['1B'].left -= 5;
        pos['3B'].top += 12; pos['3B'].left += 5;
        break;
      case 'Double Play':
        pos['2B'].top = 45; pos['2B'].left = 58;
        pos['SS'].top = 45; pos['SS'].left = 42;
        break;
      case 'Pull (Righty)': 
        pos['2B'].left = 55;
        pos['SS'].left = 30;
        pos['3B'].left = 20;
        pos['1B'].left = 75; 
        break;
      case 'Pull (Lefty)': 
        pos['3B'].left = 40;
        pos['SS'].left = 58;
        pos['2B'].left = 75;
        pos['1B'].left = 80;
        break;
    }

    const outfielders = league.fielderCount === 10 ? ['LF', 'LC', 'RC', 'RF'] : ['LF', 'CF', 'RF'];
    outfielders.forEach(pName => {
        const p = pos[pName];
        if (!p) return;
        switch (outfieldShift) {
            case 'Deep': p.top -= 10; break;
            case 'Shallow': p.top += 15; break;
            case 'Shift Left': p.left -= 12; break;
            case 'Shift Right': p.left += 12; break;
        }
    });

    return Object.entries(pos).map(([name, coords]) => ({ name, ...coords }));
  };

  const positions = getPositions();
  const limit = league.pitchCountLimit;
  const isWarning = gameState.pitchCount >= (limit - 15) && gameState.pitchCount < limit;
  const isOverLimit = gameState.pitchCount >= limit;

  // --- Quick Guide Overlay Component ---
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
    <div className="flex flex-col h-full space-y-4 relative">
      {/* Quick Guide Toggle */}
      <div className="absolute top-2 right-2 z-40">
           <button 
               onClick={() => setShowQuickGuide(!showQuickGuide)}
               className={`flex items-center text-xs font-bold px-3 py-1.5 rounded-full shadow-lg transition-all ${showQuickGuide ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
           >
               <HelpCircle className="w-3.5 h-3.5 mr-1.5" />
               {showQuickGuide ? 'Hide Guide' : 'Quick Guide'}
           </button>
      </div>

      {/* Hit / Walk Modal */}
      {isHitModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                  <div className="bg-slate-900 text-white p-4 border-b border-slate-700 flex justify-between items-center">
                      <h3 className="font-bold flex items-center">
                          <Trophy className="w-5 h-5 mr-2 text-amber-500" />
                          Record At-Bat Result
                      </h3>
                      <button onClick={() => setIsHitModalOpen(false)} className="text-slate-400 hover:text-white">
                          <X className="w-6 h-6" />
                      </button>
                  </div>
                  
                  {hitModalStage === 'select' ? (
                      <div className="p-6">
                          <p className="text-sm text-slate-500 mb-4 font-bold uppercase tracking-wider text-center">Select Result</p>
                          <div className="grid grid-cols-2 gap-3">
                              <button onClick={() => calculateDefaultOutcome('1B')} className="p-4 bg-indigo-50 text-indigo-700 font-bold rounded-xl hover:bg-indigo-100 border border-indigo-200 transition-colors">Single (1B)</button>
                              <button onClick={() => calculateDefaultOutcome('2B')} className="p-4 bg-indigo-50 text-indigo-700 font-bold rounded-xl hover:bg-indigo-100 border border-indigo-200 transition-colors">Double (2B)</button>
                              <button onClick={() => calculateDefaultOutcome('3B')} className="p-4 bg-indigo-50 text-indigo-700 font-bold rounded-xl hover:bg-indigo-100 border border-indigo-200 transition-colors">Triple (3B)</button>
                              <button onClick={() => calculateDefaultOutcome('HR')} className="p-4 bg-amber-50 text-amber-700 font-bold rounded-xl hover:bg-amber-100 border border-amber-200 transition-colors flex items-center justify-center">
                                  <Trophy className="w-4 h-4 mr-2" /> Home Run
                              </button>
                              <button onClick={() => calculateDefaultOutcome('BB')} className="p-3 bg-emerald-50 text-emerald-700 font-semibold rounded-xl hover:bg-emerald-100 border border-emerald-200 transition-colors">Walk (BB)</button>
                              <button onClick={() => calculateDefaultOutcome('HBP')} className="p-3 bg-emerald-50 text-emerald-700 font-semibold rounded-xl hover:bg-emerald-100 border border-emerald-200 transition-colors">Hit By Pitch</button>
                              <button onClick={() => calculateDefaultOutcome('ROE')} className="p-3 bg-slate-50 text-slate-700 font-semibold rounded-xl hover:bg-slate-100 border border-slate-200 transition-colors">Error (ROE)</button>
                              <button onClick={() => calculateDefaultOutcome('FC')} className="p-3 bg-slate-50 text-slate-700 font-semibold rounded-xl hover:bg-slate-100 border border-slate-200 transition-colors">Fielder's Choice</button>
                          </div>
                      </div>
                  ) : (
                      <div className="p-6">
                          <p className="text-sm text-slate-500 mb-2 font-bold uppercase tracking-wider text-center">Confirm Runner Positions</p>
                          <p className="text-xs text-center text-slate-400 mb-6">Tap bases to toggle final runner placement</p>
                          
                          <div className="relative w-48 h-48 mx-auto mb-6">
                              {/* Diamond Graphic for Selection */}
                              <div className="absolute inset-0 bg-slate-100 rounded-xl transform rotate-45 border-2 border-slate-200"></div>
                              
                              {/* 2B */}
                              <button 
                                  onClick={() => setProposedRunners(p => ({...p, second: !p.second}))}
                                  className={`absolute top-0 left-0 -mt-3 -ml-3 w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all z-10 ${proposedRunners.second ? 'bg-indigo-600 border-white shadow-lg text-white' : 'bg-white border-slate-300 text-slate-300 hover:border-indigo-400'}`}
                              >
                                  2B
                              </button>

                              {/* 3B */}
                              <button 
                                  onClick={() => setProposedRunners(p => ({...p, third: !p.third}))}
                                  className={`absolute bottom-0 left-0 -mb-3 -ml-3 w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all z-10 ${proposedRunners.third ? 'bg-indigo-600 border-white shadow-lg text-white' : 'bg-white border-slate-300 text-slate-300 hover:border-indigo-400'}`}
                              >
                                  3B
                              </button>

                              {/* 1B */}
                              <button 
                                  onClick={() => setProposedRunners(p => ({...p, first: !p.first}))}
                                  className={`absolute top-0 right-0 -mt-3 -mr-3 w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all z-10 ${proposedRunners.first ? 'bg-indigo-600 border-white shadow-lg text-white' : 'bg-white border-slate-300 text-slate-300 hover:border-indigo-400'}`}
                              >
                                  1B
                              </button>

                              {/* Home Plate Area (Batter) */}
                              <div className="absolute bottom-0 right-0 -mb-2 -mr-2 w-10 h-10 flex items-center justify-center">
                                   <div className="w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[15px] border-t-slate-300"></div>
                              </div>
                          </div>

                          <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl mb-4">
                              <span className="font-bold text-slate-700">Runs Scored:</span>
                              <div className="flex items-center space-x-3">
                                  <button onClick={() => setProposedRuns(Math.max(0, proposedRuns - 1))} className="w-8 h-8 bg-white border border-slate-300 rounded-full flex items-center justify-center font-bold text-slate-600">-</button>
                                  <span className="text-xl font-bold text-emerald-600">{proposedRuns}</span>
                                  <button onClick={() => setProposedRuns(proposedRuns + 1)} className="w-8 h-8 bg-white border border-slate-300 rounded-full flex items-center justify-center font-bold text-slate-600">+</button>
                              </div>
                          </div>

                          <div className="flex gap-3">
                              <button onClick={() => setHitModalStage('select')} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-colors">Back</button>
                              <button 
                                  onClick={() => pendingHitType && applyHitResult(proposedRunners, proposedRuns)} 
                                  className="flex-1 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-md transition-colors flex items-center justify-center"
                              >
                                  <Check className="w-5 h-5 mr-2" />
                                  Confirm Play
                              </button>
                          </div>
                      </div>
                  )}
              </div>
          </div>
      )}

      {/* Scoreboard Header */}
      <div className="bg-slate-900 text-white p-4 rounded-xl shadow-lg border-b-4 border-emerald-500 flex-shrink-0 relative">
        {showQuickGuide && (
            <>
                <GuideOverlay target="left-[50%] top-[70%] -translate-x-1/2" text="Tap numbers to update Count" position="bottom" />
                <GuideOverlay target="right-[10%] top-[80%]" text="Track Pitch Count" position="top" />
                <GuideOverlay target="left-[10%] top-[40%]" text="Click Name to Edit" position="right" />
            </>
        )}
        
        {/* Teams and Inning */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-4">
          <div className="w-full flex-1 flex items-center justify-center md:justify-between space-x-4">
             {/* US / Team Name */}
             <div className="flex-1 text-center md:text-right">
                <span className="block text-lg md:text-2xl font-bold font-mono tracking-tight truncate">
                   {league.name.length > 15 ? league.name.substring(0, 15) + '...' : league.name}
                </span>
                <span className="block text-3xl md:text-4xl font-bold font-mono text-emerald-400">{gameState.scoreUs}</span>
             </div>
             
             <div className="px-2 md:px-4 text-slate-500 text-xl font-light">-</div>

             {/* THEM / Opponent Name */}
             <div className="flex-1 text-center md:text-left relative group">
                <div className="flex items-center justify-center md:justify-start">
                    {isEditingOpponent ? (
                         <input 
                            autoFocus
                            className="bg-slate-800 text-white text-lg md:text-xl font-bold font-mono border border-slate-600 rounded px-1 w-full max-w-[150px] outline-none text-center md:text-left"
                            value={opponentName}
                            onChange={(e) => setOpponentName(e.target.value)}
                            onBlur={() => setIsEditingOpponent(false)}
                            onKeyDown={(e) => e.key === 'Enter' && setIsEditingOpponent(false)}
                         />
                    ) : (
                         <span 
                            className="block text-lg md:text-2xl font-bold font-mono tracking-tight truncate cursor-pointer hover:text-indigo-300"
                            onClick={() => setIsEditingOpponent(true)}
                            title="Click to edit opponent name"
                         >
                            {opponentName.length > 15 ? opponentName.substring(0, 15) + '...' : opponentName}
                            <Edit2 className="w-3 h-3 inline ml-2 opacity-0 group-hover:opacity-100 hidden md:inline" />
                         </span>
                    )}
                </div>
                <span className="block text-3xl md:text-4xl font-bold font-mono text-red-400">{gameState.scoreThem}</span>
             </div>
          </div>
          
          <div className="flex items-center space-x-2 mt-2 md:mt-0 md:ml-4 md:pl-4 md:border-l border-slate-700 w-full md:w-auto justify-center">
            <span className="text-xl font-bold bg-slate-800 px-3 py-1 rounded-lg">{gameState.isTop ? '▲' : '▼'} {gameState.inning}</span>
          </div>
        </div>
        
        {/* Controls Row */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex space-x-6 relative">
                    <div className="flex flex-col items-center cursor-pointer select-none group" onClick={addBall}>
                      <span className="text-sm font-bold text-slate-400">Balls</span>
                      <span className="text-2xl font-mono font-bold text-cyan-400">{gameState.balls}</span>
                    </div>
                    <div className="flex flex-col items-center cursor-pointer select-none group" onClick={addStrike}>
                      <span className="text-sm font-bold text-slate-400">Strikes</span>
                      <span className="text-2xl font-mono font-bold text-red-400">{gameState.strikes}</span>
                    </div>
                    <div className="flex flex-col items-center cursor-pointer select-none group" onClick={addOut}>
                      <span className="text-sm font-bold text-slate-400">Outs</span>
                      <span className="text-2xl font-mono font-bold text-amber-400">{gameState.outs}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-bold text-sm ${isOverLimit ? 'bg-red-500 text-white' : isWarning ? 'bg-amber-500 text-white' : 'bg-slate-700 text-slate-300'}`}>
                      <Activity className="w-4 h-4" />
                      <span>{gameState.pitchCount}</span>
                      <span className="text-xs">/ {limit}</span>
                    </div>
                    <button onClick={() => setGameState(prev => ({ ...prev, pitchCount: prev.pitchCount + 1 }))} className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-sm font-bold">+1</button>
                    <button onClick={() => setGameState(prev => ({ ...prev, pitchCount: Math.max(0, prev.pitchCount - 1) }))} className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-sm font-bold">-1</button>
                  </div>
                </div>
              </div>
        
              {/* Tab Navigation */}
              <div className="flex space-x-2 flex-shrink-0 px-2">
                <button onClick={() => setActiveTab('field')} className={`px-4 py-2 rounded-lg font-bold transition-colors ${activeTab === 'field' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}>Field</button>
                {hasSeamScoreAccess && <button onClick={() => setActiveTab('lineup')} className={`px-4 py-2 rounded-lg font-bold transition-colors ${activeTab === 'lineup' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}>Lineup</button>}
                <button onClick={() => setActiveTab('whiteboard')} className={`px-4 py-2 rounded-lg font-bold transition-colors ${activeTab === 'whiteboard' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}>Whiteboard</button>
              </div>
        
              {/* Main Content Area */}
              <div className="flex-1 overflow-y-auto px-2">
                {activeTab === 'field' && (
                  <div className="space-y-4">
                    {/* Field Visualization */}
                    <div className="relative w-full aspect-square bg-gradient-to-b from-emerald-50 to-emerald-100 rounded-2xl border-4 border-emerald-700 shadow-lg overflow-hidden max-h-96">
                      {/* Foul Lines */}
                      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
                        <line x1="50" y1="100" x2="15" y2="35" stroke="white" strokeWidth="1" opacity="0.5" />
                        <line x1="50" y1="100" x2="85" y2="35" stroke="white" strokeWidth="1" opacity="0.5" />
                        <circle cx="50" cy="50" r="20" fill="none" stroke="white" strokeWidth="0.8" opacity="0.3" />
                      </svg>
        
                      {/* Position Markers */}
                      {positions.map((pos) => (
                        <div key={pos.name} className="absolute transform -translate-x-1/2 -translate-y-1/2" style={{ top: `${pos.top}%`, left: `${pos.left}%` }}>
                          <div className={`w-10 h-10 ${pos.color} rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg border-2 border-white cursor-pointer hover:scale-110 transition-transform relative group`}>
                            {pos.label || pos.name}
                            <div className="absolute bottom-full mb-2 hidden group-hover:block bg-slate-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-20">
                              {gameState.lineup[positions.indexOf(pos)]?.name || pos.name}
                            </div>
                          </div>
                        </div>
                      ))}
        
                      {/* Base Runners */}
                      <div className="absolute bottom-1/4 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-white rounded-full border-2 border-slate-400 flex items-center justify-center text-xs font-bold">
                        {gameState.runners.first ? '1' : ''}
                      </div>
                      <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-white rounded-full border-2 border-slate-400 flex items-center justify-center text-xs font-bold">
                        {gameState.runners.second ? '2' : ''}
                      </div>
                      <div className="absolute bottom-1/4 right-1/4 w-8 h-8 bg-white rounded-full border-2 border-slate-400 flex items-center justify-center text-xs font-bold">
                        {gameState.runners.third ? '3' : ''}
                      </div>
        
                      {/* Control Buttons */}
                      <div className="absolute inset-0 flex items-center justify-center gap-4 opacity-0 hover:opacity-100 transition-opacity bg-black/20 rounded-2xl">
                        <button onClick={() => toggleRunner('first')} className="px-4 py-2 bg-white text-slate-900 rounded-lg font-bold text-sm hover:bg-slate-100">Toggle 1B</button>
                        <button onClick={() => toggleRunner('second')} className="px-4 py-2 bg-white text-slate-900 rounded-lg font-bold text-sm hover:bg-slate-100">Toggle 2B</button>
                        <button onClick={() => toggleRunner('third')} className="px-4 py-2 bg-white text-slate-900 rounded-lg font-bold text-sm hover:bg-slate-100">Toggle 3B</button>
                      </div>
                    </div>
        
                    {/* Shift Controls */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white p-4 rounded-xl shadow-md border border-slate-200">
                        <label className="block text-sm font-bold text-slate-700 mb-2">Infield Shift</label>
                        <select value={infieldShift} onChange={(e) => setInfieldShift(e.target.value as InfieldShift)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500">
                          <option>Standard</option>
                          <option>Infield In</option>
                          <option>Corners In</option>
                          <option>Double Play</option>
                          <option>Pull (Righty)</option>
                          <option>Pull (Lefty)</option>
                        </select>
                      </div>
        
                      <div className="bg-white p-4 rounded-xl shadow-md border border-slate-200">
                        <label className="block text-sm font-bold text-slate-700 mb-2">Outfield Shift</label>
                        <select value={outfieldShift} onChange={(e) => setOutfieldShift(e.target.value as OutfieldShift)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500">
                          <option>Standard</option>
                          <option>Deep</option>
                          <option>Shallow</option>
                          <option>Shift Left</option>
                          <option>Shift Right</option>
                        </select>
                      </div>
                    </div>
        
                    {/* Play Buttons */}
                    <div className="grid grid-cols-3 gap-3">
                      <button onClick={openHitModal} className="bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 shadow-md transition-colors flex items-center justify-center gap-2">
                        <Check className="w-5 h-5" />
                        Hit / Walk
                      </button>
                      <button onClick={recordOut} className="bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-700 shadow-md transition-colors flex items-center justify-center gap-2">
                        <X className="w-5 h-5" />
                        Out
                      </button>
                      <button onClick={() => fetchAdvice()} disabled={loading} className="bg-emerald-600 text-white font-bold py-3 rounded-xl hover:bg-emerald-700 shadow-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
                        Advice
                      </button>
                    </div>
        
                    {/* Strategy Advice */}
                    {advice && (
                      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-4 rounded-xl border-2 border-indigo-200 shadow-md">
                        <div className="flex items-start gap-3">
                          <Shield className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-1" />
                          <div className="flex-1">
                            <p className="text-sm font-bold text-indigo-900">{advice}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
        
                {activeTab === 'lineup' && hasSeamScoreAccess && (
                  <div className="space-y-3">
                    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded flex items-start gap-3 mb-4">
                      <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-blue-900">Live Lineup Tracking</p>
                        <p className="text-sm text-blue-800">Track your current batter and substitutions in real-time during the game.</p>
                      </div>
                    </div>
                    {gameState.lineup.map((player, idx) => (
                      <div key={idx} className={`p-4 rounded-xl border-2 transition-all ${idx === gameState.currentBatterIndex ? 'bg-amber-50 border-amber-400 shadow-lg' : 'bg-white border-slate-200'}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${idx === gameState.currentBatterIndex ? 'bg-amber-500' : 'bg-slate-400'}`}>
                              {idx + 1}
                            </div>
                            <div>
                                  <p className="font-bold text-slate-900">{player.name}</p>
                                  <p className="text-xs text-slate-500">{'N/A'}</p>
                                </div>
                          </div>
                          {idx === gameState.currentBatterIndex && (
                            <div className="flex items-center gap-2 bg-amber-100 px-3 py-1 rounded-full">
                              <Trophy className="w-4 h-4 text-amber-600" />
                              <span className="text-xs font-bold text-amber-700">At Bat</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
        
                {activeTab === 'whiteboard' && (
                  <Whiteboard sport="Baseball" />
                )}
              </div>
            </div>
          );
        };
        
        export default GameMode;
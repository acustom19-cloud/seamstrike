
import React, { useState, useEffect } from 'react';
import { GameState, LeagueSettings, Player, SubscriptionTier } from '../types';
import { getStrategyAdvice } from '../services/geminiService.ts';
import { Loader2, RefreshCw, AlertTriangle, Shield, ArrowLeftRight, User, Lock, Activity, CheckCircle2, Info, X, Edit2, HelpCircle, Trophy, FastForward, Check, PenTool } from 'lucide-react';
import InfoTooltip from './InfoTooltip.tsx';
import SeamStrikeLogo from './SeamStrikeLogo.tsx';
import Whiteboard from './Whiteboard.tsx';

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
  const [customQuery, setCustomQuery] = useState("");

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
          applyHitResult(type, newRunners, runsAdded);
      } else if (type === 'HR') {
          // Clear bases, count runs
          runsAdded = 1 + (runners.first ? 1 : 0) + (runners.second ? 1 : 0) + (runners.third ? 1 : 0);
          newRunners = { first: false, second: false, third: false };
          applyHitResult(type, newRunners, runsAdded);
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

  const applyHitResult = (type: HitType, finalRunners: { first: boolean, second: boolean, third: boolean }, runs: number) => {
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
                                  onClick={() => pendingHitType && applyHitResult(pendingHitType, proposedRunners, proposedRuns)} 
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
        
        <div className="flex justify-between items-center mb-4">
          <div className="flex-1 flex items-center justify-between space-x-4">
             {/* US / Team Name */}
             <div className="flex-1 text-right">
                <span className="block text-2xl font-bold font-mono tracking-tight truncate">
                   {league.name.length > 15 ? league.name.substring(0, 15) + '...' : league.name}
                </span>
                <span className="block text-4xl font-bold font-mono text-emerald-400">{gameState.scoreUs}</span>
             </div>
             
             <div className="px-4 text-slate-500 text-xl font-light">-</div>

             {/* THEM / Opponent Name */}
             <div className="flex-1 text-left relative group">
                <div className="flex items-center">
                    {isEditingOpponent ? (
                         <input 
                            autoFocus
                            className="bg-slate-800 text-white text-xl font-bold font-mono border border-slate-600 rounded px-1 w-full max-w-[150px] outline-none"
                            value={opponentName}
                            onChange={(e) => setOpponentName(e.target.value)}
                            onBlur={() => setIsEditingOpponent(false)}
                            onKeyDown={(e) => e.key === 'Enter' && setIsEditingOpponent(false)}
                         />
                    ) : (
                         <span 
                            className="block text-2xl font-bold font-mono tracking-tight truncate cursor-pointer hover:text-indigo-300"
                            onClick={() => setIsEditingOpponent(true)}
                            title="Click to edit opponent name"
                         >
                            {opponentName.length > 15 ? opponentName.substring(0, 15) + '...' : opponentName}
                            <Edit2 className="w-3 h-3 inline ml-2 opacity-0 group-hover:opacity-100" />
                         </span>
                    )}
                </div>
                <span className="block text-4xl font-bold font-mono text-red-400">{gameState.scoreThem}</span>
             </div>
          </div>
          <div className="flex items-center space-x-2 ml-4 pl-4 border-l border-slate-700">
            <span className="text-xl font-bold">{gameState.isTop ? '▲' : '▼'} {gameState.inning}</span>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row justify-between items-end gap-4">
          <div className="flex space-x-6 relative">
            <div className="flex flex-col items-center cursor-pointer select-none group" onClick={addBall}>
              <span className="text-xs text-slate-400 uppercase group-hover:text-white">Ball</span>
              <span className={`text-3xl font-bold ${gameState.balls === 4 ? 'text-green-400' : ''}`}>{gameState.balls}</span>
            </div>
            <div className="flex flex-col items-center cursor-pointer select-none group" onClick={addStrike}>
              <span className="text-xs text-slate-400 uppercase group-hover:text-white">Strike</span>
              <span className={`text-3xl font-bold ${gameState.strikes === 3 ? 'text-red-400' : ''}`}>{gameState.strikes}</span>
            </div>
            <div className="flex flex-col items-center cursor-pointer select-none group" onClick={addOut}>
              <span className="text-xs text-slate-400 uppercase group-hover:text-white">Out</span>
              <span className={`text-3xl font-bold ${gameState.outs === 3 ? 'text-red-500' : ''}`}>{gameState.outs}</span>
            </div>
          </div>

          <div className="flex space-x-2">
              <button onClick={openHitModal} className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1 rounded text-xs font-bold shadow-md flex items-center">
                  <FastForward className="w-3 h-3 mr-1" /> HIT / WALK
              </button>
              <button onClick={recordOut} className="bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded text-xs font-bold shadow-md flex items-center">
                  <X className="w-3 h-3 mr-1" /> OUT
              </button>
          </div>

          <div className="flex flex-col items-end">
             <div className="flex items-center space-x-2 mb-1">
                {isWarning && (
                    <span className="text-xs text-yellow-400 font-bold animate-pulse">Approaching Limit</span>
                )}
                {isOverLimit && (
                    <div className="flex items-center text-red-500 animate-pulse">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        <span className="text-xs font-bold">MAX</span>
                    </div>
                )}
                <div className="text-xs text-slate-400">Pitch Count / {limit}</div>
             </div>
             
             <div className="flex items-center space-x-2">
                <button 
                  onClick={() => setGameState(p => ({...p, pitchCount: Math.max(0, p.pitchCount - 1)}))}
                  className="w-8 h-8 rounded bg-slate-700 hover:bg-slate-600 flex items-center justify-center"
                >-</button>
                <span className={`text-xl font-mono w-12 text-center font-bold ${
                    isOverLimit ? 'text-red-500' : isWarning ? 'text-yellow-400' : 'text-white'
                }`}>{gameState.pitchCount}</span>
                <button 
                  onClick={() => setGameState(p => ({...p, pitchCount: p.pitchCount + 1}))}
                  className="w-8 h-8 rounded bg-emerald-600 hover:bg-emerald-500 flex items-center justify-center"
                >+</button>
             </div>
          </div>
        </div>
      </div>

      {/* View Switcher */}
      <div className="flex space-x-2">
         <button 
           onClick={() => setActiveTab('field')}
           className={`flex-1 py-2 rounded-lg font-bold text-sm flex items-center justify-center transition-all ${activeTab === 'field' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
         >
           <Shield className="w-4 h-4 mr-2" /> Field View
         </button>
         
         <button 
           onClick={() => setActiveTab('whiteboard')}
           className={`flex-1 py-2 rounded-lg font-bold text-sm flex items-center justify-center transition-all ${activeTab === 'whiteboard' ? 'bg-slate-800 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
         >
           <PenTool className="w-4 h-4 mr-2" /> 
           Whiteboard
           <InfoTooltip text="Draw plays and adjustments on a blank or field canvas." />
         </button>
         
         <div className="flex-1 relative">
            <button 
                onClick={() => setActiveTab('lineup')}
                className={`w-full py-2 rounded-lg font-bold text-sm flex items-center justify-center transition-all relative overflow-hidden ${activeTab === 'lineup' ? 'bg-amber-500 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
                >
                {activeTab === 'lineup' && <div className="absolute inset-0 bg-white/10" />}
                <Activity className="w-4 h-4 mr-2" /> SeamScore Lineup
                {!hasSeamScoreAccess && <Lock className="w-3 h-3 ml-2 opacity-70" />}
            </button>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    setShowInfoModal(true);
                }}
                className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full transition-colors z-10 ${activeTab === 'lineup' ? 'text-white/80 hover:bg-white/20' : 'text-slate-400 hover:bg-slate-100 hover:text-indigo-600'}`}
                title="View Features"
            >
                <Info className="w-4 h-4" />
            </button>
         </div>
      </div>

      {/* Feature Info Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowInfoModal(false)}>
            <div 
                className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center">
                     <h3 className="font-bold text-slate-800 flex items-center">
                        <Activity className="w-5 h-5 mr-2 text-amber-500" />
                        SeamScore™ Features
                     </h3>
                     <button onClick={() => setShowInfoModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X className="w-5 h-5" />
                     </button>
                </div>
                <div className="p-6">
                    <p className="text-sm text-slate-500 mb-4">
                        Upgrade to SeamScore to unlock professional real-time game management tools:
                    </p>
                    <div className="space-y-3">
                        {SEAMSCORE_FEATURES.map((feature, i) => (
                            <div key={i} className="flex items-start">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500 mr-3 mt-0.5 flex-shrink-0" />
                                <span className="text-sm font-medium text-slate-700">{feature}</span>
                            </div>
                        ))}
                    </div>
                    
                    <div className="mt-6 pt-4 border-t border-slate-100">
                        {!hasSeamScoreAccess ? (
                            <button 
                                onClick={() => {
                                    setShowInfoModal(false);
                                    setActiveTab('lineup');
                                }}
                                className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all transform active:scale-95"
                            >
                                Get Access Now
                            </button>
                        ) : (
                             <button 
                                onClick={() => setShowInfoModal(false)}
                                className="w-full py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                            >
                                Close
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Field View Content */}
      {activeTab === 'field' && (
        <>
            {/* Defensive Controls */}
            <div className="grid grid-cols-2 gap-4 bg-white p-3 rounded-xl shadow-sm border border-slate-200 flex-shrink-0 relative">
                {showQuickGuide && (
                    <GuideOverlay target="left-[50%] top-[-10px] -translate-x-1/2" text="Tap buttons to reposition defense" position="top" />
                )}
                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase flex items-center mb-2">
                        <Shield className="w-3 h-3 mr-1" /> Infield Shift
                        <InfoTooltip text="Automatically moves player markers on the field view to match strategy." />
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {(['Standard', 'Infield In', 'Corners In', 'Double Play', 'Pull (Righty)', 'Pull (Lefty)'] as InfieldShift[]).map(s => (
                            <button
                                key={s}
                                onClick={() => setInfieldShift(s)}
                                className={`text-xs px-2 py-1 rounded border transition-colors ${
                                    infieldShift === s 
                                    ? 'bg-indigo-600 text-white border-indigo-600' 
                                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                }`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>
                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase flex items-center mb-2">
                        <ArrowLeftRight className="w-3 h-3 mr-1" /> Outfield Shift
                        <InfoTooltip text="Adjusts depth and lateral positioning of outfielders." />
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {(['Standard', 'Deep', 'Shallow', 'Shift Left', 'Shift Right'] as OutfieldShift[]).map(s => (
                            <button
                                key={s}
                                onClick={() => setOutfieldShift(s)}
                                className={`text-xs px-2 py-1 rounded border transition-colors ${
                                    outfieldShift === s 
                                    ? 'bg-blue-600 text-white border-blue-600' 
                                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                }`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-grow min-h-0">
                {/* 3D Field Visualization */}
                <div className="rounded-xl shadow-inner relative flex items-center justify-center overflow-hidden border border-slate-300 min-h-[400px] lg:min-h-0 bg-slate-200">
                {showQuickGuide && (
                    <GuideOverlay target="left-[50%] top-[30%] -translate-x-1/2" text="Click bases to toggle runners" position="bottom" />
                )}
                
                <div className="relative w-full max-w-[500px] aspect-square" style={{ perspective: '1000px' }}>
                    {/* The Field Plane */}
                    <div 
                        className={`w-full h-full relative transform-gpu transition-transform duration-500 ease-in-out ${league.sport === 'Baseball' ? 'bg-[#2d5a27]' : 'bg-[#1a472a]'}`}
                        style={{ 
                            transform: 'rotateX(25deg) scale(0.9)', 
                            transformStyle: 'preserve-3d',
                            borderRadius: '10%',
                            boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
                        }}
                    >
                        {/* Grass Texture Effect */}
                        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 20px, #000 20px, #000 40px)' }}></div>

                        {/* Infield Dirt */}
                        <div 
                            className="absolute top-1/2 left-1/2 w-[40%] h-[40%] bg-[#d2b48c] shadow-lg"
                            style={{ 
                                transform: 'translate(-50%, -50%) rotate(45deg)',
                                boxShadow: 'inset 0 0 20px rgba(0,0,0,0.2)'
                            }}
                        >
                            {league.sport === 'Baseball' && (
                                <div className="absolute inset-[15%] bg-[#2d5a27] border border-black/5"></div>
                            )}
                        </div>

                        {/* Foul Lines */}
                        <div className="absolute top-[80%] left-1/2 w-[140%] h-[2px] bg-white transform -translate-x-1/2 -translate-y-1/2 rotate-[-45deg] origin-center opacity-80 z-0"></div>
                        <div className="absolute top-[80%] left-1/2 w-[140%] h-[2px] bg-white transform -translate-x-1/2 -translate-y-1/2 rotate-[-135deg] origin-center opacity-80 z-0"></div>
                        
                        {/* Bases */}
                        <div 
                            onClick={() => toggleRunner('second')}
                            className={`absolute top-[21.5%] left-1/2 w-[4%] h-[4%] -ml-[2%] bg-white transform rotate-45 z-10 cursor-pointer shadow-md transition-colors ${gameState.runners.second ? 'bg-yellow-400 ring-2 ring-yellow-500' : ''}`}
                        ></div>

                        <div 
                            className="absolute top-[78.5%] left-1/2 w-[4%] h-[4%] -ml-[2%] bg-white z-10" 
                            style={{ clipPath: 'polygon(0 0, 50% 100%, 100% 0)' }}
                        ></div>

                        <div 
                            onClick={() => toggleRunner('first')}
                            className={`absolute top-[50%] left-[78.5%] w-[4%] h-[4%] -mt-[2%] -ml-[2%] bg-white transform rotate-45 z-10 cursor-pointer shadow-md transition-colors ${gameState.runners.first ? 'bg-yellow-400 ring-2 ring-yellow-500' : ''}`}
                        ></div>

                        <div 
                            onClick={() => toggleRunner('third')}
                            className={`absolute top-[50%] left-[21.5%] w-[4%] h-[4%] -mt-[2%] -ml-[2%] bg-white transform rotate-45 z-10 cursor-pointer shadow-md transition-colors ${gameState.runners.third ? 'bg-yellow-400 ring-2 ring-yellow-500' : ''}`}
                        ></div>

                        {/* Mound */}
                        <div className="absolute top-1/2 left-1/2 w-[8%] h-[8%] rounded-full bg-[#c0a07c] transform -translate-x-1/2 -translate-y-1/2 border border-black/10 shadow-sm z-10 flex items-center justify-center">
                            <div className="w-[40%] h-[2px] bg-white mb-1"></div>
                        </div>

                        {/* Defensive Players */}
                        {positions.map((p) => (
                            <div 
                                key={p.name}
                                className="absolute w-0 h-0 z-50"
                                style={{ 
                                    top: `${p.top}%`, 
                                    left: `${p.left}%`,
                                }}
                            >
                                <div 
                                    className={`absolute flex flex-col items-center justify-center transition-all duration-500 ease-out`}
                                    style={{ 
                                        transform: 'translate(-50%, -100%) rotateX(-25deg)',
                                    }}
                                >
                                    <div className={`w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-[10px] font-black text-white tracking-tighter ${p.color}`}>
                                        {p.label || p.name}
                                    </div>
                                    <div className={`w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[6px] ${p.color.replace('bg-', 'border-t-')}`}></div>
                                </div>
                                <div className="absolute w-6 h-2 bg-black/40 blur-[2px] rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
                            </div>
                        ))}
                    </div>
                </div>
                
                <div className="absolute bottom-2 left-4 text-slate-500/50 text-[10px] font-mono uppercase tracking-widest pointer-events-none">
                    {league.sport} Field View • {league.fielderCount} Man
                </div>
                </div>

                {/* AI Strategy Console */}
                <div className="bg-slate-50 rounded-xl shadow p-4 flex flex-col border border-slate-200 relative">
                {showQuickGuide && (
                    <GuideOverlay target="right-4 top-14" text="Get AI advice based on current count/score" position="left" />
                )}
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-lg font-bold flex items-center text-slate-800">
                    <SeamStrikeLogo className="w-5 h-5 mr-2" sport={league.sport} />
                    SeamStrike Intelligence
                    </h2>
                    <button 
                    onClick={() => fetchAdvice()} 
                    disabled={loading}
                    className="text-sm bg-indigo-600 text-white px-3 py-1 rounded-full hover:bg-indigo-700 flex items-center disabled:opacity-50 transition-all shadow-sm"
                    >
                    {loading ? <Loader2 className="w-3 h-3 animate-spin mr-1"/> : <RefreshCw className="w-3 h-3 mr-1"/>}
                    Analyze
                    </button>
                </div>
                
                <div className="flex-grow bg-white border border-slate-200 rounded-lg p-4 mb-3 overflow-y-auto max-h-64 shadow-inner">
                    {advice ? (
                    <div className="prose prose-sm prose-slate">
                        <div dangerouslySetInnerHTML={{ __html: advice.replace(/\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                    </div>
                    ) : (
                    <div className="text-slate-400 text-center italic mt-10">
                        Update game state and click Analyze for proactive strategy.
                    </div>
                    )}
                </div>

                <div className="relative">
                    <input 
                    type="text" 
                    placeholder="Ask specific question..."
                    className="w-full border border-slate-300 rounded-lg pl-3 pr-10 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={customQuery}
                    onChange={(e) => setCustomQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && fetchAdvice(customQuery)}
                    />
                    <button 
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-indigo-600 hover:text-indigo-800"
                    onClick={() => fetchAdvice(customQuery)}
                    >
                    ➤
                    </button>
                </div>
                </div>
            </div>
        </>
      )}

      {/* Whiteboard View */}
      {activeTab === 'whiteboard' && (
          <div className="flex-grow h-full min-h-[400px]">
              <Whiteboard sport={league.sport} />
          </div>
      )}

      {/* SeamScore Lineup View (Premium) */}
      {activeTab === 'lineup' && (
        <div className="flex-grow bg-white rounded-xl shadow-sm border border-slate-200 relative overflow-hidden flex flex-col">
            {/* Premium Gate Overlay */}
            {!hasSeamScoreAccess && (
                <div className="absolute inset-0 bg-slate-900/95 z-50 flex flex-col items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-slate-800 p-6 md:p-8 rounded-2xl border border-slate-700 shadow-2xl max-w-md w-full relative overflow-hidden">
                        {/* Background sheen */}
                        <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl"></div>
                        
                        <div className="relative z-10">
                            <div className="flex justify-center mb-6">
                               <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3">
                                   <Activity className="w-8 h-8 text-white" />
                               </div>
                            </div>
                            
                            <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-2 text-center">Unlock SeamScore™</h2>
                            <p className="text-slate-400 mb-6 text-center text-sm">Upgrade your dugout with professional-grade real-time management tools.</p>
                            
                            <div className="space-y-3 mb-8 bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
                                {SEAMSCORE_FEATURES.map((feature, i) => (
                                    <div key={i} className="flex items-center text-slate-200">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-400 mr-3 flex-shrink-0" />
                                        <span className="text-sm font-medium">{feature}</span>
                                    </div>
                                ))}
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
                                <button 
                                    onClick={() => onUpgrade('SingleGame')} 
                                    className="flex flex-col items-center justify-center p-3 bg-slate-700 hover:bg-slate-600 rounded-xl border border-slate-600 transition-all hover:scale-[1.02] active:scale-95"
                                >
                                    <span className="text-slate-400 text-[10px] uppercase font-bold mb-1">Single Game</span>
                                    <span className="text-white text-lg font-bold">$0.99</span>
                                </button>
                                <button 
                                    onClick={() => onUpgrade('SeasonPass')} 
                                    className="flex flex-col items-center justify-center p-3 bg-gradient-to-b from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 rounded-xl shadow-lg transition-all hover:scale-[1.02] active:scale-95 border-t border-amber-400"
                                >
                                    <span className="text-amber-100 text-[10px] uppercase font-bold mb-1">Season Pass</span>
                                    <span className="text-white text-lg font-bold">$9.99</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-lg text-slate-800 flex items-center">
                    <Activity className="w-5 h-5 mr-2 text-amber-500" /> 
                    Live Batting Order
                </h3>
                <div className="text-sm text-slate-500">
                    <span className="font-mono font-bold text-slate-900">{gameState.lineup.length}</span> Batters
                </div>
            </div>

            <div className="flex-grow overflow-y-auto p-2">
                {gameState.lineup.map((player, index) => {
                    const isUp = index === gameState.currentBatterIndex;
                    const isOnDeck = index === (gameState.currentBatterIndex + 1) % gameState.lineup.length;
                    const isInHole = index === (gameState.currentBatterIndex + 2) % gameState.lineup.length;

                    return (
                        <div 
                            key={player.id} 
                            className={`flex items-center p-3 mb-2 rounded-lg border transition-all ${
                                isUp 
                                ? 'bg-amber-50 border-amber-300 shadow-sm ring-1 ring-amber-200' 
                                : 'bg-white border-slate-100 text-slate-500 opacity-80'
                            }`}
                        >
                            <div className="w-8 font-mono font-bold text-slate-400 text-sm">{index + 1}</div>
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-slate-200 overflow-hidden mr-3">
                                {player.imageUrl ? (
                                    <img src={player.imageUrl} alt={player.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-slate-300 text-white">
                                        <User className="w-5 h-5" />
                                    </div>
                                )}
                            </div>
                            <div className="flex-grow">
                                <div className="flex items-center">
                                    <span className={`font-bold ${isUp ? 'text-slate-900 text-lg' : 'text-slate-600'}`}>
                                        {player.name}
                                    </span>
                                    {isUp && <span className="ml-2 px-2 py-0.5 bg-amber-500 text-white text-[10px] font-bold rounded uppercase tracking-wider">At Bat</span>}
                                    {isOnDeck && <span className="ml-2 px-2 py-0.5 bg-slate-200 text-slate-600 text-[10px] font-bold rounded uppercase tracking-wider">On Deck</span>}
                                    {isInHole && <span className="ml-2 px-2 py-0.5 bg-slate-100 text-slate-400 text-[10px] font-bold rounded uppercase tracking-wider">Hole</span>}
                                </div>
                                <div className="text-xs text-slate-400 flex space-x-3 mt-1">
                                    <span>#{player.number}</span>
                                    <span>{player.primaryPosition}</span>
                                    <span>{player.batHand}/{player.throwHand}</span>
                                    <span className="font-mono text-slate-500">AVG {player.battingAvg.toFixed(3)}</span>
                                </div>
                            </div>
                            <div className="text-right">
                                {isUp && (
                                    <button 
                                        className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded hover:bg-indigo-100 font-medium"
                                        onClick={(e) => { e.stopPropagation(); alert("Substitutions would open roster modal here."); }}
                                    >
                                        Sub
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
            
            <div className="p-3 bg-slate-100 border-t border-slate-200 text-center text-xs text-slate-500">
                SeamScore™ Real-Time Tracking
            </div>
        </div>
      )}
    </div>
  );
};

export default GameMode;


import React, { useState, useEffect, useMemo } from 'react';
import { Player, LeagueSettings, DefenseRule, Position } from '../types';
import { DEFENSIVE_RULES, POSITIONS_LIST } from '../constants';
import { generateDefensiveRotation } from '../services/geminiService.ts';
import { Shield, Settings, Loader2, Sparkles, AlertCircle, Grid3X3, Bot, AlertTriangle, Check, RefreshCw } from 'lucide-react';
import InfoTooltip from './InfoTooltip.tsx';

interface DefenseBuilderProps {
  roster: Player[];
  league: LeagueSettings;
}

type Mode = 'ai' | 'manual';
type RotationMatrix = Record<string, string[]>; // PlayerID -> Array of Positions (index = inning - 1)

const DefenseBuilder: React.FC<DefenseBuilderProps> = ({ roster, league }) => {
  const [mode, setMode] = useState<Mode>('manual');
  const [gameInnings, setGameInnings] = useState(league.innings || 6);
  const [rules, setRules] = useState<DefenseRule[]>(DEFENSIVE_RULES);
  
  // AI State
  const [aiResult, setAiResult] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  // Manual State
  const [matrix, setMatrix] = useState<RotationMatrix>({});
  const [conflicts, setConflicts] = useState<string[]>([]);

  // Initialize Matrix on load or roster/inning change
  useEffect(() => {
    const initialMatrix: RotationMatrix = {};
    roster.forEach(p => {
        // Pre-fill with Bench ('BN')
        initialMatrix[p.id] = Array(gameInnings).fill('BN');
    });
    setMatrix(initialMatrix);
  }, [roster, gameInnings]);

  // Run validation whenever matrix or rules change
  useEffect(() => {
    validateRotation();
  }, [matrix, rules, roster, league.fielderCount]);

  const toggleRule = (id: string) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, active: !r.active } : r));
  };

  const handleAiGenerate = async () => {
    if (roster.length === 0) {
      setAiResult("Please add players to your roster first.");
      return;
    }
    setAiLoading(true);
    const activeRules = rules.filter(r => r.active);
    const rotation = await generateDefensiveRotation(roster, gameInnings, activeRules, league);
    setAiResult(rotation);
    setAiLoading(false);
  };

  const handlePositionChange = (playerId: string, inningIdx: number, newPos: string) => {
      setMatrix(prev => ({
          ...prev,
          [playerId]: prev[playerId].map((pos, idx) => idx === inningIdx ? newPos : pos)
      }));
  };

  const resetMatrix = () => {
      if(confirm("Clear entire rotation?")) {
        const reset: RotationMatrix = {};
        roster.forEach(p => reset[p.id] = Array(gameInnings).fill('BN'));
        setMatrix(reset);
      }
  }

  const validateRotation = () => {
      const newConflicts: string[] = [];
      const activeRulesIds = rules.filter(r => r.active).map(r => r.id);

      // 1. Check Duplicates & Fielder Counts per Inning
      for (let i = 0; i < gameInnings; i++) {
          const inningPositions = roster.map(p => matrix[p.id]?.[i]).filter(pos => pos !== 'BN');
          
          // Count players on field
          if (inningPositions.length > league.fielderCount) {
              newConflicts.push(`Inning ${i + 1}: Too many fielders (${inningPositions.length}/${league.fielderCount}).`);
          } else if (inningPositions.length < league.fielderCount && inningPositions.length < roster.length) {
              // Only warn about too few if we actually have enough roster spots to fill it
              newConflicts.push(`Inning ${i + 1}: Not enough fielders (${inningPositions.length}/${league.fielderCount}).`);
          }

          // Check duplicates
          const seen = new Set();
          inningPositions.forEach(pos => {
              if (seen.has(pos)) {
                  newConflicts.push(`Inning ${i + 1}: Duplicate position '${pos}'.`);
              }
              seen.add(pos);
          });
      }

      // 2. Check Player Specific Rules
      roster.forEach(p => {
          const positions = matrix[p.id] || [];
          
          // Rule: No Consecutive Bench
          if (activeRulesIds.includes('no_consecutive_bench')) {
              for (let i = 0; i < positions.length - 1; i++) {
                  if (positions[i] === 'BN' && positions[i+1] === 'BN') {
                      newConflicts.push(`${p.name} sits consecutive innings (${i+1} & ${i+2}).`);
                  }
              }
          }

          // Rule: Infield Rotation
          if (activeRulesIds.includes('infield_rotation')) {
              const infieldPos = ['P','C','1B','2B','3B','SS'];
              const playedInfield = positions.some(pos => infieldPos.includes(pos));
              if (!playedInfield) {
                  newConflicts.push(`${p.name} has no Infield innings.`);
              }
          }

          // Rule: Rotate Catcher
          if (activeRulesIds.includes('rotate_catcher')) {
               let consecutiveCatching = 0;
               for(const pos of positions) {
                   if (pos === 'C') consecutiveCatching++;
                   else consecutiveCatching = 0;
                   if (consecutiveCatching > 2) {
                       newConflicts.push(`${p.name} catching > 2 innings in a row.`);
                       break;
                   }
               }
          }
      });

      // Rule: Fair Play (Variance check)
      if (activeRulesIds.includes('fair_play')) {
          const inningCounts = roster.map(p => (matrix[p.id] || []).filter(pos => pos !== 'BN').length);
          const min = Math.min(...inningCounts);
          const max = Math.max(...inningCounts);
          if (max - min > 1) {
              newConflicts.push(`Fair Play Violation: Innings played range from ${min} to ${max}.`);
          }
      }

      setConflicts(newConflicts);
  };

  const getPosColor = (pos: string) => {
      if (pos === 'BN') return 'bg-slate-100 text-slate-400';
      if (pos === 'P') return 'bg-emerald-100 text-emerald-700 font-bold border-emerald-200';
      if (['C', '1B', '2B', '3B', 'SS'].includes(pos)) return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      if (['LF', 'CF', 'RF', 'LC', 'RC'].includes(pos)) return 'bg-blue-50 text-blue-700 border-blue-200';
      return 'bg-white';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
      {/* Configuration Panel */}
      <div className="lg:col-span-1 space-y-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
            <Shield className="w-5 h-5 mr-2 text-indigo-600" />
            Defense Builder
          </h2>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center">
                Game Duration
                <InfoTooltip text="Total number of innings." />
            </label>
            <div className="flex gap-2">
              {[6, 7, 8, 9].map(num => (
                <button
                  key={num}
                  onClick={() => setGameInnings(num)}
                  className={`flex-1 py-2 rounded-lg font-bold border transition-colors ${
                    gameInnings === num 
                    ? 'bg-indigo-600 text-white border-indigo-600' 
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center">
                <Settings className="w-4 h-4 mr-2" />
                Rotation Rules
                <InfoTooltip text="Rules are checked in Real-Time for Manual Mode and strictly followed in AI Mode." />
            </h3>
            <div className="space-y-2">
              {rules.map(rule => (
                <div 
                    key={rule.id} 
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${rule.active ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-200 hover:border-slate-300'}`}
                    onClick={() => toggleRule(rule.id)}
                >
                  <div className="flex items-start">
                    <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center mr-3 flex-shrink-0 ${rule.active ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'}`}>
                        {rule.active && <div className="w-2 h-2 bg-white rounded-full" />}
                    </div>
                    <div>
                        <p className={`text-xs font-bold ${rule.active ? 'text-indigo-900' : 'text-slate-700'}`}>{rule.label}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start">
            <AlertCircle className="w-4 h-4 text-amber-600 mr-2 flex-shrink-0 mt-0.5" />
            <p className="text-[10px] text-amber-800 leading-snug">
                <strong>Manual Mode:</strong> Allows conflicts but warns you.<br/>
                <strong>AI Mode:</strong> Generates a strict plan.
            </p>
        </div>
        </div>
      </div>

      {/* Main Builder Area */}
      <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full min-h-[600px] overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row justify-between items-center gap-4">
             <div className="flex bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
                 <button 
                    onClick={() => setMode('manual')}
                    className={`px-4 py-2 rounded-md text-sm font-bold flex items-center transition-colors ${mode === 'manual' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
                 >
                     <Grid3X3 className="w-4 h-4 mr-2" /> Interactive Builder
                 </button>
                 <button 
                    onClick={() => setMode('ai')}
                    className={`px-4 py-2 rounded-md text-sm font-bold flex items-center transition-colors ${mode === 'ai' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
                 >
                     <Bot className="w-4 h-4 mr-2" /> AI Auto-Gen
                 </button>
             </div>

             {mode === 'manual' && (
                 <button onClick={resetMatrix} className="text-slate-500 hover:text-red-500 text-sm font-bold flex items-center">
                     <RefreshCw className="w-4 h-4 mr-1.5" /> Reset Grid
                 </button>
             )}
             
             {mode === 'ai' && (
                 <button 
                    onClick={handleAiGenerate}
                    disabled={aiLoading}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center shadow-md disabled:opacity-50"
                 >
                     {aiLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                     Generate New Plan
                 </button>
             )}
        </div>

        {/* Content */}
        <div className="flex-grow overflow-auto p-6">
            
            {/* MANUAL MODE */}
            {mode === 'manual' && (
                <div className="min-w-[800px]">
                    {/* Conflict Banner */}
                    {conflicts.length > 0 ? (
                        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4 animate-fade-in">
                            <h4 className="text-sm font-bold text-amber-800 flex items-center mb-2">
                                <AlertTriangle className="w-4 h-4 mr-2" /> 
                                Rotation Conflicts ({conflicts.length})
                            </h4>
                            <ul className="list-disc list-inside space-y-1">
                                {conflicts.slice(0, 5).map((c, i) => (
                                    <li key={i} className="text-xs text-amber-700">{c}</li>
                                ))}
                                {conflicts.length > 5 && <li className="text-xs text-amber-700 font-bold">...and {conflicts.length - 5} more</li>}
                            </ul>
                        </div>
                    ) : (
                        <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-center">
                            <Check className="w-4 h-4 text-emerald-600 mr-2" />
                            <span className="text-xs font-bold text-emerald-800">Rotation looks good! No rule conflicts detected.</span>
                        </div>
                    )}

                    <table className="w-full border-collapse">
                        <thead>
                            <tr>
                                <th className="text-left p-2 text-sm font-bold text-slate-500 w-48 sticky left-0 bg-white z-10 border-b border-slate-200">Player</th>
                                {Array.from({ length: gameInnings }).map((_, i) => (
                                    <th key={i} className="text-center p-2 text-xs font-bold text-slate-400 border-b border-slate-200 min-w-[80px]">
                                        Inn {i+1}
                                    </th>
                                ))}
                                <th className="text-center p-2 text-xs font-bold text-slate-400 border-b border-slate-200">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {roster.map(player => {
                                const playerPos = matrix[player.id] || [];
                                const totalInnings = playerPos.filter(p => p !== 'BN').length;
                                return (
                                    <tr key={player.id} className="hover:bg-slate-50 transition-colors border-b border-slate-100">
                                        <td className="p-2 sticky left-0 bg-white z-10 border-r border-slate-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                                            <div className="font-bold text-sm text-slate-800">{player.name}</div>
                                            <div className="text-[10px] text-slate-400">{player.primaryPosition} • {player.secondaryPositions.join('/')}</div>
                                        </td>
                                        {Array.from({ length: gameInnings }).map((_, inningIdx) => {
                                            const currentPos = playerPos[inningIdx] || 'BN';
                                            return (
                                                <td key={inningIdx} className="p-1">
                                                    <select 
                                                        value={currentPos}
                                                        onChange={(e) => handlePositionChange(player.id, inningIdx, e.target.value)}
                                                        className={`w-full text-xs font-bold p-2 rounded border focus:ring-2 focus:ring-indigo-500 outline-none text-center cursor-pointer appearance-none transition-colors ${getPosColor(currentPos)}`}
                                                    >
                                                        <option value="BN">Bench</option>
                                                        <optgroup label="Infield">
                                                            {POSITIONS_LIST.filter(p => ['P','C','1B','2B','3B','SS'].includes(p)).map(p => (
                                                                <option key={p} value={p}>{p}</option>
                                                            ))}
                                                        </optgroup>
                                                        <optgroup label="Outfield">
                                                             {POSITIONS_LIST.filter(p => ['LF','CF','RF'].includes(p)).map(p => (
                                                                <option key={p} value={p}>{p}</option>
                                                            ))}
                                                            {/* Extra positions for 10-man */}
                                                            <option value="LC">LC</option>
                                                            <option value="RC">RC</option>
                                                        </optgroup>
                                                        <option value="DH">DH</option>
                                                    </select>
                                                </td>
                                            );
                                        })}
                                        <td className="p-2 text-center text-xs font-bold text-slate-600 bg-slate-50 border-l border-slate-100">
                                            {totalInnings}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* AI MODE */}
            {mode === 'ai' && (
                <div className="h-full flex flex-col">
                    {aiResult ? (
                        <div className="prose prose-slate max-w-none flex-grow">
                             <div dangerouslySetInnerHTML={{ __html: aiResult.replace(/\n/g, '<br/>').replace(/\|/g, '&#124;').replace(/-{3,}/g, '<hr/>').replace(/\*\*(.*?)\*\*/g, '<strong class="text-indigo-700">$1</strong>') }} />
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center flex-grow text-slate-400 py-20">
                            <Bot className="w-16 h-16 mb-4 text-slate-200" />
                            <p className="text-lg">AI Generator Ready</p>
                            <p className="text-sm text-center max-w-md mt-2">
                                Click "Generate New Plan" to have SeamStrike build a complete rotation based on your active rules.
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default DefenseBuilder;


import React, { useState, useEffect, useMemo } from 'react';
import { Player, LeagueSettings } from '../types';
import { generateLineupAnalysis } from '../services/geminiService.ts';
import { Sparkles, Loader2, FileText, ChevronRight, User, Edit3, Users, Grid3X3, RefreshCw, AlertTriangle, Check, BarChart2, Shield, Zap } from 'lucide-react';
import InfoTooltip from './InfoTooltip.tsx';
import SeamStrikeLogo from './SeamStrikeLogo.tsx';

interface LineupBuilderProps {
  roster: Player[];
  league: LeagueSettings;
}

const STRATEGIES = [
  "Standard (Best Hitters 3-5)",
  "Sabermetrics (Best OBP 1-2)",
  "Small Ball / Speed",
  "Everyone Bats (Fair Play)",
  "Opposite Field Focus",
  "Custom Strategy"
];

type Mode = 'ai' | 'manual';

const LineupBuilder: React.FC<LineupBuilderProps> = ({ roster, league }) => {
  const [mode, setMode] = useState<Mode>('manual');
  const [selectedStrategy, setSelectedStrategy] = useState(STRATEGIES[0]);
  const [customStrategy, setCustomStrategy] = useState("");
  const [batterCount, setBatterCount] = useState(9);
  
  // AI State
  const [analysis, setAnalysis] = useState("");
  const [loading, setLoading] = useState(false);

  // Manual State
  const [manualLineup, setManualLineup] = useState<(string | null)[]>([]); // Array of Player IDs
  const [conflicts, setConflicts] = useState<string[]>([]);

  // Initialize Manual Lineup array size
  useEffect(() => {
    setManualLineup(prev => {
        const count = Number(batterCount);
        const newArr = Array.from({ length: count }, () => null as string | null);
        // Preserve existing selections up to new length
        for(let i=0; i<Math.min(prev.length, count); i++) {
            newArr[i] = prev[i];
        }
        return newArr;
    });
  }, [batterCount]);

  // Validate Manual Lineup
  useEffect(() => {
      const newConflicts: string[] = [];
      const seen = new Set<string>();
      
      manualLineup.forEach((id, idx) => {
          if (!id) return;
          if (seen.has(id)) {
              const player = roster.find(p => p.id === id);
              newConflicts.push(`${player?.name || 'Player'} is batting multiple times (Slot ${manualLineup.indexOf(id) + 1} & ${idx + 1}).`);
          }
          seen.add(id);
      });

      setConflicts(newConflicts);
  }, [manualLineup, roster]);

  const handleManualSelect = (index: number, playerId: string) => {
      const newArr = [...manualLineup];
      newArr[index] = playerId === "" ? null : playerId;
      setManualLineup(newArr);
  };

  const handleGenerate = async () => {
    if (roster.length === 0) {
        setAnalysis("Please add players to your roster first.");
        return;
    }

    if (roster.length < batterCount) {
        setAnalysis(`Insufficient players on roster. You requested a lineup of ${batterCount} batters, but only have ${roster.length} available.`);
        return;
    }

    let effectiveStrategy = selectedStrategy;
    if (selectedStrategy === "Custom Strategy") {
        if (!customStrategy.trim()) {
            setAnalysis("Please describe your custom strategy in the text box.");
            return;
        }
        effectiveStrategy = customStrategy;
    }

    setLoading(true);
    const result = await generateLineupAnalysis(roster, league, effectiveStrategy, batterCount);
    setAnalysis(result);
    setLoading(false);
  };

  const resetManual = () => {
      const count = Number(batterCount);
      if(confirm("Are you sure you want to clear the entire lineup?")) {
          // Explicitly create a new array of nulls to reset the state
          const emptyLineup = Array.from({ length: count }, () => null);
          setManualLineup(emptyLineup);
      }
  };

  const fmtStat = (num: number) => num.toFixed(3).replace(/^0\./, '.');

  // Computed Stats for Manual Lineup
  const lineupStats = useMemo(() => {
      const activePlayers = manualLineup.map(id => roster.find(p => p.id === id)).filter((p): p is Player => !!p);
      if (activePlayers.length === 0) return null;

      const totalAvg = activePlayers.reduce((acc, p) => acc + p.battingAvg, 0) / activePlayers.length;
      const totalOps = activePlayers.reduce((acc, p) => acc + p.ops, 0) / activePlayers.length;
      const totalSpeed = activePlayers.reduce((acc, p) => acc + p.speedRating, 0) / activePlayers.length;
      const totalDefense = activePlayers.reduce((acc, p) => acc + p.defenseRating, 0) / activePlayers.length;
      const totalSlg = activePlayers.reduce((acc, p) => acc + p.sluggingPct, 0) / activePlayers.length;

      return {
          avg: totalAvg,
          ops: totalOps,
          speed: totalSpeed,
          defense: totalDefense,
          slg: totalSlg,
          count: activePlayers.length
      };
  }, [manualLineup, roster]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
      {/* Configuration Panel */}
      <div className="lg:col-span-1 space-y-4 flex flex-col h-full overflow-hidden">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col h-full overflow-hidden">
          <div className="flex items-center justify-between mb-4 flex-shrink-0">
             <h2 className="text-xl font-bold text-slate-800 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-indigo-600" />
                Lineup Builder
             </h2>
          </div>
          
          {/* Mode Toggle */}
          <div className="flex bg-slate-100 p-1 rounded-lg mb-6 flex-shrink-0">
             <button 
                onClick={() => setMode('manual')}
                className={`flex-1 py-2 rounded-md text-sm font-bold flex items-center justify-center transition-all ${mode === 'manual' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
             >
                 <Grid3X3 className="w-4 h-4 mr-2" /> Interactive
             </button>
             <button 
                onClick={() => setMode('ai')}
                className={`flex-1 py-2 rounded-md text-sm font-bold flex items-center justify-center transition-all ${mode === 'ai' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
             >
                 <Sparkles className="w-4 h-4 mr-2" /> AI Auto-Gen
             </button>
          </div>

          <div className="mb-4 flex-shrink-0">
            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center">
                Lineup Size (Batters)
                <InfoTooltip text="Set the number of batters in the lineup order (9-18)." />
            </label>
            <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select 
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={batterCount}
                  onChange={(e) => setBatterCount(Number(e.target.value))}
                >
                  {Array.from({ length: 10 }, (_, i) => i + 9).map(num => (
                    <option key={num} value={num}>{num} Batters</option>
                  ))}
                </select>
            </div>
          </div>

          {/* AI CONTROLS */}
          {mode === 'ai' && (
             <div className="animate-in fade-in space-y-4">
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Game Strategy</label>
                    <select 
                      className="w-full p-2 border border-slate-300 rounded-lg bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={selectedStrategy}
                      onChange={(e) => setSelectedStrategy(e.target.value)}
                    >
                      {STRATEGIES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  {selectedStrategy === "Custom Strategy" && (
                    <div className="animate-in fade-in">
                        <label className="block text-sm font-semibold text-slate-700 mb-1 flex items-center">
                            <Edit3 className="w-3 h-3 mr-1.5" /> Describe Strategy
                        </label>
                        <textarea
                            className="w-full p-3 border border-slate-300 rounded-lg bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none text-sm h-32 resize-none"
                            placeholder="e.g. Put speed at 1 and 9..."
                            value={customStrategy}
                            onChange={(e) => setCustomStrategy(e.target.value)}
                        />
                    </div>
                  )}
                  
                  <button
                    onClick={handleGenerate}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-semibold py-3 rounded-lg shadow-md hover:from-indigo-700 hover:to-indigo-800 transition-all flex justify-center items-center disabled:opacity-70 mt-4"
                  >
                    {loading ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Optimizing...</> : <><Sparkles className="w-5 h-5 mr-2" /> Generate Lineup</>}
                  </button>
             </div>
          )}

          {/* MANUAL CONTROLS */}
          {mode === 'manual' && (
              <div className="flex-grow flex flex-col overflow-hidden animate-in fade-in">
                  <div className="flex justify-between items-center mb-2">
                      <h3 className="text-xs font-bold text-slate-500 uppercase">Set Batting Order</h3>
                      <button 
                        type="button" 
                        onClick={resetManual} 
                        className="text-xs text-red-500 hover:underline flex items-center"
                      >
                        <RefreshCw className="w-3 h-3 mr-1"/> Clear
                      </button>
                  </div>
                  
                  <div className="flex-grow overflow-y-auto space-y-2 pr-2">
                      {Array.from({ length: batterCount }).map((_, i) => (
                          <div key={i} className="flex items-center gap-2">
                              <div className="w-6 h-8 flex items-center justify-center font-mono font-bold text-slate-400 text-sm bg-slate-100 rounded">
                                  {i + 1}
                              </div>
                              <select 
                                  value={manualLineup[i] || ""}
                                  onChange={(e) => handleManualSelect(i, e.target.value)}
                                  className={`flex-grow p-2 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none ${!manualLineup[i] ? 'text-slate-400' : 'text-slate-900 font-medium bg-white border-slate-300'} ${conflicts.some(c => c.includes(`Slot ${i+1}`)) ? 'border-amber-500 bg-amber-50' : ''}`}
                              >
                                  <option value="">-- Select Batter --</option>
                                  {roster.map(p => (
                                      <option key={p.id} value={p.id}>
                                          {p.number} - {p.name} ({p.primaryPosition})
                                      </option>
                                  ))}
                              </select>
                              {manualLineup[i] && (
                                  <div className="w-6 flex justify-center">
                                      <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1 rounded">
                                          {roster.find(p => p.id === manualLineup[i])?.batHand}
                                      </span>
                                  </div>
                              )}
                          </div>
                      ))}
                  </div>
              </div>
          )}
        </div>
      </div>

      {/* Results Panel */}
      <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col h-full min-h-[500px]">
        <h2 className="text-xl font-bold text-slate-800 mb-4 border-b border-slate-100 pb-4 flex items-center justify-between">
          <div className="flex items-center">
            <SeamStrikeLogo className="w-6 h-6 mr-2" sport={league.sport} />
            {mode === 'ai' ? 'SeamStrike Analysis' : 'Lineup Card Preview'}
          </div>
          {mode === 'manual' && lineupStats && (
              <div className="flex gap-4">
                  <div className="text-right">
                      <span className="block text-[10px] font-bold text-slate-400 uppercase">AVG</span>
                      <span className="text-sm font-mono font-bold text-slate-700">{fmtStat(lineupStats.avg)}</span>
                  </div>
                  <div className="text-right">
                      <span className="block text-[10px] font-bold text-slate-400 uppercase">OPS</span>
                      <span className="text-sm font-mono font-bold text-indigo-600">{fmtStat(lineupStats.ops)}</span>
                  </div>
              </div>
          )}
        </h2>
        
        {/* MANUAL VISUALIZATION */}
        {mode === 'manual' && (
            <div className="flex-grow flex flex-col">
                {conflicts.length > 0 ? (
                    <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg p-3 animate-fade-in">
                        <h4 className="text-sm font-bold text-amber-800 flex items-center mb-1">
                            <AlertTriangle className="w-4 h-4 mr-2" /> Conflicts Detected
                        </h4>
                        <ul className="list-disc list-inside space-y-0.5">
                            {conflicts.map((c, i) => <li key={i} className="text-xs text-amber-700">{c}</li>)}
                        </ul>
                    </div>
                ) : (
                    manualLineup.filter(Boolean).length === batterCount && (
                        <div className="mb-4 bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-center animate-fade-in">
                             <Check className="w-4 h-4 text-emerald-600 mr-2" />
                             <span className="text-xs font-bold text-emerald-800">Lineup is complete and valid.</span>
                        </div>
                    )
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto">
                    {/* Visual Card */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 shadow-sm">
                        <div className="flex justify-between items-center mb-4 border-b border-slate-200 pb-2">
                             <span className="font-mono font-bold text-slate-500 text-xs uppercase tracking-widest">Batting Order</span>
                             <span className="text-xs font-bold text-slate-400">{league.name}</span>
                        </div>
                        <div className="space-y-0.5">
                            {manualLineup.map((id, i) => {
                                const player = roster.find(p => p.id === id);
                                return (
                                    <div key={i} className="flex items-center text-sm p-2 hover:bg-white rounded transition-colors group">
                                        <div className="w-6 font-mono text-slate-400 font-bold text-xs">{i+1}</div>
                                        {player ? (
                                            <>
                                                <div className="w-8 font-mono text-slate-500 text-xs">#{player.number}</div>
                                                <div className="flex-grow font-bold text-slate-700">{player.name}</div>
                                                <div className="w-12 text-right text-xs text-slate-400 font-medium">{player.primaryPosition}</div>
                                                <div className={`w-8 text-right text-xs font-bold ${player.batHand === 'L' ? 'text-red-500' : player.batHand === 'S' ? 'text-purple-500' : 'text-blue-500'}`}>{player.batHand}</div>
                                            </>
                                        ) : (
                                            <div className="text-slate-300 italic">-- Empty Slot --</div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                    
                    {/* Visual Stats */}
                    <div className="flex flex-col gap-4">
                         <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex-grow">
                             <div className="flex items-center gap-2 mb-4">
                                 <BarChart2 className="w-4 h-4 text-indigo-500" />
                                 <h4 className="font-bold text-slate-700 text-sm">Lineup Composition</h4>
                             </div>
                             
                             {lineupStats ? (
                                 <div className="space-y-4">
                                     <div>
                                         <div className="flex justify-between text-xs text-slate-500 mb-1">
                                             <span className="flex items-center"><Zap className="w-3 h-3 mr-1 text-amber-500" /> Speed</span>
                                             <span>{lineupStats.speed.toFixed(1)}/10</span>
                                         </div>
                                         <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                             <div className="h-full bg-amber-400 rounded-full" style={{ width: `${lineupStats.speed * 10}%` }}></div>
                                         </div>
                                     </div>

                                     <div>
                                         <div className="flex justify-between text-xs text-slate-500 mb-1">
                                             <span className="flex items-center"><Shield className="w-3 h-3 mr-1 text-blue-500" /> Defense</span>
                                             <span>{lineupStats.defense.toFixed(1)}/10</span>
                                         </div>
                                         <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                             <div className="h-full bg-blue-500 rounded-full" style={{ width: `${lineupStats.defense * 10}%` }}></div>
                                         </div>
                                     </div>

                                     <div>
                                         <div className="flex justify-between text-xs text-slate-500 mb-1">
                                             <span className="flex items-center"><Zap className="w-3 h-3 mr-1 text-red-500" /> Power (SLG)</span>
                                             <span>{fmtStat(lineupStats.slg)}</span>
                                         </div>
                                         <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                             {/* Normalize SLG: .800 as 100% */}
                                             <div className="h-full bg-red-500 rounded-full" style={{ width: `${Math.min(100, (lineupStats.slg / 0.8) * 100)}%` }}></div>
                                         </div>
                                     </div>
                                     
                                     <div className="grid grid-cols-2 gap-4 pt-2">
                                         <div className="bg-slate-50 p-3 rounded-lg text-center">
                                             <div className="text-2xl font-bold text-slate-800">{manualLineup.filter(id => roster.find(p => p.id === id)?.batHand === 'L').length}</div>
                                             <div className="text-[10px] font-bold text-slate-400 uppercase">Lefties</div>
                                         </div>
                                         <div className="bg-slate-50 p-3 rounded-lg text-center">
                                             <div className="text-2xl font-bold text-slate-800">{manualLineup.filter(id => roster.find(p => p.id === id)?.batHand === 'R').length}</div>
                                             <div className="text-[10px] font-bold text-slate-400 uppercase">Righties</div>
                                         </div>
                                     </div>
                                 </div>
                             ) : (
                                 <p className="text-xs text-slate-400 text-center mt-10">Add players to see breakdown.</p>
                             )}
                         </div>
                    </div>
                </div>
            </div>
        )}

        {/* AI VISUALIZATION */}
        {mode === 'ai' && (
            analysis ? (
            <div className="prose prose-slate max-w-none flex-grow overflow-y-auto animate-in fade-in">
                <div dangerouslySetInnerHTML={{ __html: analysis.replace(/\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, '<strong class="text-indigo-700">$1</strong>') }} />
            </div>
            ) : (
            <div className="flex flex-col items-center justify-center flex-grow text-slate-400">
                <Sparkles className="w-16 h-16 mb-4 text-slate-200" />
                <p className="text-lg">Ready to optimize.</p>
                <p className="text-sm">Select a strategy and click Generate.</p>
            </div>
            )
        )}
      </div>
    </div>
  );
};

export default LineupBuilder;

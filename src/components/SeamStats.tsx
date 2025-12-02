
import React, { useState } from 'react';
import { Player, SubscriptionTier, SprayChartPoint, Position } from '../types';
import { X, Lock, TrendingUp, Target, Activity, Zap, Shield } from 'lucide-react';

interface SeamStatsProps {
  player: Player;
  subscriptionTier: SubscriptionTier;
  onClose: () => void;
  onUpgrade: () => void;
}

type Tab = 'spray' | 'arsenal' | 'trends';

const SeamStats: React.FC<SeamStatsProps> = ({ player, subscriptionTier, onClose, onUpgrade }) => {
  const [activeTab, setActiveTab] = useState<Tab>('spray');
  
  const hasAccess = subscriptionTier !== 'Free';

  // --- Visualization Logic ---
  const renderSprayChart = () => {
    // Basic SVG field
    // Viewbox 0 0 400 400. Home plate at 200, 350.
    const chartPoints = player.seamStats?.sprayChart || [];

    return (
      <div className="relative w-full aspect-square max-w-md mx-auto bg-slate-900 rounded-xl overflow-hidden border border-slate-700 shadow-2xl">
         <div className="absolute top-4 left-4 text-xs font-mono text-slate-400">SPRAY CHART</div>
         <svg viewBox="0 0 400 400" className="w-full h-full">
            {/* Grass */}
            <path d="M 0 0 L 400 0 L 400 400 L 0 400 Z" fill="#1e293b" />
            
            {/* Foul Lines */}
            <path d="M 200 350 L -50 100" stroke="white" strokeWidth="2" opacity="0.5" />
            <path d="M 200 350 L 450 100" stroke="white" strokeWidth="2" opacity="0.5" />
            
            {/* Infield Dirt (Approximate) */}
            <path d="M 200 350 L 150 300 L 200 250 L 250 300 Z" fill="#334155" stroke="none" />
            
            {/* Fence Arc */}
            <path d="M 20 120 Q 200 20 380 120" fill="none" stroke="#64748b" strokeWidth="4" />

            {/* Hit Points */}
            {chartPoints.map((pt, i) => {
               // Convert Angle/Distance to X/Y
               // 90deg is straight up. 
               // Angle 0 is center. -45 Left, +45 Right.
               // Home is 200, 350.
               // Factor to scale distance to SVG pixels. Say 400ft = 250px radius.
               const angleRad = (pt.directionAngle - 90) * (Math.PI / 180);
               const scale = 0.6; // 1ft = 0.6px
               const r = pt.distance * scale;
               
               // In SVG, Angle 0 is 3 o'clock. We want 0 to be 12 o'clock.
               // Standard polar: x = r * cos(theta), y = r * sin(theta)
               // Adjusted for baseball field where 0deg is straight up (12 o'clock)
               // New Angle for math: -90 (up).
               // Let's stick to the input: -45(Left) to 45(Right).
               // Math angle = (pt.angle - 90).
               
               const x = 200 + (r * Math.sin(pt.directionAngle * (Math.PI / 180)));
               const y = 350 - (r * Math.cos(pt.directionAngle * (Math.PI / 180)));

               let color = '#fff';
               if (pt.type === 'HR') color = '#fbbf24'; // Amber
               if (pt.type === 'Double') color = '#3b82f6'; // Blue
               if (pt.type === 'Out') color = '#ef4444'; // Red

               return (
                   <g key={i} className="animate-in zoom-in duration-500" style={{ animationDelay: `${i*100}ms` }}>
                       <circle cx={x} cy={y} r={pt.type === 'HR' ? 6 : 4} fill={color} stroke="black" strokeWidth="1" />
                       <title>{pt.type} - {pt.distance}ft - {pt.exitVelocity}mph</title>
                   </g>
               )
            })}
         </svg>
         
         <div className="absolute bottom-4 right-4 flex flex-col gap-1">
             <div className="flex items-center text-[10px] text-white"><span className="w-2 h-2 rounded-full bg-amber-400 mr-2"></span> HR</div>
             <div className="flex items-center text-[10px] text-white"><span className="w-2 h-2 rounded-full bg-blue-500 mr-2"></span> Hit</div>
             <div className="flex items-center text-[10px] text-white"><span className="w-2 h-2 rounded-full bg-red-500 mr-2"></span> Out</div>
         </div>
      </div>
    );
  };

  const renderArsenal = () => {
      const pitches = player.seamStats?.pitchArsenal || [];
      if (pitches.length === 0) return <div className="text-center text-slate-500 py-10">No pitch data available.</div>;

      return (
          <div className="space-y-6">
              {pitches.map((p, i) => (
                  <div key={i} className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <div className="flex justify-between items-end mb-2">
                          <div>
                              <span className="text-lg font-bold text-slate-800">{p.name}</span>
                              <span className="text-sm text-slate-500 ml-2 font-mono">{p.velocity} MPH</span>
                          </div>
                          <span className="text-sm font-bold text-slate-600">{p.usagePct}% Usage</span>
                      </div>
                      
                      {/* Usage Bar */}
                      <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all duration-1000 ease-out"
                            style={{ width: `${p.usagePct}%`, backgroundColor: p.color }}
                          ></div>
                      </div>

                      {/* Velocity Visualization (Simple Range) */}
                      <div className="mt-3 flex items-center space-x-2 text-xs text-slate-400">
                          <span>Slow</span>
                          <div className="flex-grow h-1 bg-slate-100 rounded relative">
                              <div 
                                className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-slate-800"
                                style={{ left: `${((p.velocity - 60) / 45) * 100}%` }} // Scale 60-105mph
                              ></div>
                          </div>
                          <span>Fast</span>
                      </div>
                  </div>
              ))}
          </div>
      );
  };

  const renderTrends = () => {
      const trends = player.primaryPosition === Position.P ? player.seamStats?.eraTrends : player.seamStats?.battingTrends;
      const label = player.primaryPosition === Position.P ? 'ERA' : 'AVG';
      const recentPitchLog = player.seamStats?.recentPitchLog;
      
      return (
          <div className="space-y-6">
            {/* Main Trend Line (Season) */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-sm font-bold text-slate-500 uppercase mb-4">{label} Trend (Season)</h3>
                {trends && trends.length > 0 ? (
                    <svg viewBox="0 0 300 150" className="w-full h-48 overflow-visible">
                        {(() => {
                             const maxVal = Math.max(...trends.map(t => t.value)) * 1.1;
                             const minVal = Math.min(...trends.map(t => t.value)) * 0.9;
                             const points = trends.map((t, i) => {
                                 const x = (i / (trends.length - 1)) * 300;
                                 const y = 150 - ((t.value - minVal) / (maxVal - minVal)) * 150;
                                 return `${x},${y}`;
                             }).join(' ');
                             
                             return (
                                <>
                                    <polyline 
                                        fill="none" 
                                        stroke="#4f46e5" 
                                        strokeWidth="3" 
                                        points={points} 
                                        className="drop-shadow-md"
                                    />
                                    {trends.map((t, i) => {
                                        const x = (i / (trends.length - 1)) * 300;
                                        const y = 150 - ((t.value - minVal) / (maxVal - minVal)) * 150;
                                        return (
                                            <g key={i}>
                                                <circle cx={x} cy={y} r="4" fill="white" stroke="#4f46e5" strokeWidth="2" />
                                                <text x={x} y={y - 10} textAnchor="middle" fontSize="10" fill="#64748b">{t.value.toFixed(3)}</text>
                                                <text x={x} y={170} textAnchor="middle" fontSize="10" fill="#94a3b8">{t.date}</text>
                                            </g>
                                        );
                                    })}
                                </>
                             )
                        })()}
                    </svg>
                ) : (
                    <div className="text-center text-slate-400 text-sm py-8">No season trend data available.</div>
                )}
            </div>

            {/* 7-Day Pitch Chart (For Pitchers) */}
            {(player.primaryPosition === Position.P || player.secondaryPositions?.includes(Position.P)) && recentPitchLog && recentPitchLog.length > 0 && (
                 <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-end mb-6">
                        <h3 className="text-sm font-bold text-slate-500 uppercase">7-Day Pitch Velocity & Usage</h3>
                        <div className="flex items-center gap-3 text-xs">
                            <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-red-500 mr-1"></span> Velocity (MPH)</div>
                            <div className="flex items-center"><span className="w-2 h-2 rounded bg-indigo-200 mr-1"></span> Usage %</div>
                        </div>
                    </div>
                    
                    <svg viewBox="0 0 300 150" className="w-full h-48 overflow-visible">
                         {/* Axis Lines */}
                         <line x1="0" y1="150" x2="300" y2="150" stroke="#e2e8f0" strokeWidth="1" />
                         <line x1="0" y1="0" x2="0" y2="150" stroke="#e2e8f0" strokeWidth="1" />
                         
                         {(() => {
                             const velocities = recentPitchLog.map(l => l.velocity);
                             const maxVel = Math.max(...velocities) + 2;
                             const minVel = Math.min(...velocities) - 2;
                             
                             // Draw Usage Bars (Y2 Axis 0-100%)
                             const bars = recentPitchLog.map((l, i) => {
                                 const x = (i / (recentPitchLog.length - 1)) * 280 + 10;
                                 const height = (l.usage / 100) * 150; // Scale 0-100%
                                 const y = 150 - height;
                                 return (
                                     <g key={`bar-${i}`}>
                                         <rect x={x - 8} y={y} width="16" height={height} fill="#c7d2fe" rx="2" opacity="0.8" />
                                         <text x={x} y={y - 5} textAnchor="middle" fontSize="9" fill="#6366f1">{l.usage}%</text>
                                     </g>
                                 );
                             });

                             // Draw Velocity Line (Y1 Axis)
                             const points = recentPitchLog.map((l, i) => {
                                 const x = (i / (recentPitchLog.length - 1)) * 280 + 10;
                                 const y = 150 - ((l.velocity - minVel) / (maxVel - minVel)) * 150;
                                 return `${x},${y}`;
                             }).join(' ');

                             return (
                                 <>
                                     {bars}
                                     <polyline 
                                        fill="none" 
                                        stroke="#ef4444" 
                                        strokeWidth="2" 
                                        points={points} 
                                        className="drop-shadow-sm"
                                     />
                                     {recentPitchLog.map((l, i) => {
                                         const x = (i / (recentPitchLog.length - 1)) * 280 + 10;
                                         const y = 150 - ((l.velocity - minVel) / (maxVel - minVel)) * 150;
                                         return (
                                             <g key={`pt-${i}`}>
                                                 <circle cx={x} cy={y} r="3" fill="#ef4444" stroke="white" strokeWidth="1" />
                                                 <text x={x} y={y - 8} textAnchor="middle" fontSize="10" fontWeight="bold" fill="#ef4444">{l.velocity}</text>
                                                 <text x={x} y={165} textAnchor="middle" fontSize="10" fill="#64748b">{l.date}</text>
                                             </g>
                                         );
                                     })}
                                 </>
                             );
                         })()}
                    </svg>
                 </div>
            )}
          </div>
      )
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 flex justify-between items-start">
            <div className="flex items-center space-x-4">
                 <div className="w-16 h-16 rounded-full bg-slate-700 border-2 border-slate-500 overflow-hidden">
                     {player.imageUrl ? <img src={player.imageUrl} className="w-full h-full object-cover"/> : <span className="w-full h-full flex items-center justify-center text-xl font-bold">{player.name.charAt(0)}</span>}
                 </div>
                 <div>
                     <h2 className="text-2xl font-bold flex items-center">
                        {player.name}
                        <span className="ml-2 text-xs bg-amber-500 text-slate-900 px-2 py-0.5 rounded font-bold uppercase">SeamStats™</span>
                     </h2>
                     <p className="text-slate-400 text-sm">#{player.number} • {player.primaryPosition} • {player.batHand}/{player.throwHand}</p>
                 </div>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-6 h-6" />
            </button>
        </div>

        {/* Content Area with Lock Gate */}
        <div className="flex-grow flex flex-col relative overflow-hidden bg-slate-50">
            
            {!hasAccess && (
                <div className="absolute inset-0 z-20 bg-slate-900/80 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center">
                    <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg transform rotate-6">
                        <Lock className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Unlock SeamStats™ Analytics</h3>
                    <p className="text-slate-300 max-w-md mb-8">
                        Get advanced visual metrics including Spray Charts, Pitch Arsenals, Heatmaps, and Performance Trends.
                    </p>
                    <button 
                        onClick={onUpgrade}
                        className="bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold py-3 px-8 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all"
                    >
                        Upgrade to Pro
                    </button>
                </div>
            )}

            {/* Tabs */}
            <div className="flex border-b border-slate-200 bg-white px-6">
                <button 
                    onClick={() => setActiveTab('spray')} 
                    className={`py-4 px-4 text-sm font-bold border-b-2 transition-colors flex items-center ${activeTab === 'spray' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    <Target className="w-4 h-4 mr-2" />
                    Spray Chart
                </button>
                <button 
                    onClick={() => setActiveTab('arsenal')} 
                    className={`py-4 px-4 text-sm font-bold border-b-2 transition-colors flex items-center ${activeTab === 'arsenal' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    <Zap className="w-4 h-4 mr-2" />
                    Pitch Arsenal
                </button>
                <button 
                    onClick={() => setActiveTab('trends')} 
                    className={`py-4 px-4 text-sm font-bold border-b-2 transition-colors flex items-center ${activeTab === 'trends' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Trends
                </button>
            </div>

            {/* Scrollable View */}
            <div className="flex-grow overflow-y-auto p-6">
                {activeTab === 'spray' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                             <h3 className="text-lg font-bold text-slate-800">Hitting Spray Chart</h3>
                             <span className="text-xs text-slate-500">Last 50 Batted Balls</span>
                        </div>
                        {renderSprayChart()}
                    </div>
                )}

                {activeTab === 'arsenal' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                             <h3 className="text-lg font-bold text-slate-800">Pitch Arsenal</h3>
                             <span className="text-xs text-slate-500">Velocity & Usage</span>
                        </div>
                        {renderArsenal()}
                    </div>
                )}

                 {activeTab === 'trends' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                             <h3 className="text-lg font-bold text-slate-800">Performance Trends</h3>
                             <span className="text-xs text-slate-500">Season Progression</span>
                        </div>
                        {renderTrends()}
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default SeamStats;

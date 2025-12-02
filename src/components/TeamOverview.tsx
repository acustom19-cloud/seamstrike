import React, { useState } from 'react';
import { LeagueSettings, TeamProfile, Standing, ScheduleEvent, Player, Screen } from '../types';
import { ChevronDown, Trophy, Calendar, Users, Briefcase, PlusCircle, Check } from 'lucide-react';
import SeamStrikeLogo from './SeamStrikeLogo';

interface TeamOverviewProps {
  currentSettings: LeagueSettings;
  teams: TeamProfile[];
  standings: Standing[];
  schedule: ScheduleEvent[];
  roster: Player[];
  onSwitchTeam: (team: TeamProfile) => void;
  onNavigate: (screen: Screen) => void;
}

const TeamOverview: React.FC<TeamOverviewProps> = ({ 
  currentSettings, 
  teams, 
  standings, 
  schedule, 
  roster,
  onSwitchTeam,
  onNavigate
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const currentStats = standings.find(s => s.teamName === currentSettings.name);
  const nextEvent = schedule.find(e => new Date(e.date + ' ' + e.time) > new Date());
  
  const handleSelect = (team: TeamProfile) => {
    onSwitchTeam(team);
    setIsOpen(false);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        
        {/* Team Identity Selector */}
        <div className="relative z-20">
             <div 
                className="flex items-center space-x-4 cursor-pointer group"
                onClick={() => setIsOpen(!isOpen)}
             >
                 <div className="w-16 h-16 rounded-full border-2 border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center justify-center overflow-hidden group-hover:border-indigo-500 transition-colors">
                     {currentSettings.teamLogoUrl ? (
                         <img src={currentSettings.teamLogoUrl} alt="Team Logo" className="w-full h-full object-cover" />
                     ) : (
                         <SeamStrikeLogo className="w-10 h-10" sport={currentSettings.sport} />
                     )}
                 </div>
                 <div>
                     <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Current Team</p>
                     <div className="flex items-center">
                         <h2 className="text-2xl font-bold text-slate-900 dark:text-white mr-2 group-hover:text-indigo-600 transition-colors">
                             {currentSettings.name}
                         </h2>
                         <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                     </div>
                     <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                         {currentSettings.level} • {currentSettings.sport}
                     </p>
                 </div>
             </div>

             {/* Dropdown Menu */}
             {isOpen && (
                 <div className="absolute top-full left-0 mt-2 w-72 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top-left">
                     <div className="p-3 border-b border-slate-100 dark:border-slate-700 text-xs font-bold text-slate-400 uppercase">
                         My Teams
                     </div>
                     <div className="max-h-60 overflow-y-auto">
                         {teams.map(team => (
                             <button
                                key={team.id}
                                onClick={() => handleSelect(team)}
                                className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center justify-between transition-colors"
                             >
                                <div>
                                    <p className={`font-bold text-sm ${team.name === currentSettings.name ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-200'}`}>
                                        {team.name}
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        {team.level}
                                    </p>
                                </div>
                                {team.name === currentSettings.name && <Check className="w-4 h-4 text-indigo-600" />}
                             </button>
                         ))}
                     </div>
                     <button 
                        className="w-full text-left px-4 py-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 text-indigo-600 text-sm font-bold flex items-center hover:bg-slate-100 dark:hover:bg-black/20 transition-colors"
                        onClick={() => alert("Create new team flow would start here.")}
                     >
                         <PlusCircle className="w-4 h-4 mr-2" />
                         Add New Team
                     </button>
                 </div>
             )}
        </div>

        {/* Quick Win Pct Indicator (Right side on Desktop) */}
        <div className="hidden md:block text-right">
             <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Season Record</p>
             <div className="flex items-center justify-end space-x-3">
                 <span className="text-3xl font-bold text-slate-900 dark:text-white">
                     {currentStats ? `${currentStats.wins}-${currentStats.losses}` : '0-0'}
                 </span>
                 <div className={`px-2 py-1 rounded text-xs font-bold ${
                     (currentStats?.winPct || 0) >= 0.5 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                 }`}>
                     {currentStats ? currentStats.winPct.toFixed(3).replace('0.', '.') : '.000'}
                 </div>
             </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-slate-100 dark:border-slate-800">
           
           {/* Rank - Clickable */}
           <div 
             onClick={() => onNavigate('standings')}
             className="flex items-center p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
           >
               <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center text-amber-600 dark:text-amber-400 mr-3 group-hover:scale-110 transition-transform">
                   <Trophy className="w-5 h-5" />
               </div>
               <div>
                   <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">League Rank</p>
                   <p className="text-lg font-bold text-slate-800 dark:text-white">
                       {currentStats ? `#${currentStats.rank}` : '-'} 
                       <span className="text-xs font-normal text-slate-400 ml-1">of {standings.length}</span>
                   </p>
               </div>
           </div>

           {/* Next Event - Clickable */}
           <div 
             onClick={() => onNavigate('schedule')}
             className="flex items-center p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
           >
               <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mr-3 group-hover:scale-110 transition-transform">
                   <Calendar className="w-5 h-5" />
               </div>
               <div className="overflow-hidden">
                   <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Next Event</p>
                   <p className="text-sm font-bold text-slate-800 dark:text-white truncate">
                       {nextEvent ? (nextEvent.type === 'Game' ? `vs ${nextEvent.opponent}` : nextEvent.title) : 'No Events'}
                   </p>
                   <p className="text-xs text-slate-500 truncate">
                       {nextEvent ? new Date(nextEvent.date).toLocaleDateString(undefined, {weekday: 'short', month: 'short', day: 'numeric'}) + ` @ ${nextEvent.time}` : 'Check Schedule'}
                   </p>
               </div>
           </div>

           {/* Roster Status - Clickable */}
           <div 
             onClick={() => onNavigate('roster')}
             className="flex items-center p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
           >
               <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mr-3 group-hover:scale-110 transition-transform">
                   <Users className="w-5 h-5" />
               </div>
               <div>
                   <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Active Roster</p>
                   <p className="text-lg font-bold text-slate-800 dark:text-white">
                       {roster.length} <span className="text-xs font-normal text-slate-400">Players</span>
                   </p>
               </div>
           </div>

      </div>
    </div>
  );
};

export default TeamOverview;
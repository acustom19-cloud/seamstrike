
import React, { useState, useEffect, useRef } from 'react';
import { LeagueSettings, Player, Screen, Standing, SubscriptionTier, ScheduleEvent, TeamProfile } from './types';
import { INITIAL_LEAGUE_SETTINGS, MOCK_ROSTER, LEAGUE_LEVELS, MOCK_STANDINGS, MOCK_SCHEDULE, MOCK_TEAMS } from './constants';
import GameMode from './components/GameMode.tsx';
import RosterManager from './components/RosterManager.tsx';
import LineupBuilder from './components/LineupBuilder.tsx';
import DefenseBuilder from './components/DefenseBuilder.tsx';
import PracticePlanner from './components/PracticePlanner.tsx';
import HelpFAQ from './components/HelpFAQ.tsx';
import CoachesChat from './components/CoachesChat.tsx';
import ScheduleManager from './components/ScheduleManager.tsx';
import SubscriptionManager from './components/SubscriptionManager.tsx';
import InfoTooltip from './components/InfoTooltip.tsx';
import SeamStrikeLogo from './components/SeamStrikeLogo.tsx';
import TeamOverview from './components/TeamOverview.tsx';
import VideoAnalyzer from './components/VideoAnalyzer.tsx';
import LoginScreen from './components/LoginScreen.tsx';
import AccountManager from './components/AccountManager.tsx';
import { 
  LayoutDashboard, 
  Users, 
  ListOrdered, 
  Gamepad2, 
  Settings, 
  ClipboardList, 
  Menu, 
  X,
  Trophy,
  Upload,
  Image as ImageIcon,
  CalendarDays,
  Star,
  Shield,
  HelpCircle,
  MessageSquare,
  Calendar,
  Crown,
  Moon,
  Sun,
  Video,
  UserCircle
} from 'lucide-react';

// Simple Scouting Component
const ScoutingReport = ({ league }: { league: LeagueSettings }) => {
  const [notes, setNotes] = useState("");
  const [report, setReport] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Dynamic import or keeping logic inside here for simplicity since it's just one service call
  const handleScout = async () => {
    setLoading(true);
    // Use the service defined earlier
    const { getScoutingReport } = await import('./services/geminiService.ts');
    const res = await getScoutingReport(notes, league);
    setReport(res);
    setLoading(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
        <h2 className="text-xl font-bold mb-4 flex items-center text-slate-900 dark:text-white">
            <ClipboardList className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400"/> 
            Opponent Intel
        </h2>
        <textarea 
            className="w-full h-64 p-3 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm resize-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400"
            placeholder="Paste raw notes here... (e.g. 'Their pitcher throws hard but wild. Catcher has a weak arm. Shortstop cheats towards second base.')"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
        ></textarea>
        <button 
            onClick={handleScout}
            disabled={loading || !notes}
            className="mt-4 w-full bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
        >
            {loading ? "Generating Report..." : "Generate AI Scouting Report"}
        </button>
      </div>
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-y-auto max-h-[600px]">
        <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-white">Tactical Analysis</h2>
        {report ? (
             <div className="prose prose-sm prose-slate dark:prose-invert">
                <div dangerouslySetInnerHTML={{ __html: report.replace(/\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
             </div>
        ) : (
            <p className="text-slate-400 italic">Enter notes to generate a competitive advantage report.</p>
        )}
      </div>
    </div>
  )
}

interface SettingsScreenProps {
    league: LeagueSettings;
    setLeague: (l: LeagueSettings) => void;
    darkMode: boolean;
    setDarkMode: (b: boolean) => void;
}

const SettingsScreen = ({ league, setLeague, darkMode, setDarkMode }: SettingsScreenProps) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setLeague({...league, teamLogoUrl: url});
        }
    };

    return (
        <div className="max-w-2xl bg-white dark:bg-slate-900 p-8 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white">
            <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">League Configuration</h2>
            <div className="space-y-6">
                
                {/* Appearance Toggle */}
                <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                    <div>
                        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase">Appearance</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Toggle light/dark theme</p>
                    </div>
                    <button 
                        onClick={() => setDarkMode(!darkMode)}
                        className={`p-2 rounded-lg transition-colors ${darkMode ? 'bg-slate-700 text-yellow-400 border border-slate-600' : 'bg-white text-slate-400 border border-slate-300'}`}
                    >
                        {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    </button>
                </div>

                {/* Team Identity */}
                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 mb-4">
                    <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase mb-3">Team Identity</h3>
                    <div className="flex items-center space-x-6">
                        <div 
                            className="w-24 h-24 rounded-full bg-white dark:bg-slate-700 border-2 border-slate-300 dark:border-slate-600 flex items-center justify-center overflow-hidden cursor-pointer hover:border-indigo-500 transition-colors relative group"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {league.teamLogoUrl ? (
                                <img src={league.teamLogoUrl} alt="Logo" className="w-full h-full object-cover" />
                            ) : (
                                <ImageIcon className="w-8 h-8 text-slate-400" />
                            )}
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Upload className="w-6 h-6 text-white" />
                            </div>
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Team Name</label>
                            <input 
                                type="text" 
                                value={league.name} 
                                onChange={e => setLeague({...league, name: e.target.value})}
                                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Click the circle to upload team logo.</p>
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload}/>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Sport</label>
                        <select 
                            value={league.sport} 
                            onChange={e => setLeague({...league, sport: e.target.value as 'Baseball' | 'Softball'})}
                            className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                            <option value="Baseball">Baseball</option>
                            <option value="Softball">Softball</option>
                        </select>
                    </div>
                     <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Competition Level</label>
                        <select 
                            value={league.level} 
                            onChange={e => setLeague({...league, level: e.target.value})}
                            className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                            {LEAGUE_LEVELS.map((group) => (
                                <optgroup key={group.group} label={group.group}>
                                    {group.levels.map(lvl => (
                                        <option key={lvl} value={lvl}>{lvl}</option>
                                    ))}
                                </optgroup>
                            ))}
                        </select>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center">
                            Fielders on Defense
                            <InfoTooltip text="Updates Game Mode visualization (e.g. 4 vs 3 outfielders)." />
                        </label>
                        <select 
                            value={league.fielderCount} 
                            onChange={e => setLeague({...league, fielderCount: Number(e.target.value) as 9 | 10})}
                            className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                            <option value={9}>9 Players (Standard)</option>
                            <option value={10}>10 Players (4 Outfielders)</option>
                        </select>
                        <p className="text-xs text-slate-400 mt-1">Updates Game Mode field visualization.</p>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Pitch Count Limit</label>
                         <input 
                            type="number" 
                            value={league.pitchCountLimit} 
                            onChange={e => setLeague({...league, pitchCountLimit: Number(e.target.value)})}
                            className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center">
                        Rule Context (For AI)
                        <InfoTooltip text="Paste specific local rules here. The AI will consider these when generating lineups and strategy advice." />
                    </label>
                    <textarea 
                        value={league.rulesContext} 
                        onChange={e => setLeague({...league, rulesContext: e.target.value})}
                        className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded h-32 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                        placeholder="Describe specific rules: e.g. 'Pitch count limit is 85. No leading off. Dropped 3rd strike is in effect.'"
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">The AI uses this to check compliance for lineups and strategy.</p>
                </div>
            </div>
        </div>
    )
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userProfile, setUserProfile] = useState({ name: 'Coach Smith', email: 'coach@example.com' });
  const [currentScreen, setCurrentScreen] = useState<Screen>('dashboard');
  const [leagueSettings, setLeagueSettings] = useState<LeagueSettings>(INITIAL_LEAGUE_SETTINGS);
  const [roster, setRoster] = useState<Player[]>([...MOCK_ROSTER]);
  const [standings, setStandings] = useState<Standing[]>([...MOCK_STANDINGS]);
  const [schedule, setSchedule] = useState<ScheduleEvent[]>([...MOCK_SCHEDULE]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [subscriptionTier, setSubscriptionTier] = useState<SubscriptionTier>('Free');
  const [darkMode, setDarkMode] = useState(false);
  const [availableTeams, setAvailableTeams] = useState<TeamProfile[]>(MOCK_TEAMS);

  // Apply dark mode class to html element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Responsive sidebar close
  useEffect(() => {
    const handleResize = () => {
        if (window.innerWidth >= 1024) setSidebarOpen(true);
        else setSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    handleResize(); // init
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentScreen('dashboard');
  };

  if (!isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'gamemode', label: 'Game Mode', icon: Gamepad2 },
    { id: 'roster', label: 'Roster', icon: Users },
    { id: 'lineup', label: 'Lineup Builder', icon: ListOrdered },
    { id: 'defense', label: 'Defense Builder', icon: Shield },
    { id: 'practice', label: 'Practice Planner', icon: CalendarDays },
    { id: 'video', label: 'Video Analysis', icon: Video },
    { id: 'schedule', label: 'Season Manager', icon: Calendar },
    { id: 'scouting', label: 'Scouting', icon: ClipboardList },
    { id: 'chat', label: 'Seam Meeting', icon: MessageSquare },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'faq', label: 'Help / FAQ', icon: HelpCircle },
    { id: 'account', label: 'Account', icon: UserCircle },
  ];

  const handleSubscriptionUpgrade = (tier: SubscriptionTier) => {
      // Payment handled in SubscriptionManager modal now
      setSubscriptionTier(tier);
      alert("Welcome to the team! Your Pro features are now unlocked.");
  };

  const handleSwitchTeam = (team: TeamProfile) => {
    // In a real app, this would fetch the specific team's data
    setLeagueSettings(prev => ({
        ...prev,
        name: team.name,
        sport: team.sport,
        level: team.level,
        teamLogoUrl: team.logoUrl || prev.teamLogoUrl
    }));
    // Note: For demo purposes we aren't swapping roster/schedule data arrays completely
  };

  const renderContent = () => {
    switch (currentScreen) {
      case 'gamemode': return <GameMode league={leagueSettings} roster={roster} subscriptionTier={subscriptionTier} onUpgrade={handleSubscriptionUpgrade} />;
      case 'roster': return <RosterManager roster={roster} setRoster={setRoster} subscriptionTier={subscriptionTier} onUpgrade={handleSubscriptionUpgrade} />;
      case 'lineup': return <LineupBuilder roster={roster} league={leagueSettings} />;
      case 'defense': return <DefenseBuilder roster={roster} league={leagueSettings} />;
      case 'schedule': return <ScheduleManager schedule={schedule} setSchedule={setSchedule} standings={standings} setStandings={setStandings} roster={roster} league={leagueSettings} subscriptionTier={subscriptionTier} onUpgrade={handleSubscriptionUpgrade} />;
      case 'scouting': return <ScoutingReport league={leagueSettings} />;
      case 'practice': return <PracticePlanner league={leagueSettings} subscriptionTier={subscriptionTier} onUpgrade={handleSubscriptionUpgrade} roster={roster} />;
      case 'video': return <VideoAnalyzer league={leagueSettings} subscriptionTier={subscriptionTier} onUpgrade={handleSubscriptionUpgrade} />;
      case 'chat': return <CoachesChat />;
      case 'settings': return <SettingsScreen league={leagueSettings} setLeague={setLeagueSettings} darkMode={darkMode} setDarkMode={setDarkMode} />;
      case 'faq': return <HelpFAQ />;
      case 'subscription': return <SubscriptionManager currentTier={subscriptionTier} onUpgrade={handleSubscriptionUpgrade} sport={leagueSettings.sport} />;
      case 'account': return <AccountManager user={userProfile} subscriptionTier={subscriptionTier} onUpgrade={handleSubscriptionUpgrade} onLogout={handleLogout} onNavigate={setCurrentScreen} />;
      case 'standings':
            // Redirect to schedule tab (now combined)
            return <ScheduleManager schedule={schedule} setSchedule={setSchedule} standings={standings} setStandings={setStandings} roster={roster} league={leagueSettings} subscriptionTier={subscriptionTier} onUpgrade={handleSubscriptionUpgrade} />;
      case 'dashboard':
      default:
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between">
                <div className="relative z-10 max-w-2xl">
                    <div className="flex items-center space-x-4 mb-4">
                        {leagueSettings.teamLogoUrl && (
                             <img src={leagueSettings.teamLogoUrl} alt="Team Logo" className="w-16 h-16 rounded-full border-2 border-white/50 object-cover" />
                        )}
                        <div>
                            <h1 className="text-4xl font-bold">{leagueSettings.name}</h1>
                            <p className="text-slate-300 text-lg">
                                {leagueSettings.level} • {leagueSettings.sport}
                            </p>
                        </div>
                    </div>
                    
                    <p className="text-slate-300 mb-6">
                        Your competitive advantage starts here. Manage your roster, optimize lineups, and dominate with AI strategy.
                    </p>
                    <div className="flex space-x-4">
                        <button 
                            onClick={() => setCurrentScreen('gamemode')}
                            className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold py-3 px-6 rounded-lg transition-colors flex items-center shadow-lg"
                        >
                            <Gamepad2 className="w-5 h-5 mr-2"/>
                            Enter Game Mode
                        </button>
                        {subscriptionTier === 'Free' && (
                            <button 
                                onClick={() => setCurrentScreen('subscription')}
                                className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold py-3 px-6 rounded-lg transition-colors flex items-center shadow-lg"
                            >
                                <Crown className="w-5 h-5 mr-2"/>
                                View Pro Plans
                            </button>
                        )}
                    </div>
                </div>
                {/* Decorative Icon */}
                <div className="hidden lg:block absolute right-10 top-1/2 -translate-y-1/2 opacity-30 transform rotate-12">
                   <SeamStrikeLogo className="w-64 h-64" sport={leagueSettings.sport} />
                </div>
            </div>

            {/* Team Overview & Switching Card */}
            <TeamOverview 
                currentSettings={leagueSettings}
                teams={availableTeams}
                standings={standings}
                schedule={schedule}
                roster={roster}
                onSwitchTeam={handleSwitchTeam}
                onNavigate={setCurrentScreen}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {/* Season Manager Card (Updated) */}
                <div 
                    onClick={() => setCurrentScreen('schedule')}
                    className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 cursor-pointer hover:shadow-md transition-all group hover:-translate-y-1 relative overflow-hidden"
                >
                    <div className="absolute top-3 right-3">
                         {subscriptionTier === 'SeasonPass' || subscriptionTier === 'ProAnnual' || subscriptionTier === 'ProMonthly' ? (
                             <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                         ) : (
                             <div className="bg-slate-900 text-white text-[10px] px-2 py-0.5 rounded font-bold">PRO</div>
                         )}
                    </div>
                    <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors text-indigo-600 dark:text-indigo-400">
                        <Calendar className="w-6 h-6"/>
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">Season Manager</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">
                        Comprehensive schedule & standings hub. Features <strong>AI Calendar Optimization</strong> for fatigue management and integrated <strong>Game Day Weather</strong>.
                    </p>
                </div>

                <div 
                    onClick={() => setCurrentScreen('lineup')}
                    className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 cursor-pointer hover:shadow-md transition-all group hover:-translate-y-1"
                >
                    <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors text-indigo-600 dark:text-indigo-400">
                        <ListOrdered className="w-6 h-6"/>
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">Smart Lineups</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">
                        Build optimized batting orders using <strong>AI Strategies</strong> or the <strong>Interactive Builder</strong>. Visualize power, speed, and defense balance instantly.
                    </p>
                </div>
                
                <div 
                    onClick={() => setCurrentScreen('defense')}
                    className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 cursor-pointer hover:shadow-md transition-all group hover:-translate-y-1"
                >
                    <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center mb-4 group-hover:bg-emerald-600 group-hover:text-white transition-colors text-emerald-600 dark:text-emerald-400">
                        <Shield className="w-6 h-6"/>
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">Defense Builder</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">
                        Generate fair rotations with AI or use the <strong>Manual Grid</strong> with real-time conflict detection for every inning.
                    </p>
                </div>

                <div 
                    onClick={() => setCurrentScreen('practice')}
                    className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 cursor-pointer hover:shadow-md transition-all group relative overflow-hidden hover:-translate-y-1"
                >
                    <div className="absolute top-3 right-3">
                         {subscriptionTier === 'SeasonPass' || subscriptionTier === 'ProAnnual' || subscriptionTier === 'ProMonthly' ? (
                             <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                         ) : (
                             <div className="bg-slate-900 text-white text-[10px] px-2 py-0.5 rounded font-bold">PRO</div>
                         )}
                    </div>
                    <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center mb-4 group-hover:bg-amber-500 group-hover:text-white transition-colors text-amber-600 dark:text-amber-400">
                        <CalendarDays className="w-6 h-6"/>
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">Practice Planner</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">
                        Generate opponent-specific team plans or <strong>Individual Workouts</strong> tailored to specific player needs. Download PDFs instantly.
                    </p>
                </div>

                <div 
                     onClick={() => setCurrentScreen('roster')}
                    className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 cursor-pointer hover:shadow-md transition-all group hover:-translate-y-1"
                >
                     <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center mb-4 group-hover:bg-orange-600 group-hover:text-white transition-colors text-orange-600 dark:text-orange-400">
                        <Users className="w-6 h-6"/>
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">Roster Management</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">
                        Track advanced metrics (OPS, WHIP), manage depth charts, and visualize performance with <strong>SeamStats™ Spray Charts</strong>.
                    </p>
                </div>

                <div 
                     onClick={() => setCurrentScreen('scouting')}
                    className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 cursor-pointer hover:shadow-md transition-all group hover:-translate-y-1"
                >
                     <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors text-blue-600 dark:text-blue-400">
                        <ClipboardList className="w-6 h-6"/>
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">Scouting Reports</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">
                        Analyze opponent notes to generate <strong>AI-driven Scouting Reports</strong>. Identify key threats, exploitable weaknesses, and tactical adjustments.
                    </p>
                </div>

                <div 
                     onClick={() => setCurrentScreen('video')}
                    className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 cursor-pointer hover:shadow-md transition-all group hover:-translate-y-1 relative overflow-hidden"
                >
                     <div className="absolute top-3 right-3">
                         {subscriptionTier === 'ProAnnual' || subscriptionTier === 'ProMonthly' ? (
                             <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                         ) : (
                             <div className="bg-slate-900 text-white text-[10px] px-2 py-0.5 rounded font-bold">PRO</div>
                         )}
                    </div>
                     <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mb-4 group-hover:bg-purple-600 group-hover:text-white transition-colors text-purple-600 dark:text-purple-400">
                        <Video className="w-6 h-6"/>
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">Video Analysis</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">
                        Upload game footage for <strong>AI Mechanical Analysis</strong>. Improve pitching delivery and swing mechanics with frame-by-frame insights.
                    </p>
                </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside 
        className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transform transition-transform duration-300 ease-in-out flex flex-col ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="p-6 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-3">
            <SeamStrikeLogo className="h-8 w-8" sport={leagueSettings.sport} />
            <span className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">SeamStrike</span>
          </div>
          <button className="lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>

        <nav className="px-4 space-y-1 mt-4 flex-grow overflow-y-auto pb-4">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setCurrentScreen(item.id as Screen);
                if (window.innerWidth < 1024) setSidebarOpen(false);
              }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                currentScreen === item.id 
                  ? 'bg-slate-900 dark:bg-indigo-600 text-white' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex-shrink-0">
            {/* Upgrade Banner for Free Users */}
            {subscriptionTier === 'Free' && (
                <div 
                    onClick={() => setCurrentScreen('subscription')}
                    className="mb-4 bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-lg p-3 text-white cursor-pointer hover:shadow-lg transition-all"
                >
                    <div className="flex items-center mb-1">
                        <Crown className="w-4 h-4 mr-2 text-amber-300" />
                        <span className="font-bold text-sm">Upgrade to Pro</span>
                    </div>
                    <p className="text-xs text-indigo-100">Unlock advanced analytics and AI tools.</p>
                </div>
            )}

            <div 
              className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg flex items-center space-x-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              onClick={() => setCurrentScreen('account')}
            >
                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold border border-slate-200 dark:border-slate-700 overflow-hidden">
                    {userProfile.name.charAt(0)}
                </div>
                <div className="overflow-hidden">
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase truncate">My Account</p>
                    <p className="text-sm font-semibold truncate text-slate-900 dark:text-white">{userProfile.name}</p>
                </div>
            </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Mobile Header */}
        <header className="lg:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between">
             <div className="flex items-center space-x-2">
                <SeamStrikeLogo className="h-8 w-8" sport={leagueSettings.sport} />
                <span className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">SeamStrike</span>
             </div>
             <button onClick={() => setSidebarOpen(true)}>
                <Menu className="w-6 h-6 text-slate-600 dark:text-slate-400" />
             </button>
        </header>

        <div className="flex-1 overflow-auto p-4 lg:p-8">
            {renderContent()}
        </div>
      </main>
      
      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div 
            className="fixed inset-0 bg-black/20 dark:bg-black/50 z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}

export default App;

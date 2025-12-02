
import React, { useState, useRef } from 'react';
import { ScheduleEvent, Standing, CalendarStrategy, Player, LeagueSettings, WeatherInfo, SubscriptionTier } from '../types';
import { Calendar, Clock, MapPin, Upload, Plus, Trash2, Home, Flag, CheckCircle2, Download, Share2, X, Map, Navigation, Trophy, FileSpreadsheet, Sparkles, ArrowRight, AlertTriangle, Loader2, CloudRain, Sun, Cloud, Wind, CloudLightning, Snowflake, Lock, Zap, Star } from 'lucide-react';
import { analyzeSeasonSchedule, validateScheduleEvent } from '../services/geminiService.ts';
import InfoTooltip from './InfoTooltip.tsx';

interface ScheduleManagerProps {
  schedule: ScheduleEvent[];
  setSchedule: React.Dispatch<React.SetStateAction<ScheduleEvent[]>>;
  standings: Standing[];
  setStandings: React.Dispatch<React.SetStateAction<Standing[]>>;
  roster: Player[];
  league: LeagueSettings;
  subscriptionTier: SubscriptionTier;
  onUpgrade: (tier: SubscriptionTier) => void;
}

type Tab = 'calendar' | 'standings' | 'strategy';

const ScheduleManager: React.FC<ScheduleManagerProps> = ({ schedule, setSchedule, standings, setStandings, roster, league, subscriptionTier, onUpgrade }) => {
  const [activeTab, setActiveTab] = useState<Tab>('calendar');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const standingsFileRef = useRef<HTMLInputElement>(null);

  // Calendar State
  const [isAdding, setIsAdding] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<ScheduleEvent | null>(null);
  const [newEvent, setNewEvent] = useState<Partial<ScheduleEvent>>({
      type: 'Game',
      date: '',
      time: '',
      opponent: '',
      location: '',
      address: '',
      notes: '',
      isHome: true
  });
  const [validationWarning, setValidationWarning] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  // Standings State
  const [isAddingTeam, setIsAddingTeam] = useState(false);
  const [newTeam, setNewTeam] = useState<Partial<Standing>>({ teamName: '', wins: 0, losses: 0, ties: 0 });

  // Strategy State
  const [strategy, setStrategy] = useState<CalendarStrategy | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const hasAccess = ['SeasonPass', 'ProMonthly', 'ProAnnual'].includes(subscriptionTier);

  // --- Shared Functions ---
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, type: 'schedule' | 'standings') => {
    const file = event.target.files?.[0];
    if (file) {
      alert(`Simulating import of ${type} from ${file.name}...`);
      setTimeout(() => {
        if (type === 'schedule') {
             const imported: ScheduleEvent[] = [
                 { id: `imp_${Date.now()}`, date: '2023-11-01', time: '18:00', type: 'Game', opponent: 'Imported Opponent', location: 'Home', isHome: true },
            ];
            setSchedule(prev => [...prev, ...imported].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
        } else {
             const mockImportedStandings: Standing[] = [
               { id: '101', rank: 1, teamName: 'Imported Leaders', wins: 20, losses: 1, ties: 0, winPct: .952, gamesBack: 0 },
            ];
            setStandings(prev => [...prev, ...mockImportedStandings]);
        }
        alert(`${type} updated!`);
      }, 1000);
    }
  };

  // --- Calendar Logic ---

  const handleDownloadSchedule = () => {
    if (schedule.length === 0) { alert("No events to download."); return; }
    const headers = "Date,Time,Type,Event,Location,Address,Home/Away,Result,Notes\n";
    const rows = schedule.map(e => {
        const eventName = e.type === 'Game' ? `vs ${e.opponent}` : e.title || 'Event';
        const homeAway = e.type === 'Game' ? (e.isHome ? 'Home' : 'Away') : 'N/A';
        return `${e.date},${e.time},${e.type},"${eventName}",${e.location},"${e.address || ''}",${homeAway},${e.result || ''},"${e.notes || ''}"`;
    }).join("\n");
    const csvContent = "data:text/csv;charset=utf-8," + encodeURI(headers + rows);
    const link = document.createElement("a");
    link.setAttribute("href", csvContent);
    link.setAttribute("download", `team_schedule_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShareSchedule = async () => {
    let urlToShare = window.location.href;
    try { if (!urlToShare.startsWith('http')) urlToShare = 'https://seamstrike.app'; } catch (e) { urlToShare = 'https://seamstrike.app'; }
    if (navigator.share) {
        try { await navigator.share({ title: 'Team Schedule', text: `Check out our Schedule!`, url: urlToShare }); } catch (error) { console.error('Error sharing:', error); }
    } else { alert(`Link copied: ${urlToShare}`); }
  };

  const handleValidation = async () => {
      if (!newEvent.date || !newEvent.time) return;
      setIsValidating(true);
      setValidationWarning(null);
      const warning = await validateScheduleEvent(newEvent, schedule);
      setValidationWarning(warning);
      setIsValidating(false);
  }

  const handleAddEvent = async () => {
      if (!newEvent.date || !newEvent.time || !newEvent.location) {
          alert("Please fill in Date, Time and Location");
          return;
      }
      
      const event: ScheduleEvent = {
          id: Date.now().toString(),
          date: newEvent.date!,
          time: newEvent.time!,
          type: newEvent.type as any,
          opponent: newEvent.type === 'Game' ? (newEvent.opponent || 'TBD') : undefined,
          title: newEvent.type !== 'Game' ? (newEvent.title || 'Event') : undefined,
          location: newEvent.location!,
          address: newEvent.address,
          notes: newEvent.notes,
          isHome: newEvent.isHome,
          result: undefined,
          aiValidation: validationWarning || undefined
      };

      setSchedule(prev => [...prev, event].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
      setIsAdding(false);
      setNewEvent({ type: 'Game', date: '', time: '', opponent: '', location: '', address: '', notes: '', isHome: true });
      setValidationWarning(null);
  };

  const removeEvent = (id: string) => {
      if (confirm("Delete this event?")) {
          setSchedule(prev => prev.filter(e => e.id !== id));
          if (selectedEvent?.id === id) setSelectedEvent(null);
      }
  };

  const getWeatherIcon = (condition: WeatherInfo['condition']) => {
      switch(condition) {
          case 'Rain': return <CloudRain className="w-5 h-5 text-blue-500" />;
          case 'Storm': return <CloudLightning className="w-5 h-5 text-purple-500" />;
          case 'Sunny': return <Sun className="w-5 h-5 text-amber-500" />;
          case 'Cloudy': return <Cloud className="w-5 h-5 text-slate-500" />;
          case 'Snow': return <Snowflake className="w-5 h-5 text-blue-300" />;
          case 'Windy': return <Wind className="w-5 h-5 text-slate-400" />;
          default: return <Sun className="w-5 h-5 text-amber-500" />;
      }
  };

  // --- Standings Logic ---
  const handleAddTeam = () => {
    if (!newTeam.teamName) return;
    const total = (newTeam.wins || 0) + (newTeam.losses || 0) + (newTeam.ties || 0);
    const pct = total === 0 ? 0 : ((newTeam.wins || 0) + ((newTeam.ties || 0) * 0.5)) / total;
    
    const team: Standing = {
        id: Date.now().toString(),
        rank: standings.length + 1,
        teamName: newTeam.teamName,
        wins: newTeam.wins || 0,
        losses: newTeam.losses || 0,
        ties: newTeam.ties || 0,
        winPct: pct,
        gamesBack: 0
    };
    const updated = [...standings, team].sort((a, b) => b.winPct - a.winPct);
    // Simple re-rank
    updated.forEach((t, idx) => {
        t.rank = idx + 1;
        if (idx === 0) t.gamesBack = 0;
        else {
            const leader = updated[0];
            t.gamesBack = ((leader.wins - leader.losses) - (t.wins - t.losses)) / 2;
        }
    });
    setStandings(updated);
    setIsAddingTeam(false);
    setNewTeam({ teamName: '', wins: 0, losses: 0, ties: 0 });
  };
  
  const removeTeam = (id: string) => setStandings(standings.filter(s => s.id !== id));

  // --- AI Strategy Logic ---
  const handleAnalyzeSeason = async () => {
      setIsAnalyzing(true);
      const res = await analyzeSeasonSchedule(schedule, roster, standings, league);
      setStrategy(res);
      setIsAnalyzing(false);
  };

  const applySuggestion = (suggestion: any) => {
      // In a real app, logic to replace/update specific events by ID
      // Here we just mock adding the suggested event
      const evt = suggestion.suggestedEvent;
      evt.id = `ai_${Date.now()}`;
      setSchedule(prev => [...prev, evt].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
      alert("Applied suggestion to schedule!");
  };

  if (!hasAccess) {
      return (
          <div className="h-full flex items-center justify-center p-6 bg-slate-50">
              <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  <div className="space-y-6">
                      <div className="flex items-center space-x-3 text-indigo-600">
                          <Calendar className="w-8 h-8" />
                          <h1 className="text-3xl font-extrabold text-slate-900">Season Manager</h1>
                      </div>
                      <p className="text-lg text-slate-600">
                          Take control of your entire season. Unified scheduling, league standings, and AI-driven optimization in one place.
                      </p>
                      <ul className="space-y-4">
                          {[
                              "AI Calendar Optimization (Rest & Fatigue Analysis)",
                              "Unified League Standings Tracker",
                              "Automated Weather & Radar Integration",
                              "Travel Planning & Event Validation"
                          ].map((item, i) => (
                              <li key={i} className="flex items-center text-slate-700">
                                  <CheckCircle2 className="w-5 h-5 text-emerald-500 mr-3" />
                                  {item}
                              </li>
                          ))}
                      </ul>
                  </div>

                  <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center relative overflow-hidden">
                      <div className="absolute top-0 right-0 bg-amber-400 text-amber-900 text-xs font-bold px-3 py-1 rounded-bl-lg">
                          MOST POPULAR
                      </div>
                      <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg mx-auto mb-6">
                          <Lock className="w-8 h-8 text-white" />
                      </div>
                      <h2 className="text-2xl font-bold text-slate-900 mb-2">Unlock Full Access</h2>
                      <p className="text-slate-500 mb-6">Included in Seamhead Season Pass & Pro Plans</p>
                      
                      <div className="space-y-3">
                          <button 
                              onClick={() => onUpgrade('SeasonPass')}
                              className="w-full py-3 bg-gradient-to-r from-amber-400 to-amber-500 text-amber-900 font-bold rounded-xl shadow-lg hover:from-amber-300 hover:to-amber-400 flex items-center justify-center transition-all"
                          >
                              <Zap className="w-4 h-4 mr-2" />
                              Get Season Pass ($9.99)
                          </button>
                          <button 
                              onClick={() => onUpgrade('ProMonthly')}
                              className="w-full py-3 bg-white border-2 border-indigo-100 text-indigo-600 font-bold rounded-xl hover:border-indigo-200 hover:bg-indigo-50 transition-all"
                          >
                              View Pro Plans
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-full flex flex-col relative overflow-hidden">
       {/* Tab Header */}
       <div className="bg-slate-50 border-b border-slate-200 px-6 pt-4 flex justify-between items-center">
          <div className="flex space-x-6">
             <button 
                onClick={() => setActiveTab('calendar')}
                className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center ${activeTab === 'calendar' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
             >
                <Calendar className="w-4 h-4 mr-2" /> Calendar & Events
             </button>
             <button 
                onClick={() => setActiveTab('standings')}
                className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center ${activeTab === 'standings' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
             >
                <Trophy className="w-4 h-4 mr-2" /> 
                League Standings
                <InfoTooltip text="Track wins, losses, and games back." side="bottom" />
             </button>
             <button 
                onClick={() => setActiveTab('strategy')}
                className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center ${activeTab === 'strategy' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
             >
                <Sparkles className="w-4 h-4 mr-2" /> 
                AI Optimization
                <InfoTooltip text="Analyze schedule for travel fatigue and rest optimization." side="bottom" />
             </button>
          </div>
       </div>

       {/* Content Area */}
       <div className="flex-grow p-6 overflow-y-auto">
          
          {/* ----- CALENDAR TAB ----- */}
          {activeTab === 'calendar' && (
              <div className="h-full flex flex-col">
                  {/* Event Modal */}
                  {selectedEvent && (
                    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                            <div className={`p-6 flex justify-between items-start text-white ${selectedEvent.type === 'Game' ? 'bg-emerald-600' : selectedEvent.type === 'Practice' ? 'bg-amber-500' : 'bg-indigo-600'}`}>
                                <div>
                                    <h2 className="text-2xl font-bold">{selectedEvent.type === 'Game' ? `vs ${selectedEvent.opponent}` : selectedEvent.title}</h2>
                                    <div className="flex items-center mt-2 text-white/90 text-sm">
                                            <Calendar className="w-4 h-4 mr-2" />
                                            {new Date(selectedEvent.date).toLocaleDateString(undefined, {weekday: 'long', month: 'long', day: 'numeric'})}
                                            <Clock className="w-4 h-4 ml-4 mr-2" />
                                            {selectedEvent.time}
                                    </div>
                                </div>
                                <button onClick={() => setSelectedEvent(null)} className="hover:bg-white/20 rounded p-1"><X className="w-6 h-6" /></button>
                            </div>
                            <div className="p-6 overflow-y-auto">
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-4">
                                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Location</h4>
                                    <p className="font-bold text-slate-800 text-lg flex items-center">
                                        <MapPin className="w-4 h-4 mr-2 text-slate-400" />
                                        {selectedEvent.location}
                                    </p>
                                    <p className="text-slate-500 text-sm ml-6">{selectedEvent.address}</p>
                                    {selectedEvent.aiValidation && (
                                        <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-start">
                                            <AlertTriangle className="w-4 h-4 mr-2 shrink-0" />
                                            {selectedEvent.aiValidation}
                                        </div>
                                    )}
                                </div>

                                {selectedEvent.weather && (
                                    <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 mb-4">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="text-xs font-bold text-blue-600 uppercase mb-2">Game Day Weather</h4>
                                                <div className="flex items-center">
                                                    {getWeatherIcon(selectedEvent.weather.condition)}
                                                    <span className="text-2xl font-bold text-slate-800 ml-2">{selectedEvent.weather.temp}°</span>
                                                    <span className="text-sm text-slate-500 ml-2 font-medium">{selectedEvent.weather.condition}</span>
                                                </div>
                                                <div className="flex gap-4 mt-2 text-xs text-slate-500">
                                                    <span className="flex items-center"><CloudRain className="w-3 h-3 mr-1" /> {selectedEvent.weather.precipChance}% Precip</span>
                                                    <span className="flex items-center"><Wind className="w-3 h-3 mr-1" /> {selectedEvent.weather.windSpeed} mph</span>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => alert("Simulating Radar View Overlay...")}
                                                className="bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-200 transition-colors flex items-center shadow-sm"
                                            >
                                                <Map className="w-3 h-3 mr-1.5" />
                                                View Radar
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {selectedEvent.notes && (
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                        <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Notes</h4>
                                        <p className="text-slate-700 text-sm">{selectedEvent.notes}</p>
                                    </div>
                                )}
                            </div>
                            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between">
                                <button onClick={() => removeEvent(selectedEvent.id)} className="text-red-500 hover:text-red-700 text-sm flex items-center font-medium"><Trash2 className="w-4 h-4 mr-1.5" /> Delete Event</button>
                                <button onClick={() => setSelectedEvent(null)} className="bg-white border border-slate-300 px-4 py-2 rounded-lg font-bold text-sm hover:bg-slate-50">Close</button>
                            </div>
                        </div>
                    </div>
                  )}

                  {/* Calendar Toolbar */}
                  <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 space-y-4 xl:space-y-0">
                      <div>
                        <h2 className="text-2xl font-bold text-slate-800 flex items-center">Team Schedule</h2>
                        <p className="text-slate-500 text-sm">Manage games, practices, and tournaments</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => handleFileUpload(e, 'schedule')} />
                        <button onClick={() => handleShareSchedule()} className="bg-white border px-3 py-2 rounded-lg hover:bg-slate-50 flex items-center text-sm"><Share2 className="w-4 h-4 mr-2" /> Share</button>
                        <button onClick={() => handleDownloadSchedule()} className="bg-white border px-3 py-2 rounded-lg hover:bg-slate-50 flex items-center text-sm"><Download className="w-4 h-4 mr-2" /> Export</button>
                        <button onClick={() => fileInputRef.current?.click()} className="bg-white border px-3 py-2 rounded-lg hover:bg-slate-50 flex items-center text-sm"><Upload className="w-4 h-4 mr-2" /> Import</button>
                        <button onClick={() => setIsAdding(!isAdding)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center text-sm font-bold"><Plus className="w-4 h-4 mr-2" /> Add Event</button>
                      </div>
                  </div>

                  {/* Add Event Form */}
                  {isAdding && (
                      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6 animate-fade-in relative">
                          <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">New Event Details</h4>
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                              <div>
                                  <label className="text-xs text-slate-500 font-semibold">Type</label>
                                  <select className="w-full p-2 border rounded mt-1" value={newEvent.type} onChange={e => setNewEvent({...newEvent, type: e.target.value as any})}><option value="Game">Game</option><option value="Practice">Practice</option></select>
                              </div>
                              <div>
                                  <label className="text-xs text-slate-500 font-semibold">Date</label>
                                  <input type="date" className="w-full p-2 border rounded mt-1" value={newEvent.date} onChange={e => setNewEvent({...newEvent, date: e.target.value})} onBlur={handleValidation} />
                              </div>
                              <div>
                                  <label className="text-xs text-slate-500 font-semibold">Time</label>
                                  <input type="time" className="w-full p-2 border rounded mt-1" value={newEvent.time} onChange={e => setNewEvent({...newEvent, time: e.target.value})} onBlur={handleValidation} />
                              </div>
                              <div>
                                  <label className="text-xs text-slate-500 font-semibold">Location</label>
                                  <input className="w-full p-2 border rounded mt-1" placeholder="Field Name" value={newEvent.location} onChange={e => setNewEvent({...newEvent, location: e.target.value})} />
                              </div>
                          </div>
                          
                          {/* Validation Warning Area */}
                          {isValidating && <div className="text-xs text-indigo-500 flex items-center mb-2"><Loader2 className="w-3 h-3 animate-spin mr-1"/> AI checking for conflicts...</div>}
                          {validationWarning && (
                              <div className="bg-amber-50 border border-amber-200 p-2 rounded mb-4 flex items-center text-sm text-amber-800">
                                  <AlertTriangle className="w-4 h-4 mr-2 flex-shrink-0" />
                                  {validationWarning}
                              </div>
                          )}

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {newEvent.type === 'Game' ? (
                                  <div><label className="text-xs text-slate-500 font-semibold">Opponent</label><input className="w-full p-2 border rounded mt-1" value={newEvent.opponent} onChange={e => setNewEvent({...newEvent, opponent: e.target.value})} /></div>
                              ) : (
                                  <div><label className="text-xs text-slate-500 font-semibold">Title</label><input className="w-full p-2 border rounded mt-1" value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} /></div>
                              )}
                              <div><label className="text-xs text-slate-500 font-semibold">Notes</label><input className="w-full p-2 border rounded mt-1" value={newEvent.notes} onChange={e => setNewEvent({...newEvent, notes: e.target.value})} /></div>
                          </div>
                          <div className="flex justify-end mt-4 gap-2">
                              <button onClick={() => setIsAdding(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-200 rounded">Cancel</button>
                              <button onClick={handleAddEvent} className="px-4 py-2 bg-indigo-600 text-white rounded font-bold hover:bg-indigo-700">Save Event</button>
                          </div>
                      </div>
                  )}

                  {/* List */}
                  <div className="flex-grow overflow-y-auto space-y-3">
                      {schedule.map(event => (
                          <div key={event.id} onClick={() => setSelectedEvent(event)} className="bg-white border border-slate-100 rounded-lg p-4 flex items-center justify-between hover:shadow-md transition-all cursor-pointer hover:border-indigo-300 group">
                              <div className="flex items-center space-x-4">
                                  <div className={`w-14 h-14 rounded-lg flex flex-col items-center justify-center text-white font-bold shrink-0 ${event.type === 'Game' ? 'bg-emerald-500' : event.type === 'Practice' ? 'bg-amber-500' : 'bg-indigo-500'}`}>
                                      <span className="text-xs uppercase">{new Date(event.date).toLocaleString('default', { month: 'short' })}</span>
                                      <span className="text-xl">{new Date(event.date).getDate()}</span>
                                  </div>
                                  <div>
                                      <h4 className="font-bold text-slate-800 text-lg group-hover:text-indigo-600 transition-colors">{event.type === 'Game' ? `vs ${event.opponent}` : event.title}</h4>
                                      <div className="flex flex-wrap items-center text-sm text-slate-500 gap-4 mt-1">
                                          <span className="flex items-center"><Clock className="w-3 h-3 mr-1" /> {event.time}</span>
                                          <span className="flex items-center"><MapPin className="w-3 h-3 mr-1" /> {event.location}</span>
                                          {event.weather && (
                                              <span className="flex items-center text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full text-xs font-medium">
                                                  {getWeatherIcon(event.weather.condition)}
                                                  <span className="ml-1">{event.weather.temp}°</span>
                                              </span>
                                          )}
                                          {event.aiValidation && <span className="flex items-center text-amber-500 text-xs font-bold"><AlertTriangle className="w-3 h-3 mr-1"/> Conflict</span>}
                                      </div>
                                  </div>
                              </div>
                              <ArrowRight className="text-slate-300 w-5 h-5 group-hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" />
                          </div>
                      ))}
                  </div>
              </div>
          )}

          {/* ----- STANDINGS TAB ----- */}
          {activeTab === 'standings' && (
              <div className="h-full flex flex-col">
                  <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-bold text-slate-800">League Standings</h2>
                      <div className="flex gap-2">
                          <input type="file" ref={standingsFileRef} className="hidden" onChange={(e) => handleFileUpload(e, 'standings')} />
                          <button onClick={() => standingsFileRef.current?.click()} className="bg-white border px-3 py-2 rounded-lg flex items-center text-sm hover:bg-slate-50"><Upload className="w-4 h-4 mr-2" /> Upload</button>
                          <button onClick={() => setIsAddingTeam(!isAddingTeam)} className="bg-indigo-600 text-white px-3 py-2 rounded-lg flex items-center text-sm font-bold hover:bg-indigo-700"><Plus className="w-4 h-4 mr-2" /> Add Team</button>
                      </div>
                  </div>

                  {isAddingTeam && (
                      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6 flex gap-2 items-end">
                          <div className="flex-grow"><label className="text-xs font-bold text-slate-500">Name</label><input className="w-full p-2 border rounded mt-1" value={newTeam.teamName} onChange={e => setNewTeam({...newTeam, teamName: e.target.value})} /></div>
                          <div className="w-20"><label className="text-xs font-bold text-slate-500">W</label><input type="number" className="w-full p-2 border rounded mt-1" value={newTeam.wins} onChange={e => setNewTeam({...newTeam, wins: parseInt(e.target.value)})} /></div>
                          <div className="w-20"><label className="text-xs font-bold text-slate-500">L</label><input type="number" className="w-full p-2 border rounded mt-1" value={newTeam.losses} onChange={e => setNewTeam({...newTeam, losses: parseInt(e.target.value)})} /></div>
                          <button onClick={handleAddTeam} className="bg-indigo-600 text-white px-4 py-2 rounded h-10">Add</button>
                      </div>
                  )}

                  <div className="overflow-x-auto rounded-lg border border-slate-100">
                    <table className="min-w-full text-left">
                        <thead className="bg-slate-900 text-white">
                            <tr><th className="py-3 px-4 w-12 text-center">RK</th><th className="py-3 px-4">Team</th><th className="py-3 px-4 w-20 text-center">W</th><th className="py-3 px-4 w-20 text-center">L</th><th className="py-3 px-4 w-24 text-right">PCT</th><th className="py-3 px-4 w-20 text-right">GB</th><th className="py-3 px-4 w-12"></th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {standings.map((team, idx) => (
                                <tr key={team.id} className="hover:bg-slate-50">
                                    <td className="py-3 px-4 text-center font-bold text-slate-500">{team.rank}</td>
                                    <td className="py-3 px-4 font-bold text-slate-800 flex items-center">{idx === 0 && <Trophy className="w-4 h-4 text-amber-500 mr-2" />}{team.teamName}</td>
                                    <td className="py-3 px-4 text-center">{team.wins}</td>
                                    <td className="py-3 px-4 text-center text-slate-500">{team.losses}</td>
                                    <td className="py-3 px-4 text-right font-mono">{team.winPct.toFixed(3).replace('0.', '.')}</td>
                                    <td className="py-3 px-4 text-right font-mono text-slate-500">{team.gamesBack || '-'}</td>
                                    <td className="py-3 px-4 text-right"><button onClick={() => removeTeam(team.id)} className="text-slate-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                  </div>
              </div>
          )}

          {/* ----- AI OPTIMIZATION TAB ----- */}
          {activeTab === 'strategy' && (
              <div className="h-full flex flex-col items-center">
                  {!strategy ? (
                      <div className="text-center py-12 max-w-lg">
                          <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6 text-indigo-600">
                              <Sparkles className="w-10 h-10" />
                          </div>
                          <h2 className="text-2xl font-bold text-slate-900 mb-2">Maximize Your Season</h2>
                          <p className="text-slate-500 mb-8">
                              Let SeamStrike AI analyze your schedule against league standings and player roster to suggest optimal practice times, rest days, and travel adjustments.
                          </p>
                          <button 
                              onClick={handleAnalyzeSeason}
                              disabled={isAnalyzing}
                              className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center mx-auto"
                          >
                              {isAnalyzing ? <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Analyzing...</> : "Create Calendar Strategy"}
                          </button>
                      </div>
                  ) : (
                      <div className="w-full">
                          <div className="bg-slate-900 text-white p-6 rounded-xl shadow-lg mb-6">
                              <h3 className="text-xl font-bold mb-4 flex items-center"><Sparkles className="w-5 h-5 mr-2 text-amber-400" /> Strategic Analysis</h3>
                              <div className="prose prose-invert prose-sm max-w-none">
                                  <div dangerouslySetInnerHTML={{ __html: strategy.analysis.replace(/\n/g, '<br/>') }} />
                              </div>
                          </div>

                          <h3 className="text-lg font-bold text-slate-800 mb-4">Suggested Adjustments</h3>
                          <div className="space-y-4">
                              {strategy.suggestions.map((sugg, i) => (
                                  <div key={i} className="bg-white border border-indigo-100 rounded-xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between">
                                      <div className="flex-grow">
                                          <p className="font-bold text-indigo-900 mb-1">{sugg.reason}</p>
                                          <div className="flex items-center text-sm text-slate-600">
                                               <span className="font-mono bg-slate-100 px-2 rounded mr-2">Original</span>
                                               <ArrowRight className="w-4 h-4 mx-2 text-slate-400" />
                                               <span className="font-bold text-emerald-600">
                                                   {sugg.suggestedEvent.date} @ {sugg.suggestedEvent.time} ({sugg.suggestedEvent.type})
                                               </span>
                                          </div>
                                      </div>
                                      <button 
                                        onClick={() => applySuggestion(sugg)}
                                        className="mt-3 md:mt-0 bg-emerald-50 text-emerald-700 border border-emerald-200 px-4 py-2 rounded-lg font-bold text-sm hover:bg-emerald-100 transition-colors"
                                      >
                                          Apply Change
                                      </button>
                                  </div>
                              ))}
                              {strategy.suggestions.length === 0 && (
                                  <div className="text-center p-6 bg-slate-50 rounded-lg text-slate-500">
                                      <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
                                      No critical schedule conflicts found!
                                  </div>
                              )}
                          </div>
                          
                          <div className="mt-8 text-center">
                              <button onClick={() => setStrategy(null)} className="text-slate-400 hover:text-indigo-600 text-sm">Clear Analysis</button>
                          </div>
                      </div>
                  )}
              </div>
          )}
       </div>
    </div>
  );
};

export default ScheduleManager;

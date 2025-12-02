
import React, { useState, useRef, useMemo } from 'react';
import { Player, Position, SubscriptionTier, Gender } from '../types';
import { POSITIONS_LIST } from '../constants';
import SeamStats from './SeamStats.tsx';
import InfoTooltip from './InfoTooltip.tsx';
import { Plus, Trash2, User, Filter, Activity, Shield, Upload, Camera, AlertCircle, Pencil, BarChart2, X, FileText, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

interface RosterManagerProps {
  roster: Player[];
  setRoster: React.Dispatch<React.SetStateAction<Player[]>>;
  subscriptionTier: SubscriptionTier;
  onUpgrade: (tier: SubscriptionTier) => void;
}

// Expanded View Modes
type ViewMode = 'batting_std' | 'batting_adv' | 'pitching_std' | 'pitching_adv' | 'defense_std' | 'defense_adv';
type RoleFilter = 'ALL' | 'PITCHERS' | 'INFIELD' | 'OUTFIELD' | 'CATCHER';
type FormTab = 'profile' | 'hitting' | 'pitching' | 'fielding';

interface SortConfig {
  key: keyof Player;
  direction: 'asc' | 'desc';
}

const ROSTER_LIMIT = 40;

const RosterManager: React.FC<RosterManagerProps> = ({ roster, setRoster, subscriptionTier, onUpgrade }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('batting_std');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('ALL');
  const [formTab, setFormTab] = useState<FormTab>('profile');
  
  // Default sort by Number Ascending
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'number', direction: 'asc' });

  const [selectedSeamStatsPlayer, setSelectedSeamStatsPlayer] = useState<Player | null>(null);
  const [viewingPlayer, setViewingPlayer] = useState<Player | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const playerImageInputRef = useRef<HTMLInputElement>(null);

  const initialPlayerState: Partial<Player> = {
    name: '',
    number: '',
    gender: 'Male',
    imageUrl: '',
    primaryPosition: Position.BENCH,
    secondaryPositions: [],
    throwHand: 'R',
    batHand: 'R',
    // Hit Std
    battingAvg: 0, onBasePct: 0, sluggingPct: 0, ops: 0, hits: 0, homeRuns: 0, rbi: 0, stolenBases: 0,
    // Hit Adv
    iso: 0, babip: 0, wOBA: 0, wRCPlus: 0, strikeoutRate: 0, walkRate: 0, hardHitPct: 0, lineDrivePct: 0,
    // Pitch Std
    era: 0, whip: 0, wins: 0, losses: 0, gamesPlayed: 0, saves: 0, inningsPitched: 0, strikeouts: 0,
    // Pitch Adv
    fip: 0, xFip: 0, kPer9: 0, bbPer9: 0, hrPer9: 0, pitchingBabip: 0, lobPct: 0, eraPlus: 0,
    // Field Std
    fieldingPct: 0, putouts: 0, assists: 0, fieldingErrors: 0, doublePlays: 0, passedBalls: 0, caughtStealing: 0, stolenBasesAllowed: 0,
    // Field Adv
    drs: 0, uzr: 0, oaa: 0, rangeFactor: 0, catcherEra: 0, popTime: 0, framingRuns: 0, armStrength: 50,
    // Ratings
    speedRating: 5, defenseRating: 5
  };

  const [playerForm, setPlayerForm] = useState<Partial<Player>>(initialPlayerState);

  const resetForm = () => {
    setPlayerForm(initialPlayerState);
    setEditingId(null);
    setIsFormOpen(false);
    setFormTab('profile');
  };

  const handleSavePlayer = () => {
    if (!playerForm.name || !playerForm.number) {
        alert("Name and Number are required.");
        return;
    }

    const secondaryPositions = playerForm.secondaryPositions || [];

    if (editingId) {
        setRoster(prev => prev.map(p => p.id === editingId ? { ...p, ...playerForm, secondaryPositions } as Player : p));
        resetForm();
    } else {
        if (roster.length >= ROSTER_LIMIT) {
            alert(`Roster limit of ${ROSTER_LIMIT} players reached.`);
            return;
        }

        const newPlayer: Player = {
            ...initialPlayerState as Player, // Defaults
            ...playerForm as Player,         // Overwrites
            id: Date.now().toString(),
            secondaryPositions,
        };

        setRoster(prev => [...prev, newPlayer]);
        resetForm();
    }
  };

  const startEditing = (player: Player) => {
      setPlayerForm(player);
      setEditingId(player.id);
      setIsFormOpen(true);
      setViewingPlayer(null);
      setFormTab('profile');
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const removePlayer = (id: string) => {
    if (window.confirm("Are you sure you want to remove this player?")) {
        setRoster(roster.filter(p => p.id !== id));
        if (editingId === id) resetForm();
        if (viewingPlayer?.id === id) setViewingPlayer(null);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      alert(`Parsing ${file.name}... \n\n(Note: In a real app, this would process the PDF/Spreadsheet. Mocking success for demo.)`);
      setTimeout(() => {
        alert("Stats imported successfully!");
      }, 1000);
    }
  };

  const handlePlayerImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPlayerForm(prev => ({ ...prev, imageUrl: url }));
    }
  };

  const toggleSecondaryPosition = (pos: Position) => {
      const current = playerForm.secondaryPositions || [];
      if (current.includes(pos)) {
          setPlayerForm({ ...playerForm, secondaryPositions: current.filter(p => p !== pos) });
      } else {
          setPlayerForm({ ...playerForm, secondaryPositions: [...current, pos] });
      }
  };

  const requestSort = (key: keyof Player) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredRoster = useMemo(() => {
    const filtered = roster.filter(player => {
        if (roleFilter === 'ALL') return true;
        if (roleFilter === 'PITCHERS') return player.primaryPosition === Position.P || player.secondaryPositions?.includes(Position.P);
        if (roleFilter === 'CATCHER') return player.primaryPosition === Position.C || player.secondaryPositions?.includes(Position.C);
        if (roleFilter === 'INFIELD') return [Position.TB, Position.SB, Position.SS, Position.FB].includes(player.primaryPosition);
        if (roleFilter === 'OUTFIELD') return [Position.LF, Position.CF, Position.RF].includes(player.primaryPosition);
        return true;
    });

    return filtered.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        if (aValue === undefined || bValue === undefined) return 0;
        let comparison = 0;
        if (sortConfig.key === 'number') {
             comparison = (parseInt(a.number) || 0) - (parseInt(b.number) || 0);
        } else if (typeof aValue === 'string' && typeof bValue === 'string') {
            comparison = aValue.localeCompare(bValue);
        } else if (typeof aValue === 'number' && typeof bValue === 'number') {
            comparison = aValue - bValue;
        }
        return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [roster, roleFilter, sortConfig]);

  const isPitcher = (p: Player) => p.primaryPosition === Position.P || p.secondaryPositions?.includes(Position.P);

  const getPronoun = (gender: Gender, form: 'subject' | 'object' | 'possessive') => {
      const g = gender || 'Male';
      if (g === 'Female') return form === 'subject' ? 'She' : form === 'object' ? 'her' : 'Her';
      if (g === 'Non-Binary') return form === 'subject' ? 'They' : form === 'object' ? 'them' : 'Their';
      return form === 'subject' ? 'He' : form === 'object' ? 'him' : 'His';
  };

  const getMiniScoutingReport = (p: Player): string => {
      const parts = [];
      const subject = getPronoun(p.gender, 'subject');
      const poss = getPronoun(p.gender, 'possessive');
      if (p.ops > 1.000) parts.push(`${subject} is an elite power threat.`);
      else if (p.battingAvg > .320) parts.push(`${subject} is a consistent contact hitter.`);
      else if (p.battingAvg < .200) parts.push(`${subject} is struggling at the plate.`);
      else parts.push(`${subject} is a reliable bat.`);
      if (p.era > 0 && p.era < 3.00) parts.push(`${poss} arm is dominant.`);
      else if (p.speedRating >= 8) parts.push(`${subject} is a stolen base threat.`);
      else if (p.defenseRating >= 9) parts.push(`${subject} is a gold glove defender.`);
      return parts.join(" ");
  };

  const SortHeader = ({ label, sortKey, align = 'right', tooltip = null }: { label: string, sortKey: keyof Player, align?: 'left'|'right', tooltip?: React.ReactNode }) => (
    <th 
        className={`py-3 px-2 text-xs font-bold text-slate-500 uppercase cursor-pointer hover:bg-slate-100 transition-colors select-none ${align === 'right' ? 'text-right' : 'text-left'}`}
        onClick={() => requestSort(sortKey)}
    >
        <div className={`flex items-center ${align === 'right' ? 'justify-end' : 'justify-start'}`}>
            {label}
            {tooltip}
            {sortConfig.key === sortKey ? (
                sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3 ml-1 text-indigo-600" /> : <ArrowDown className="w-3 h-3 ml-1 text-indigo-600" />
            ) : (
                <ArrowUpDown className="w-3 h-3 ml-1 text-slate-300 opacity-50" />
            )}
        </div>
    </th>
  );

  const StatInput = ({ label, field, step = "1", max }: { label: string, field: keyof Player, step?: string, max?: number }) => (
     <div className="group relative">
        <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">{label}</label>
        <input 
            className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 outline-none" 
            type="number" 
            step={step} 
            max={max}
            value={playerForm[field] !== undefined ? playerForm[field] as number : ''} 
            onChange={e => setPlayerForm({...playerForm, [field]: parseFloat(e.target.value)})} 
        />
     </div>
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      {/* SeamStats Modal */}
      {selectedSeamStatsPlayer && (
        <SeamStats 
          player={selectedSeamStatsPlayer} 
          subscriptionTier={subscriptionTier}
          onClose={() => setSelectedSeamStatsPlayer(null)}
          onUpgrade={() => { setSelectedSeamStatsPlayer(null); onUpgrade('SeasonPass'); }}
        />
      )}

      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 space-y-4 md:space-y-0">
        <div>
           <div className="flex items-center space-x-3">
             <h2 className="text-2xl font-bold text-slate-800">Team Roster</h2>
             <span className={`px-2 py-1 rounded-full text-xs font-bold ${roster.length >= ROSTER_LIMIT ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600'}`}>
                {roster.length} / {ROSTER_LIMIT}
             </span>
           </div>
           <p className="text-slate-500 text-sm">Manage player stats, roles, and photos</p>
        </div>
        <div className="flex space-x-3">
          <input type="file" ref={fileInputRef} className="hidden" accept=".csv,.xlsx,.pdf" onChange={handleFileUpload} />
          <button onClick={() => fileInputRef.current?.click()} className="bg-white text-slate-600 border border-slate-300 px-4 py-2 rounded-lg hover:bg-slate-50 flex items-center shadow-sm text-sm"><Upload className="w-4 h-4 mr-2" /> Import Stats</button>
          <button onClick={() => {
                if (roster.length >= ROSTER_LIMIT && !editingId) alert("Roster limit reached!");
                else { isFormOpen && !editingId ? setIsFormOpen(false) : (resetForm(), setIsFormOpen(true)); }
            }}
            disabled={roster.length >= ROSTER_LIMIT && !editingId}
            className={`text-white px-4 py-2 rounded-lg flex items-center shadow-lg text-sm font-bold ${roster.length >= ROSTER_LIMIT && !editingId ? 'bg-slate-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'}`}
          >
            <Plus className="w-4 h-4 mr-2" />
            {isFormOpen ? 'Close Form' : 'Add Player'}
          </button>
        </div>
      </div>

      {/* Filters & View Toggles */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6 pb-6 border-b border-slate-100 justify-between">
        {/* View Toggle */}
        <div className="flex bg-slate-100 p-1 rounded-lg overflow-x-auto gap-1">
             {[
                 { id: 'batting_std', label: 'Hit (Std)', icon: Activity },
                 { id: 'batting_adv', label: 'Hit (Adv)', icon: BarChart2 },
                 { id: 'pitching_std', label: 'Pitch (Std)', icon: Activity },
                 { id: 'pitching_adv', label: 'Pitch (Adv)', icon: BarChart2 },
                 { id: 'defense_std', label: 'Field (Std)', icon: Shield },
                 { id: 'defense_adv', label: 'Field (Adv)', icon: BarChart2 },
             ].map(opt => (
                <button 
                    key={opt.id}
                    onClick={() => setViewMode(opt.id as ViewMode)}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center transition-all whitespace-nowrap ${viewMode === opt.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <opt.icon className="w-3 h-3 mr-1.5" />
                    {opt.label}
                </button>
             ))}
        </div>

        <div className="flex gap-2">
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Filter className="h-4 w-4 text-slate-400" /></div>
                <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as RoleFilter)} className="pl-9 pr-8 py-1.5 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none h-full">
                    <option value="ALL">All Players</option>
                    <option value="PITCHERS">Pitchers (Prim/Sec)</option>
                    <option value="CATCHER">Catchers</option>
                    <option value="INFIELD">Infielders</option>
                    <option value="OUTFIELD">Outfielders</option>
                </select>
            </div>
        </div>
      </div>

      {/* Add/Edit Player Form */}
      {isFormOpen && (
        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 mb-8 animate-fade-in shadow-inner">
          <div className="flex justify-between items-center mb-6 border-b border-slate-200 pb-4">
             <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wide">{editingId ? 'Edit Player' : 'New Player'}</h3>
             <div className="flex space-x-2">
                {(['profile', 'hitting', 'pitching', 'fielding'] as FormTab[]).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setFormTab(tab)}
                        className={`px-3 py-1 text-xs font-bold rounded-full transition-colors ${formTab === tab ? 'bg-indigo-600 text-white' : 'bg-white text-slate-500 hover:bg-slate-100'}`}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
             </div>
          </div>
          
          {/* PROFILE TAB */}
          {formTab === 'profile' && (
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-shrink-0">
                    <input type="file" ref={playerImageInputRef} accept="image/*" className="hidden" onChange={handlePlayerImageUpload} />
                    <div onClick={() => playerImageInputRef.current?.click()} className="w-24 h-24 rounded-full bg-slate-200 border-2 border-slate-300 flex items-center justify-center cursor-pointer hover:border-indigo-500 overflow-hidden relative group">
                        {playerForm.imageUrl ? <img src={playerForm.imageUrl} className="w-full h-full object-cover" /> : <User className="w-10 h-10 text-slate-400" />}
                        <div className="absolute inset-0 bg-black/30 hidden group-hover:flex items-center justify-center"><Camera className="w-6 h-6 text-white" /></div>
                    </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-grow">
                    <div className="col-span-2"><label className="text-xs text-slate-500 font-bold mb-1 block">Name</label><input className="w-full p-2 border rounded text-sm" value={playerForm.name} onChange={e => setPlayerForm({...playerForm, name: e.target.value})} /></div>
                    <div><label className="text-xs text-slate-500 font-bold mb-1 block">Number</label><input className="w-full p-2 border rounded text-sm" type="number" value={playerForm.number} onChange={e => setPlayerForm({...playerForm, number: e.target.value})} /></div>
                    <div><label className="text-xs text-slate-500 font-bold mb-1 block">Gender</label><select className="w-full p-2 border rounded text-sm" value={playerForm.gender} onChange={e => setPlayerForm({...playerForm, gender: e.target.value as Gender})}><option value="Male">Male</option><option value="Female">Female</option><option value="Non-Binary">Non-Binary</option></select></div>
                    <div><label className="text-xs text-slate-500 font-bold mb-1 block">Primary Pos</label><select className="w-full p-2 border rounded text-sm" value={playerForm.primaryPosition} onChange={e => setPlayerForm({...playerForm, primaryPosition: e.target.value as Position})}>{POSITIONS_LIST.map(p => <option key={p} value={p}>{p}</option>)}</select></div>
                    <div className="flex gap-2">
                        <div className="w-1/2"><label className="text-xs text-slate-500 font-bold mb-1 block">Throw</label><select className="w-full p-2 border rounded text-sm" value={playerForm.throwHand} onChange={e => setPlayerForm({...playerForm, throwHand: e.target.value as any})}><option value="R">R</option><option value="L">L</option></select></div>
                        <div className="w-1/2"><label className="text-xs text-slate-500 font-bold mb-1 block">Bat</label><select className="w-full p-2 border rounded text-sm" value={playerForm.batHand} onChange={e => setPlayerForm({...playerForm, batHand: e.target.value as any})}><option value="R">R</option><option value="L">L</option><option value="S">S</option></select></div>
                    </div>
                    <div className="col-span-2 md:col-span-4"><label className="text-xs text-slate-500 font-bold mb-1 block">Secondary Positions</label><div className="flex flex-wrap gap-1">{POSITIONS_LIST.filter(p => p !== playerForm.primaryPosition && p !== Position.BENCH).map(p => <button key={p} onClick={() => toggleSecondaryPosition(p)} className={`text-[10px] px-2 py-1 rounded border transition-colors ${playerForm.secondaryPositions?.includes(p) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200'}`}>{p}</button>)}</div></div>
                </div>
              </div>
          )}

          {/* HITTING TAB */}
          {formTab === 'hitting' && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in">
                 <div className="col-span-2 md:col-span-4 text-xs font-bold text-indigo-600 border-b pb-1 mb-2">Standard Stats</div>
                 <StatInput label="AVG" field="battingAvg" step="0.001" />
                 <StatInput label="OBP" field="onBasePct" step="0.001" />
                 <StatInput label="SLG" field="sluggingPct" step="0.001" />
                 <StatInput label="OPS" field="ops" step="0.001" />
                 <StatInput label="Hits (H)" field="hits" />
                 <StatInput label="Home Runs (HR)" field="homeRuns" />
                 <StatInput label="RBI" field="rbi" />
                 <StatInput label="Stolen Bases (SB)" field="stolenBases" />

                 <div className="col-span-2 md:col-span-4 text-xs font-bold text-purple-600 border-b pb-1 mb-2 mt-4">Advanced Stats</div>
                 <StatInput label="ISO" field="iso" step="0.001" />
                 <StatInput label="BABIP" field="babip" step="0.001" />
                 <StatInput label="wOBA" field="wOBA" step="0.001" />
                 <StatInput label="wRC+" field="wRCPlus" />
                 <StatInput label="Strikeout %" field="strikeoutRate" step="0.1" />
                 <StatInput label="Walk %" field="walkRate" step="0.1" />
                 <StatInput label="Hard Hit %" field="hardHitPct" step="0.1" />
                 <StatInput label="Line Drive %" field="lineDrivePct" step="0.1" />
              </div>
          )}

          {/* PITCHING TAB */}
          {formTab === 'pitching' && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in">
                 <div className="col-span-2 md:col-span-4 text-xs font-bold text-emerald-600 border-b pb-1 mb-2">Standard Stats</div>
                 <StatInput label="Wins (W)" field="wins" />
                 <StatInput label="Losses (L)" field="losses" />
                 <StatInput label="ERA" field="era" step="0.01" />
                 <StatInput label="WHIP" field="whip" step="0.01" />
                 <StatInput label="Games (G)" field="gamesPlayed" />
                 <StatInput label="Saves (SV)" field="saves" />
                 <StatInput label="Innings (IP)" field="inningsPitched" step="0.1" />
                 <StatInput label="Strikeouts (SO)" field="strikeouts" />

                 <div className="col-span-2 md:col-span-4 text-xs font-bold text-teal-600 border-b pb-1 mb-2 mt-4">Advanced Stats</div>
                 <StatInput label="FIP" field="fip" step="0.01" />
                 <StatInput label="xFIP" field="xFip" step="0.01" />
                 <StatInput label="K/9" field="kPer9" step="0.01" />
                 <StatInput label="BB/9" field="bbPer9" step="0.01" />
                 <StatInput label="HR/9" field="hrPer9" step="0.01" />
                 <StatInput label="BABIP (Pitch)" field="pitchingBabip" step="0.001" />
                 <StatInput label="LOB %" field="lobPct" step="0.1" />
                 <StatInput label="ERA+" field="eraPlus" />
              </div>
          )}

          {/* FIELDING TAB */}
          {formTab === 'fielding' && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in">
                 <div className="col-span-2 md:col-span-4 text-xs font-bold text-blue-600 border-b pb-1 mb-2">Standard Stats</div>
                 <StatInput label="Fielding %" field="fieldingPct" step="0.001" />
                 <StatInput label="Putouts (PO)" field="putouts" />
                 <StatInput label="Assists (A)" field="assists" />
                 <StatInput label="Errors (E)" field="fieldingErrors" />
                 <StatInput label="Double Plays (DP)" field="doublePlays" />
                 <StatInput label="Passed Balls (PB)" field="passedBalls" />
                 <StatInput label="Caught Stealing (CS)" field="caughtStealing" />
                 <StatInput label="SB Allowed" field="stolenBasesAllowed" />

                 <div className="col-span-2 md:col-span-4 text-xs font-bold text-cyan-600 border-b pb-1 mb-2 mt-4">Advanced Stats</div>
                 <StatInput label="Def Runs Saved (DRS)" field="drs" />
                 <StatInput label="UZR" field="uzr" step="0.1" />
                 <StatInput label="Outs Above Avg (OAA)" field="oaa" />
                 <StatInput label="Range Factor (RF)" field="rangeFactor" step="0.01" />
                 <StatInput label="Catcher ERA" field="catcherEra" step="0.01" />
                 <StatInput label="Pop Time (s)" field="popTime" step="0.01" />
                 <StatInput label="Framing Runs" field="framingRuns" step="0.1" />
                 <StatInput label="Arm Strength (1-100)" field="armStrength" />
                 
                 <div className="col-span-2 md:col-span-4 mt-4 text-xs font-bold text-slate-500">Ratings (1-10)</div>
                 <StatInput label="Speed Rating" field="speedRating" max={10} />
                 <StatInput label="Defense Rating" field="defenseRating" max={10} />
              </div>
          )}

          <div className="flex justify-end space-x-3 mt-6 border-t pt-4">
            <button onClick={resetForm} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg text-sm font-bold">Cancel</button>
            <button onClick={handleSavePlayer} className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-md text-sm font-bold">
                {editingId ? 'Update Player' : 'Save Player'}
            </button>
          </div>
        </div>
      )}

      {/* Roster Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-100">
        <table className="min-w-full text-left">
          <thead className="bg-slate-50">
            <tr className="border-b border-slate-200">
              <SortHeader label="#" sortKey="number" align="left" />
              <SortHeader label="Name" sortKey="name" align="left" />
              <SortHeader label="Pos" sortKey="primaryPosition" align="left" />
              <th className="py-3 px-2 text-xs font-bold text-slate-500 uppercase">B/T</th>
              
              {/* Dynamic Columns based on View Mode */}
              {viewMode === 'batting_std' && <>
                <SortHeader label="AVG" sortKey="battingAvg" />
                <SortHeader label="OBP" sortKey="onBasePct" />
                <SortHeader label="SLG" sortKey="sluggingPct" />
                <SortHeader label="OPS" sortKey="ops" tooltip={<InfoTooltip text="On-base Plus Slugging" align="right" side="bottom" />} />
                <SortHeader label="H" sortKey="hits" />
                <SortHeader label="HR" sortKey="homeRuns" />
                <SortHeader label="RBI" sortKey="rbi" />
                <SortHeader label="SB" sortKey="stolenBases" />
              </>}

              {viewMode === 'batting_adv' && <>
                <SortHeader label="ISO" sortKey="iso" />
                <SortHeader label="BABIP" sortKey="babip" />
                <SortHeader label="wOBA" sortKey="wOBA" />
                <SortHeader label="wRC+" sortKey="wRCPlus" />
                <SortHeader label="K%" sortKey="strikeoutRate" />
                <SortHeader label="BB%" sortKey="walkRate" />
                <SortHeader label="Hard%" sortKey="hardHitPct" />
                <SortHeader label="LD%" sortKey="lineDrivePct" />
              </>}

              {viewMode === 'pitching_std' && <>
                <SortHeader label="W" sortKey="wins" />
                <SortHeader label="L" sortKey="losses" />
                <SortHeader label="ERA" sortKey="era" />
                <SortHeader label="WHIP" sortKey="whip" />
                <SortHeader label="G" sortKey="gamesPlayed" />
                <SortHeader label="SV" sortKey="saves" />
                <SortHeader label="IP" sortKey="inningsPitched" />
                <SortHeader label="SO" sortKey="strikeouts" />
              </>}

              {viewMode === 'pitching_adv' && <>
                <SortHeader label="FIP" sortKey="fip" />
                <SortHeader label="xFIP" sortKey="xFip" />
                <SortHeader label="K/9" sortKey="kPer9" />
                <SortHeader label="BB/9" sortKey="bbPer9" />
                <SortHeader label="HR/9" sortKey="hrPer9" />
                <SortHeader label="BABIP" sortKey="pitchingBabip" />
                <SortHeader label="LOB%" sortKey="lobPct" />
                <SortHeader label="ERA+" sortKey="eraPlus" />
              </>}

              {viewMode === 'defense_std' && <>
                <SortHeader label="FPCT" sortKey="fieldingPct" />
                <SortHeader label="PO" sortKey="putouts" />
                <SortHeader label="A" sortKey="assists" />
                <SortHeader label="E" sortKey="fieldingErrors" />
                <SortHeader label="DP" sortKey="doublePlays" />
                <SortHeader label="PB" sortKey="passedBalls" />
                <SortHeader label="CS" sortKey="caughtStealing" />
                <SortHeader label="SB-A" sortKey="stolenBasesAllowed" />
              </>}

               {viewMode === 'defense_adv' && <>
                <SortHeader label="DRS" sortKey="drs" />
                <SortHeader label="UZR" sortKey="uzr" />
                <SortHeader label="OAA" sortKey="oaa" />
                <SortHeader label="RF" sortKey="rangeFactor" />
                <SortHeader label="CERA" sortKey="catcherEra" />
                <SortHeader label="Pop" sortKey="popTime" />
                <SortHeader label="Frm" sortKey="framingRuns" />
                <SortHeader label="Arm" sortKey="armStrength" />
              </>}
              
              <th className="py-3 px-4 font-semibold text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredRoster.map((player) => {
              const playerIsPitcher = isPitcher(player);
              return (
                <tr key={player.id} className="hover:bg-slate-50 transition-colors group cursor-pointer" onClick={() => setViewingPlayer(player)}>
                  <td className="py-3 px-2 font-mono text-slate-600 font-bold text-sm">{player.number}</td>
                  <td className="py-3 px-2 font-medium text-slate-800 flex items-center">
                    <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center mr-2 overflow-hidden ${playerIsPitcher ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 text-indigo-600'}`}>
                      {player.imageUrl ? <img src={player.imageUrl} className="w-full h-full object-cover" /> : <User className="w-4 h-4" />}
                    </div>
                    {player.name}
                  </td>
                  <td className="py-3 px-2 align-middle">
                     <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${player.primaryPosition === 'P' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-700 border-slate-200'}`}>{player.primaryPosition}</span>
                  </td>
                  <td className="py-3 px-2 text-xs text-slate-500">{player.batHand}/{player.throwHand}</td>
                  
                  {/* Dynamic Cells */}
                  {viewMode === 'batting_std' && <>
                    <td className="py-3 px-2 text-sm font-mono text-right">{player.battingAvg.toFixed(3).replace('0.', '.')}</td>
                    <td className="py-3 px-2 text-sm font-mono text-right text-slate-500">{player.onBasePct.toFixed(3).replace('0.', '.')}</td>
                    <td className="py-3 px-2 text-sm font-mono text-right text-slate-500">{player.sluggingPct.toFixed(3).replace('0.', '.')}</td>
                    <td className="py-3 px-2 text-sm font-mono text-right font-bold text-slate-700">{player.ops.toFixed(3).replace('0.', '.')}</td>
                    <td className="py-3 px-2 text-sm font-mono text-right text-slate-500">{player.hits}</td>
                    <td className="py-3 px-2 text-sm font-mono text-right text-slate-500">{player.homeRuns}</td>
                    <td className="py-3 px-2 text-sm font-mono text-right text-slate-500">{player.rbi}</td>
                    <td className="py-3 px-2 text-sm font-mono text-right text-slate-500">{player.stolenBases}</td>
                  </>}

                   {viewMode === 'batting_adv' && <>
                    <td className="py-3 px-2 text-sm font-mono text-right">{player.iso.toFixed(3).replace('0.', '.')}</td>
                    <td className="py-3 px-2 text-sm font-mono text-right">{player.babip.toFixed(3).replace('0.', '.')}</td>
                    <td className="py-3 px-2 text-sm font-mono text-right">{player.wOBA.toFixed(3).replace('0.', '.')}</td>
                    <td className="py-3 px-2 text-sm font-mono text-right font-bold">{player.wRCPlus}</td>
                    <td className="py-3 px-2 text-sm font-mono text-right">{player.strikeoutRate}%</td>
                    <td className="py-3 px-2 text-sm font-mono text-right">{player.walkRate}%</td>
                    <td className="py-3 px-2 text-sm font-mono text-right">{player.hardHitPct}%</td>
                    <td className="py-3 px-2 text-sm font-mono text-right">{player.lineDrivePct}%</td>
                  </>}

                   {viewMode === 'pitching_std' && <>
                    <td className="py-3 px-2 text-sm font-mono text-right">{player.wins}</td>
                    <td className="py-3 px-2 text-sm font-mono text-right">{player.losses}</td>
                    <td className="py-3 px-2 text-sm font-mono text-right font-bold">{player.era.toFixed(2)}</td>
                    <td className="py-3 px-2 text-sm font-mono text-right">{player.whip.toFixed(2)}</td>
                    <td className="py-3 px-2 text-sm font-mono text-right">{player.gamesPlayed}</td>
                    <td className="py-3 px-2 text-sm font-mono text-right">{player.saves}</td>
                    <td className="py-3 px-2 text-sm font-mono text-right">{player.inningsPitched}</td>
                    <td className="py-3 px-2 text-sm font-mono text-right">{player.strikeouts}</td>
                  </>}

                  {viewMode === 'pitching_adv' && <>
                    <td className="py-3 px-2 text-sm font-mono text-right">{player.fip.toFixed(2)}</td>
                    <td className="py-3 px-2 text-sm font-mono text-right">{player.xFip.toFixed(2)}</td>
                    <td className="py-3 px-2 text-sm font-mono text-right">{player.kPer9.toFixed(1)}</td>
                    <td className="py-3 px-2 text-sm font-mono text-right">{player.bbPer9.toFixed(1)}</td>
                    <td className="py-3 px-2 text-sm font-mono text-right">{player.hrPer9.toFixed(1)}</td>
                    <td className="py-3 px-2 text-sm font-mono text-right">{player.pitchingBabip.toFixed(3).replace('0.', '.')}</td>
                    <td className="py-3 px-2 text-sm font-mono text-right">{player.lobPct}%</td>
                    <td className="py-3 px-2 text-sm font-mono text-right">{player.eraPlus}</td>
                  </>}

                  {viewMode === 'defense_std' && <>
                    <td className="py-3 px-2 text-sm font-mono text-right">{player.fieldingPct.toFixed(3).replace('0.', '.')}</td>
                    <td className="py-3 px-2 text-sm font-mono text-right">{player.putouts}</td>
                    <td className="py-3 px-2 text-sm font-mono text-right">{player.assists}</td>
                    <td className="py-3 px-2 text-sm font-mono text-right text-red-500">{player.fieldingErrors}</td>
                    <td className="py-3 px-2 text-sm font-mono text-right">{player.doublePlays}</td>
                    <td className="py-3 px-2 text-sm font-mono text-right">{player.passedBalls}</td>
                    <td className="py-3 px-2 text-sm font-mono text-right">{player.caughtStealing}</td>
                    <td className="py-3 px-2 text-sm font-mono text-right">{player.stolenBasesAllowed}</td>
                  </>}

                  {viewMode === 'defense_adv' && <>
                    <td className="py-3 px-2 text-sm font-mono text-right">{player.drs}</td>
                    <td className="py-3 px-2 text-sm font-mono text-right">{player.uzr.toFixed(1)}</td>
                    <td className="py-3 px-2 text-sm font-mono text-right">{player.oaa}</td>
                    <td className="py-3 px-2 text-sm font-mono text-right">{player.rangeFactor.toFixed(2)}</td>
                    <td className="py-3 px-2 text-sm font-mono text-right">{player.catcherEra > 0 ? player.catcherEra.toFixed(2) : '-'}</td>
                    <td className="py-3 px-2 text-sm font-mono text-right">{player.popTime > 0 ? player.popTime.toFixed(2) : '-'}</td>
                    <td className="py-3 px-2 text-sm font-mono text-right">{player.framingRuns > 0 ? player.framingRuns.toFixed(1) : '-'}</td>
                    <td className="py-3 px-2 text-sm font-mono text-right">{player.armStrength}</td>
                  </>}

                  <td className="py-3 px-4 text-right">
                    <div className="flex justify-end space-x-2">
                        <button onClick={(e) => { e.stopPropagation(); setSelectedSeamStatsPlayer(player); }} className="text-amber-500 hover:text-amber-600 p-1"><BarChart2 className="w-4 h-4" /></button>
                        <button onClick={(e) => { e.stopPropagation(); startEditing(player); }} className="text-slate-400 hover:text-indigo-600 p-1"><Pencil className="w-4 h-4" /></button>
                        <button onClick={(e) => { e.stopPropagation(); removePlayer(player.id); }} className="text-slate-400 hover:text-red-500 p-1"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RosterManager;

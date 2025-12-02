import React, { useState, useRef } from 'react';
import { Standing } from '../types';
import { Trophy, Upload, Plus, Trash2, ArrowUp, ArrowDown, FileSpreadsheet } from 'lucide-react';

interface StandingsManagerProps {
  standings: Standing[];
  setStandings: React.Dispatch<React.SetStateAction<Standing[]>>;
}

const StandingsManager: React.FC<StandingsManagerProps> = ({ standings, setStandings }) => {
  const [isAdding, setIsAdding] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newTeam, setNewTeam] = useState<Partial<Standing>>({
    teamName: '',
    wins: 0,
    losses: 0,
    ties: 0
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Simulate file parsing logic
      alert(`Simulating import of standings from ${file.name}...`);
      setTimeout(() => {
        // Mock updated standings from a "file"
        const mockImportedStandings: Standing[] = [
           { id: '101', rank: 1, teamName: 'Imported Leaders', wins: 20, losses: 1, ties: 0, winPct: .952, gamesBack: 0 },
           { id: '102', rank: 2, teamName: 'SeamStrike Elite', wins: 15, losses: 5, ties: 0, winPct: .750, gamesBack: 5 },
           { id: '103', rank: 3, teamName: 'File Parsers', wins: 10, losses: 10, ties: 0, winPct: .500, gamesBack: 10 },
        ];
        setStandings(mockImportedStandings);
        alert("Standings updated from file!");
      }, 1000);
    }
  };

  const calculatePct = (w: number, l: number, t: number) => {
    const total = w + l + t;
    if (total === 0) return 0;
    return (w + (t * 0.5)) / total;
  };

  const handleAddTeam = () => {
    if (!newTeam.teamName) return;
    
    const pct = calculatePct(newTeam.wins || 0, newTeam.losses || 0, newTeam.ties || 0);
    
    const team: Standing = {
        id: Date.now().toString(),
        rank: standings.length + 1, // temporary rank
        teamName: newTeam.teamName,
        wins: newTeam.wins || 0,
        losses: newTeam.losses || 0,
        ties: newTeam.ties || 0,
        winPct: pct,
        gamesBack: 0 // Would need full recalculation logic
    };

    // Sort and recalculate rank/GB would go here in a real app
    const updated = [...standings, team].sort((a, b) => b.winPct - a.winPct);
    // Basic re-rank
    updated.forEach((t, idx) => {
        t.rank = idx + 1;
        // Simple GB calc relative to first place
        if (idx === 0) {
            t.gamesBack = 0;
        } else {
            const leader = updated[0];
            const leaderDiff = leader.wins - leader.losses;
            const teamDiff = t.wins - t.losses;
            t.gamesBack = (leaderDiff - teamDiff) / 2;
        }
    });

    setStandings(updated);
    setIsAdding(false);
    setNewTeam({ teamName: '', wins: 0, losses: 0, ties: 0 });
  };

  const removeTeam = (id: string) => {
    setStandings(standings.filter(s => s.id !== id));
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 h-full flex flex-col">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 space-y-4 md:space-y-0">
        <div>
           <h2 className="text-2xl font-bold text-slate-800 flex items-center">
             <Trophy className="w-6 h-6 mr-2 text-amber-500" />
             League Standings
           </h2>
           <p className="text-slate-500 text-sm">Track division leaders and playoff picture</p>
        </div>
       
        <div className="flex space-x-3">
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept=".csv,.xlsx,.pdf" 
            onChange={handleFileUpload}
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="bg-white text-slate-600 border border-slate-300 px-4 py-2 rounded-lg hover:bg-slate-50 flex items-center shadow-sm transition-all"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Standings
          </button>
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center shadow-lg transition-all"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Team
          </button>
        </div>
      </div>

      {isAdding && (
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6 flex flex-col md:flex-row gap-4 items-end animate-fade-in">
             <div className="flex-grow">
                 <label className="text-xs font-bold text-slate-500 uppercase">Team Name</label>
                 <input className="w-full p-2 border rounded mt-1" placeholder="Team Name" value={newTeam.teamName} onChange={e => setNewTeam({...newTeam, teamName: e.target.value})} />
             </div>
             <div className="w-20">
                 <label className="text-xs font-bold text-slate-500 uppercase">Wins</label>
                 <input type="number" className="w-full p-2 border rounded mt-1" value={newTeam.wins} onChange={e => setNewTeam({...newTeam, wins: parseInt(e.target.value)})} />
             </div>
             <div className="w-20">
                 <label className="text-xs font-bold text-slate-500 uppercase">Losses</label>
                 <input type="number" className="w-full p-2 border rounded mt-1" value={newTeam.losses} onChange={e => setNewTeam({...newTeam, losses: parseInt(e.target.value)})} />
             </div>
             <div className="w-20">
                 <label className="text-xs font-bold text-slate-500 uppercase">Ties</label>
                 <input type="number" className="w-full p-2 border rounded mt-1" value={newTeam.ties} onChange={e => setNewTeam({...newTeam, ties: parseInt(e.target.value)})} />
             </div>
             <button onClick={handleAddTeam} className="bg-indigo-600 text-white px-4 py-2 rounded h-10 hover:bg-indigo-700">Add</button>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-slate-100 flex-grow">
        <table className="min-w-full text-left">
            <thead className="bg-slate-900 text-white">
                <tr>
                    <th className="py-3 px-4 w-12 text-center">RK</th>
                    <th className="py-3 px-4">Team</th>
                    <th className="py-3 px-4 w-20 text-center">W</th>
                    <th className="py-3 px-4 w-20 text-center">L</th>
                    <th className="py-3 px-4 w-20 text-center">T</th>
                    <th className="py-3 px-4 w-24 text-right">PCT</th>
                    <th className="py-3 px-4 w-20 text-right">GB</th>
                    <th className="py-3 px-4 w-16"></th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {standings.map((team, idx) => (
                    <tr key={team.id} className={`hover:bg-slate-50 transition-colors ${idx < 2 ? 'bg-indigo-50/30' : ''}`}>
                        <td className="py-3 px-4 text-center font-bold text-slate-500">{team.rank}</td>
                        <td className="py-3 px-4 font-bold text-slate-800 flex items-center">
                             {idx === 0 && <Trophy className="w-4 h-4 text-amber-500 mr-2" />}
                             {team.teamName}
                        </td>
                        <td className="py-3 px-4 text-center">{team.wins}</td>
                        <td className="py-3 px-4 text-center text-slate-500">{team.losses}</td>
                        <td className="py-3 px-4 text-center text-slate-500">{team.ties}</td>
                        <td className="py-3 px-4 text-right font-mono">{team.winPct.toFixed(3).replace('0.', '.')}</td>
                        <td className="py-3 px-4 text-right font-mono text-slate-500">{team.gamesBack === 0 ? '-' : team.gamesBack}</td>
                        <td className="py-3 px-4 text-right">
                            <button onClick={() => removeTeam(team.id)} className="text-slate-300 hover:text-red-500">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
        {standings.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                <FileSpreadsheet className="w-12 h-12 mb-3 opacity-20" />
                <p>No standings data.</p>
                <button onClick={() => fileInputRef.current?.click()} className="text-indigo-600 hover:underline mt-2">Upload CSV/PDF</button>
            </div>
        )}
      </div>
    </div>
  );
};

export default StandingsManager;
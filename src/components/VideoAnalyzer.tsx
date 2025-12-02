
import React, { useState, useRef } from 'react';
import { LeagueSettings, SubscriptionTier } from '../types';
import { analyzeCoachingVideo } from '../services/geminiService.ts';
import { Video, Upload, Play, Loader2, Lock, CheckCircle2, Film, AlertCircle } from 'lucide-react';
import InfoTooltip from './InfoTooltip';

interface VideoAnalyzerProps {
  league: LeagueSettings;
  subscriptionTier: SubscriptionTier;
  onUpgrade: (tier: SubscriptionTier) => void;
}

const ANALYSIS_TYPES = [
    "Pitching Mechanics",
    "Batting Swing Analysis",
    "Defensive Footwork",
    "Catcher Mechanics",
    "Base Running Form"
];

const VideoAnalyzer: React.FC<VideoAnalyzerProps> = ({ league, subscriptionTier, onUpgrade }) => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [analysisType, setAnalysisType] = useState(ANALYSIS_TYPES[0]);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasAccess = subscriptionTier === 'ProMonthly' || subscriptionTier === 'ProAnnual';

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          if (file.size > 10 * 1024 * 1024) { // 10MB Limit for client-side base64 safety in this demo
              alert("File too large for web demo. Please select a clip under 10MB.");
              return;
          }
          setVideoFile(file);
          const url = URL.createObjectURL(file);
          setVideoPreview(url);
          setResult(""); // Clear previous results
      }
  };

  const handleAnalyze = async () => {
      if (!videoFile) return;

      setLoading(true);
      
      // Convert to Base64
      const reader = new FileReader();
      reader.readAsDataURL(videoFile);
      reader.onloadend = async () => {
          const base64String = reader.result as string;
          // Strip header (e.g. "data:video/mp4;base64,")
          const base64Data = base64String.split(',')[1];
          const mimeType = videoFile.type;

          const analysis = await analyzeCoachingVideo(base64Data, mimeType, analysisType, league);
          setResult(analysis);
          setLoading(false);
      };
      reader.onerror = () => {
          alert("Error processing file");
          setLoading(false);
      };
  };

  if (!hasAccess) {
      return (
          <div className="h-full flex items-center justify-center p-6 bg-slate-50">
              <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden text-center">
                  <div className="bg-slate-900 p-8 flex flex-col items-center justify-center relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl transform translate-x-10 -translate-y-10"></div>
                      <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg mb-4 relative z-10">
                          <Video className="w-8 h-8 text-white" />
                      </div>
                      <h2 className="text-2xl font-extrabold text-white mb-2">Video Analysis Studio</h2>
                      <p className="text-indigo-200 text-sm">AI-Powered Mechanical Breakdown</p>
                  </div>
                  
                  <div className="p-8">
                      <p className="text-slate-600 mb-6">
                          Upload game footage or practice clips and get instant, pro-level mechanical analysis for pitching, hitting, and defense.
                      </p>
                      
                      <div className="space-y-3 mb-8 text-left bg-slate-50 p-4 rounded-xl border border-slate-100">
                          <div className="flex items-center text-sm text-slate-700">
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 mr-3" />
                              Pitching Mechanics & Delivery
                          </div>
                          <div className="flex items-center text-sm text-slate-700">
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 mr-3" />
                              Swing Path Analysis
                          </div>
                          <div className="flex items-center text-sm text-slate-700">
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 mr-3" />
                              Automated Drill Recommendations
                          </div>
                      </div>

                      <button 
                          onClick={() => onUpgrade('ProMonthly')}
                          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center"
                      >
                          <Lock className="w-4 h-4 mr-2" />
                          Unlock with Pro
                      </button>
                      <p className="mt-3 text-xs text-slate-400">Available in Monthly & Annual Pro Plans</p>
                  </div>
              </div>
          </div>
      );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
        {/* Upload & Preview Panel */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col">
            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
                <Film className="w-6 h-6 mr-2 text-indigo-600" />
                Upload Footage
            </h2>

            <div className="flex-grow flex flex-col items-center justify-center min-h-[300px] bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl relative overflow-hidden group">
                {videoPreview ? (
                    <video 
                        src={videoPreview} 
                        controls 
                        className="w-full h-full object-contain max-h-[400px]" 
                    />
                ) : (
                    <div className="text-center p-8">
                        <div className="w-16 h-16 bg-indigo-100 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                            <Upload className="w-8 h-8" />
                        </div>
                        <p className="text-slate-600 font-medium mb-1">Click to upload video</p>
                        <p className="text-xs text-slate-400">MP4, MOV up to 10MB</p>
                    </div>
                )}
                
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileSelect} 
                    accept="video/*" 
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    disabled={loading}
                />
            </div>

            {videoFile && (
                <div className="mt-4 flex flex-col gap-4">
                     <div className="flex justify-between items-center bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                         <span className="text-sm font-medium text-indigo-900 truncate max-w-[200px]">
                             {videoFile.name}
                         </span>
                         <button 
                            onClick={() => {
                                setVideoFile(null);
                                setVideoPreview(null);
                                setResult("");
                            }}
                            className="text-xs text-red-500 hover:text-red-700 font-bold"
                         >
                             Remove
                         </button>
                     </div>

                     <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Analysis Focus</label>
                        <select 
                            value={analysisType}
                            onChange={(e) => setAnalysisType(e.target.value)}
                            className="w-full p-3 bg-white border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                            disabled={loading}
                        >
                            {ANALYSIS_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                     </div>

                     <button 
                        onClick={handleAnalyze}
                        disabled={loading}
                        className="w-full py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-bold rounded-lg shadow-md hover:from-indigo-700 hover:to-indigo-800 transition-all flex items-center justify-center disabled:opacity-70"
                     >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Analyzing Mechanics...
                            </>
                        ) : (
                            <>
                                <Play className="w-5 h-5 mr-2 fill-white" />
                                Analyze Video
                            </>
                        )}
                     </button>
                     
                     <p className="text-center text-xs text-slate-400 flex items-center justify-center">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Analysis may take 10-20 seconds
                     </p>
                </div>
            )}
        </div>

        {/* Results Panel */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col h-full min-h-[500px]">
             <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
                <span>AI Feedback</span>
                {result && <span className="text-xs font-normal bg-emerald-100 text-emerald-700 px-2 py-1 rounded">Analysis Complete</span>}
             </h2>

             {result ? (
                 <div className="prose prose-slate max-w-none flex-grow overflow-y-auto">
                     <div dangerouslySetInnerHTML={{ __html: result.replace(/\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, '<strong class="text-indigo-700">$1</strong>') }} />
                 </div>
             ) : (
                 <div className="flex flex-col items-center justify-center flex-grow text-slate-400 opacity-60">
                     <Video className="w-20 h-20 mb-4 stroke-1" />
                     <p className="text-lg">Waiting for analysis...</p>
                     <p className="text-sm">Upload a video to get started.</p>
                 </div>
             )}
        </div>
    </div>
  );
};

export default VideoAnalyzer;

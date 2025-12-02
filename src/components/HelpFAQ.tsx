
import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, MessageCircle, Shield, Lock, FileText, Video, Users, LayoutDashboard, Calendar, CloudRain } from 'lucide-react';

interface FaqItem {
  question: string;
  answer: string;
}

interface FaqSection {
  title: string;
  icon: React.ElementType;
  items: FaqItem[];
}

const FAQ_DATA: FaqSection[] = [
  {
    title: "General & Account",
    icon: LayoutDashboard,
    items: [
      {
        question: "What leagues does SeamStrike support?",
        answer: "SeamStrike supports all levels of play for both Baseball and Softball, from 8U Travel/Rec through Scholastic (High School/College) and Collegiate levels. You can configure the specific level and sport in the Settings tab."
      },
      {
        question: "Can I manage multiple teams?",
        answer: "Yes. Use the 'Team Overview' card on the Dashboard to switch between different teams you manage (e.g., a 12U Baseball team and a 14U Softball team). Each team maintains its own roster, schedule, and standings."
      },
      {
        question: "How do I enable Dark Mode?",
        answer: "Navigate to the Settings tab and use the appearance toggle (Sun/Moon icon) to switch between Light and Dark modes. This is ideal for reducing glare during night games."
      }
    ]
  },
  {
    title: "Game Mode & Tools",
    icon: FileText,
    items: [
      {
        question: "What is SeamScore™?",
        answer: "SeamScore is a premium feature that unlocks the real-time Lineup Card within Game Mode. It allows you to track the current batter, on-deck batter, hole batter, and opponent pitch counts in real-time. It is available via the Season Pass or a single-game purchase."
      },
      {
        question: "How do the Manual Builders work?",
        answer: "In both Lineup and Defense builders, you can toggle between 'AI Auto-Gen' and 'Interactive' modes. Interactive mode allows you to manually drag or select players for specific slots. The system provides real-time conflict detection (e.g., a player sitting too many innings) but allows you to override these rules."
      },
      {
        question: "How do I use the Whiteboard?",
        answer: "In Game Mode, select the 'Whiteboard' tab. Use the drawing tools to diagram plays or adjustments live. You can toggle between a blank canvas and a field diagram background corresponding to your sport (Baseball/Softball)."
      }
    ]
  },
  {
    title: "Training & Analysis",
    icon: Video,
    items: [
      {
        question: "How does Video Analysis work?",
        answer: "Upload a short video clip (max 10MB) of a player pitching, hitting, or fielding in the Video Analysis tab. Our AI breaks down the mechanics, identifies inefficiencies (like timing or balance), and suggests corrective drills. This is a Pro-tier feature."
      },
      {
        question: "Can I create individual workouts?",
        answer: "Yes. In the Practice Planner, switch to the 'Individual' tab. Select a player and the AI will generate a tailored workout based on their specific stats (e.g., struggling with curveballs) and position."
      },
      {
        question: "What is SeamStats™?",
        answer: "SeamStats provides advanced visual analytics for your roster. This includes Spray Charts for hitters, Pitch Arsenals (velocity/usage) for pitchers, and season-long trend lines for key metrics like OPS and ERA."
      }
    ]
  },
  {
    title: "Season Management",
    icon: Calendar,
    items: [
      {
        question: "What is included in the Season Manager?",
        answer: "The Season Manager is a unified hub available to Season Pass and Pro subscribers. It combines your Calendar (Games, Practices, Tournaments) and League Standings into one view. It allows you to track wins/losses, manage events, and view weather forecasts."
      },
      {
        question: "How does AI Calendar Strategy work?",
        answer: "Located in the 'AI Optimization' tab of the Season Manager, this feature analyzes your schedule density, travel requirements, and opponent difficulty. It suggests optimal rest days and schedule adjustments to minimize player fatigue and maximize performance."
      },
      {
        question: "Does the app track weather?",
        answer: "Yes. Every event added to the Season Manager automatically includes a 'Game Day Weather' forecast (Simulated) based on the date and location, including temperature, precipitation chance, and a link to a radar view."
      }
    ]
  },
  {
    title: "Privacy & Data Policy",
    icon: Shield,
    items: [
      {
        question: "How is my team's data used?",
        answer: "We prioritize your privacy. Roster data, game stats, and strategies are stored securely and used solely to provide coaching insights for your account. We do not share your team's tactical data with third parties."
      },
      {
        question: "Is video upload secure?",
        answer: "Yes. Videos uploaded for analysis are processed transiently by our AI engine to generate the mechanical report. We do not permanently store raw user video footage on our servers to ensure player privacy."
      },
      {
        question: "Who owns the generated content?",
        answer: "You maintain ownership of all practice plans, lineup strategies, and scouting reports generated by the app. You are free to download, print, and distribute them to your team."
      }
    ]
  }
];

const HelpFAQ: React.FC = () => {
  const [openSection, setOpenSection] = useState<number | null>(0);

  const toggleSection = (index: number) => {
    setOpenSection(openSection === index ? null : index);
  };

  return (
    <div className="max-w-4xl mx-auto h-full flex flex-col">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center">
            <HelpCircle className="w-8 h-8 mr-3 text-indigo-600 dark:text-indigo-400" />
            Help Center & FAQ
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">Find answers to common questions about managing your team with SeamStrike.</p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex-grow overflow-y-auto">
        {FAQ_DATA.map((section, idx) => (
            <div key={idx} className="border-b border-slate-100 dark:border-slate-800 last:border-0">
                <button 
                    onClick={() => toggleSection(idx)}
                    className="w-full flex items-center justify-between p-6 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left focus:outline-none"
                >
                    <div className="flex items-center">
                        <div className={`p-2 rounded-lg mr-4 ${openSection === idx ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                            <section.icon className="w-5 h-5" />
                        </div>
                        <span className="text-lg font-bold text-slate-800 dark:text-white">{section.title}</span>
                    </div>
                    {openSection === idx ? <ChevronUp className="text-indigo-600 dark:text-indigo-400" /> : <ChevronDown className="text-slate-400" />}
                </button>
                
                {openSection === idx && (
                    <div className="px-6 pb-6 bg-slate-50/50 dark:bg-slate-950/30">
                        <div className="space-y-4">
                            {section.items.map((item, i) => (
                                <div key={i} className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                                    <h4 className="font-bold text-indigo-900 dark:text-indigo-300 mb-2 flex items-start text-sm md:text-base">
                                        <MessageCircle className="w-4 h-4 mr-2 mt-1 text-indigo-500 flex-shrink-0" />
                                        {item.question}
                                    </h4>
                                    <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed pl-6">
                                        {item.answer}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        ))}
      </div>
      
      <div className="mt-8 bg-indigo-900 text-white p-6 rounded-xl flex flex-col md:flex-row items-center justify-between shadow-lg">
          <div>
              <h3 className="text-lg font-bold flex items-center">
                  <Lock className="w-5 h-5 mr-2 text-indigo-300" />
                  Secure & Private
              </h3>
              <p className="text-indigo-200 text-sm mt-1">Your team's data is encrypted and protected.</p>
          </div>
          <button className="mt-4 md:mt-0 bg-white text-indigo-900 px-6 py-2 rounded-lg font-bold hover:bg-indigo-50 transition-colors">
              Contact Support
          </button>
      </div>
    </div>
  );
};

export default HelpFAQ;

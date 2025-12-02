import { GoogleGenAI } from "@google/genai";
import { Player, GameState, LeagueSettings, PracticePlanRequest, DefenseRule, IndividualWorkoutRequest, ScheduleEvent, Standing, CalendarStrategy } from '../types';

// Initialize Gemini
// Ensure process.env.API_KEY is available in your environment variables
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_NAME = 'gemini-2.5-flash';

export const getStrategyAdvice = async (
  gameState: GameState,
  league: LeagueSettings,
  userPrompt?: string
): Promise<string> => {
  try {
    const prompt = `
      You are an expert baseball/softball coach assistant named SeamStrike.
      
      Current League Context: ${league.level} (${league.name}).
      Rules Note: ${league.rulesContext}.
      
      Game State:
      - Inning: ${gameState.isTop ? 'Top' : 'Bottom'} of ${gameState.inning}
      - Score: Us ${gameState.scoreUs} - Them ${gameState.scoreThem}
      - Outs: ${gameState.outs}
      - Count: ${gameState.balls} Balls, ${gameState.strikes} Strikes
      - Runners: ${gameState.runners.first ? '1st' : ''} ${gameState.runners.second ? '2nd' : ''} ${gameState.runners.third ? '3rd' : ''}
      
      User Specific Question: ${userPrompt || "What is the best strategic move right now? Consider offense and defense."}
      
      Provide a concise, bulleted list of strategic options with probabilities of success if estimated. Keep it actionable for a coach in the dugout. Use proper pronouns (he/she/they) if referring to specific players mentioned.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        systemInstruction: "You are SeamStrike, an elite baseball strategist who is direct, data-driven, and proactive.",
      }
    });

    return response.text || "Unable to generate strategy at this time.";
  } catch (error) {
    console.error("Gemini Strategy Error:", error);
    return "Error connecting to SeamStrike Strategy Engine. Please check your connection.";
  }
};

export const generateLineupAnalysis = async (
  roster: Player[],
  league: LeagueSettings,
  strategyType: string,
  batterCount: number
): Promise<string> => {
  try {
    const rosterStr = roster.map(p => 
      `${p.name} (#${p.number}): Gender=${p.gender}, Pos=${p.primaryPosition}, Avg=${p.battingAvg.toFixed(3)}, OPS=${p.ops.toFixed(3)}, ERA=${p.era.toFixed(2)}, Spd=${p.speedRating}, Bat=${p.batHand}`
    ).join('\n');

    const prompt = `
      Analyze this roster and suggest an optimized batting lineup based on the strategy: "${strategyType}".
      
      Context:
      - League Level: ${league.level}
      - Rules: ${league.rulesContext}
      - Lineup Size: Strictly ${batterCount} batters.
      
      Roster Stats:
      ${rosterStr}
      
      Output Format:
      1. Recommended Lineup (Ordered 1 to ${batterCount}). Ensure exactly ${batterCount} players are listed in the batting order.
      2. Key reasoning for the top 4 hitters. Use correct pronouns (${roster[0]?.gender === 'Female' ? 'she/her' : 'he/him/they'} etc) based on the gender provided for each player.
      3. **Recommendations to Strengthen**: Critically analyze the lineup generated from the provided strategy. Identify potential weak spots (e.g., clustering low OBP, lack of speed) and suggest specific adjustments or improvements to make the lineup more formidable.
      4. Defensive positioning notes if relevant.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });

    return response.text || "Analysis failed.";
  } catch (error) {
    console.error("Gemini Lineup Error:", error);
    return "Unable to analyze lineup at this time.";
  }
};

export const getScoutingReport = async (
  notes: string,
  league: LeagueSettings
): Promise<string> => {
  try {
    const prompt = `
      Create a competitive scouting report based on these raw notes about an opponent team.
      
      League Level: ${league.level}
      Raw Notes: "${notes}"
      
      Identify:
      1. Key Threats
      2. Exploitable Weaknesses
      3. Suggested Pitching Plan
      4. Suggested Defensive Shifts/Adjustments
      
      Use inclusive and professional language.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });

    return response.text || "No report generated.";
  } catch (error) {
    console.error("Gemini Scouting Error:", error);
    return "Error generating report.";
  }
};

export const generatePracticePlan = async (
  request: PracticePlanRequest,
  league: LeagueSettings
): Promise<string> => {
  try {
    const prompt = `
      Create a comprehensive Practice Plan for a ${league.sport} team.
      
      Team Context:
      - Level: ${league.level}
      - Season Phase: ${request.seasonPhase}
      - Practices Available before next game: ${request.numPractices}
      
      Opponent Intel:
      - Next Opponent: ${request.opponentName || 'Unknown'}
      - Scouting Context: ${request.scoutingNotes || 'None'}
      
      Coach's Focus Areas:
      ${request.focusAreas}
      
      Output Requirements:
      - Break down the plan day-by-day (Day 1, Day 2, etc. based on available practices).
      - Include specific drills with time allocations (e.g., "15 mins: Bunt Defense").
      - tailor drills to exploit opponent weaknesses if scouting notes are provided.
      - formatted in clean Markdown.
      - Tone: Professional, high-energy, elite coaching. Use correct terminology for ${league.sport}.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });

    return response.text || "Unable to generate practice plan.";
  } catch (error) {
    console.error("Gemini Practice Plan Error:", error);
    return "Error generating practice plan.";
  }
};

export const generateIndividualWorkout = async (
  request: IndividualWorkoutRequest,
  playerStats: string,
  league: LeagueSettings
): Promise<string> => {
  try {
    const prompt = `
      Create a tailored individual workout plan for a ${league.sport} player.
      
      Player Profile:
      - Name: ${request.playerName}
      - Position: ${request.position}
      - League Level: ${league.level}
      - Relevant Stats: ${playerStats}
      
      Workout Parameters:
      - Focus Area: ${request.focusArea}
      - Intensity: ${request.intensity}
      - Duration: ${request.durationMinutes} minutes
      
      Requirements:
      1. Include a specific Warm-up relevant to the position.
      2. Detail 3-4 specific drills with rep counts or time limits.
      3. Explain the "Why" behind each drill (Skill Progression).
      4. Include Cool-down/Recovery.
      5. Include a brief medical disclaimer that this is for educational purposes.
      6. Address the player using correct pronouns based on context if known (default to 'the player' if not).
      
      Format: Clean Markdown.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });

    return response.text || "Unable to generate workout plan.";
  } catch (error) {
    console.error("Gemini Workout Error:", error);
    return "Error generating workout.";
  }
};

export const generateDefensiveRotation = async (
  roster: Player[],
  innings: number,
  activeRules: DefenseRule[],
  league: LeagueSettings
): Promise<string> => {
  try {
    const rosterStr = roster.map(p => 
      `${p.name} (Gender: ${p.gender}, Prim: ${p.primaryPosition}, Sec: ${p.secondaryPositions.join('/')}, DefRating: ${p.defenseRating}, Err: ${p.fieldingErrors})`
    ).join('\n');

    const rulesStr = activeRules.map(r => `- ${r.label}: ${r.description}`).join('\n');

    const prompt = `
      Create a defensive rotation matrix for a ${league.sport} game.
      
      Context:
      - Game Length: ${innings} Innings
      - Team Size: ${roster.length} Players
      - Fielders on Defense: ${league.fielderCount}
      
      Constraints / Rules to Follow:
      ${rulesStr}
      
      Roster:
      ${rosterStr}
      
      Task:
      Generate a table showing where every player plays for every inning.
      Ensure the rules are followed strictly.
      
      Output Format:
      1. A Summary of the plan.
      2. A Markdown Table where:
         - Rows are Players.
         - Columns are Innings (1 to ${innings}).
         - Cells contain the Position code (P, C, 1B, 2B, 3B, SS, LF, CF, RF, BN).
         - Use 'BN' for Bench.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });

    return response.text || "Unable to generate rotation.";
  } catch (error) {
    console.error("Gemini Defense Error:", error);
    return "Error generating defensive matrix.";
  }
};

export const analyzeCoachingVideo = async (
    videoBase64: string,
    mimeType: string,
    analysisType: string,
    league: LeagueSettings
): Promise<string> => {
    try {
        const prompt = `
            Analyze this video clip for a ${league.sport} player regarding ${analysisType}.
            
            Level: ${league.level}
            
            Please provide:
            1. Mechanical Breakdown (Key observations of the form).
            2. Identified Flaws or Inefficiencies (e.g., timing, balance, extension).
            3. 3 Specific Corrective Drills.
            4. Positive reinforcement on what they are doing well.
            
            Format as clear Markdown.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    {
                        inlineData: {
                            mimeType: mimeType,
                            data: videoBase64
                        }
                    },
                    { text: prompt }
                ]
            }
        });

        return response.text || "Unable to analyze video.";
    } catch (error) {
        console.error("Gemini Video Error:", error);
        return "Error processing video analysis. Ensure the file is a supported format and under size limits.";
    }
};

export const analyzeSeasonSchedule = async (
    schedule: ScheduleEvent[],
    roster: Player[],
    standings: Standing[],
    league: LeagueSettings
): Promise<CalendarStrategy> => {
    try {
        // Prepare simplified data for the model
        const scheduleStr = schedule.map(e => 
            `ID:${e.id}, Date:${e.date}, Time:${e.time}, Type:${e.type}, Opp:${e.opponent || 'N/A'}, Loc:${e.location}`
        ).join('\n');

        const standingsStr = standings.map(s => 
            `${s.teamName}: W${s.wins}-L${s.losses} (Rank ${s.rank})`
        ).join('\n');

        const prompt = `
            Analyze this ${league.sport} team's schedule and standings to create a "Calendar Strategy" to maximize performance.
            
            Team: ${league.name} (${league.level})
            
            Schedule:
            ${scheduleStr}
            
            Standings:
            ${standingsStr}
            
            Rules:
            - Practices lasting > 3 hours cause high fatigue.
            - Travel time between locations on same day > 30 mins causes fatigue.
            - Pitcher rest is critical.
            
            Task:
            1. Provide a strategic analysis (Markdown) of the schedule difficulty, travel impact, and rest opportunities.
            2. Suggest specific event modifications (e.g., "Move Practice on 10/24 to 10/25 for rest").
            3. Return a list of SPECIFIC ScheduleEvent objects that should be modified/added in JSON format.
            
            Output Schema (JSON):
            {
               "analysis": "Markdown text here...",
               "suggestions": [
                   {
                       "reason": "Move practice for rest",
                       "originalEventId": "id_if_exists_or_null",
                       "suggestedEvent": { ...ScheduleEvent object structure... }
                   }
               ]
            }
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json"
            }
        });

        const text = response.text ?? '';
        try {
            const result = text ? JSON.parse(text) : {
                analysis: "Unable to generate strategy. Please try again.",
                suggestions: []
            };
            return result as CalendarStrategy;
        } catch (parseErr) {
            console.error("Failed to parse Gemini Calendar response:", parseErr, "raw:", text);
            return {
                analysis: "Unable to generate strategy. Please try again.",
                suggestions: []
            };
        }

    } catch (error) {
        console.error("Gemini Calendar Strategy Error:", error);
        return {
            analysis: "Unable to generate strategy. Please try again.",
            suggestions: []
        };
    }
};

export const validateScheduleEvent = async (
    newEvent: Partial<ScheduleEvent>,
    currentSchedule: ScheduleEvent[]
): Promise<string | null> => {
    try {
        // Find adjacent events
        const sameDayEvents = currentSchedule.filter(e => e.date === newEvent.date && e.id !== newEvent.id);
        
        const context = `
            New Event: ${newEvent.type} at ${newEvent.time} on ${newEvent.date}. Loc: ${newEvent.location}.
            Existing Events on same day: ${JSON.stringify(sameDayEvents.map(e => ({ time: e.time, location: e.location, type: e.type })))}
        `;

        const prompt = `
            Analyze this schedule addition for potential conflicts or fatigue issues.
            
            ${context}
            
            Rules:
            1. Warn if events overlap or are too close (consider 2h duration for games, 1.5h for practice).
            2. Warn if practice starts very late (> 8PM) for youth.
            3. Warn if locations are different and time gap is < 45 mins.
            
            Output:
            Return ONLY a warning string if a problem exists. If no issues, return "OK".
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        
        const text = (response.text ?? '').trim();
        return text === "OK" || text === "" ? null : text;
    } catch (e) {
        return null; // Fail silent on validation error
    }
}
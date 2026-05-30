import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Award, Trophy, ShieldAlert, Check, RefreshCcw, Star, 
  HelpCircle, DollarSign, Calendar, Flame, FlameKindling, Zap 
} from 'lucide-react';
import { DailyQuest, PlayerProfile } from '../types';
import { playClickSound, playSuccessChime, triggerHaptic } from '../utils/sound';

interface QuestsAndLeaderboardProps {
  playerProfile: PlayerProfile;
  quests: DailyQuest[];
  onClaimQuest: (questId: string) => void;
  onRefreshQuests: () => void;
}

// Global leaderboard high-score simulation
interface LeaderboardRecord {
  rank: number;
  username: string;
  maxAuraId: string;
  totalRolls: number;
  totalScore: number;
  isCurrentUser: boolean;
}

export default function QuestsAndLeaderboard({ 
  playerProfile, 
  quests, 
  onClaimQuest, 
  onRefreshQuests 
}: QuestsAndLeaderboardProps) {
  const [activeSegment, setActiveSegment] = useState<'quests' | 'leaderboard'>('quests');

  // Let's generate a list of 10 competitive players
  const COMPETITORS: LeaderboardRecord[] = [
    { rank: 1, username: 'Quantum_RNG', maxAuraId: 'matrix', totalRolls: 842500, totalScore: 5000000, isCurrentUser: false },
    { rank: 2, username: 'ZenithAura', maxAuraId: 'gravitational', totalRolls: 512000, totalScore: 1000000, isCurrentUser: false },
    { rank: 3, username: 'LunarNexus', maxAuraId: 'lunar', totalRolls: 231400, totalScore: 50000, isCurrentUser: false },
    { rank: 4, username: 'Zephyr_X', maxAuraId: 'wind', totalRolls: 145000, totalScore: 5000, isCurrentUser: false },
    { rank: 5, username: playerProfile.username, maxAuraId: playerProfile.equippedAuraId ? playerProfile.inventory.find(i=>i.id === playerProfile.equippedAuraId)?.auraId || 'common' : 'common', totalRolls: playerProfile.stats.rolls, totalScore: playerProfile.stats.maxRarityRolled, isCurrentUser: true },
    { rank: 6, username: 'NebulaGlider', maxAuraId: 'celestial', totalRolls: 94500, totalScore: 10000, isCurrentUser: false },
    { rank: 7, username: 'OrbitSlinger', maxAuraId: 'quartz', totalRolls: 64100, totalScore: 1000, isCurrentUser: false },
    { rank: 8, username: 'SunSlayer_99', maxAuraId: 'golden_hour', totalRolls: 32000, totalScore: 500, isCurrentUser: false },
    { rank: 9, username: 'RNG_Rider', maxAuraId: 'diamond', totalRolls: 18400, totalScore: 256, isCurrentUser: false },
    { rank: 10, username: 'Beginner_Sol', maxAuraId: 'gilded', totalRolls: 3400, totalScore: 16, isCurrentUser: false }
  ];

  // Dynamic ranking filter sort
  const sortedCompetitors = COMPETITORS.sort((a,b) => b.totalScore - a.totalScore).map((record, index) => {
    return { ...record, rank: index + 1 };
  });

  const handleClaim = (questId: string) => {
    playSuccessChime();
    triggerHaptic(100);
    onClaimQuest(questId);
  };

  const activeQuestCount = quests.filter(q => !q.claimed).length;

  return (
    <div id="quests_and_leaderboard_box" className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-4 sm:p-6 shadow-xl flex flex-col space-y-4">
      {/* Title Segment */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-neutral-800 pb-3 gap-2">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-rose-950/40 border border-rose-500/20 text-rose-400 rounded-lg">
            <Trophy size={20} />
          </div>
          <div>
            <h3 className="font-bold text-lg text-neutral-100 flex items-center gap-1.5">
              Objectives & Leaderboards
              {activeQuestCount > 0 && (
                <span className="text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                  {activeQuestCount} Active Tasks
                </span>
              )}
            </h3>
            <p className="text-xs text-neutral-500 font-sans">Compete in global high score tables and claim rare sub-space modifiers hourly</p>
          </div>
        </div>

        {/* Dynamic Nav Tabs */}
        <div className="flex bg-neutral-950 p-1 rounded-xl border border-neutral-800">
          <button
            onClick={() => { playClickSound(); setActiveSegment('quests'); }}
            className={`text-xs px-3 py-1.5 rounded-lg transition font-medium flex items-center gap-1 ${
              activeSegment === 'quests'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/10'
                : 'text-neutral-400 hover:text-neutral-100'
            }`}
          >
            <Calendar size={12} /> Daily Quests
          </button>
          <button
            onClick={() => { playClickSound(); setActiveSegment('leaderboard'); }}
            className={`text-xs px-3 py-1.5 rounded-lg transition font-medium flex items-center gap-1 ${
              activeSegment === 'leaderboard'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/10'
                : 'text-neutral-400 hover:text-neutral-100'
            }`}
          >
            <Trophy size={12} /> Global Rankings
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeSegment === 'quests' ? (
          /* QUESTS PANEL */
          <motion.div
            key="quests_view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="flex justify-between items-center bg-neutral-950 p-3 rounded-xl border border-neutral-850">
              <div className="flex items-center space-x-2 text-xs text-neutral-400">
                <FlameKindling size={16} className="text-rose-400 animate-pulse" />
                <span>Gain temporary luck buffs on each complete daily quest claim!</span>
              </div>
              <button
                onClick={() => { playClickSound(); onRefreshQuests(); }}
                className="bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-neutral-200 text-[10px] uppercase font-mono px-2 py-1 rounded hover:bg-neutral-850 transition"
              >
                Reset Tasks
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {quests.map((quest) => {
                const percent = Math.min(100, Math.floor((quest.currentValue / quest.targetValue) * 100));
                const achieved = quest.currentValue >= quest.targetValue;

                return (
                  <div 
                    key={quest.id}
                    className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 flex flex-col justify-between space-y-3"
                  >
                    <div className="space-y-1">
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-xs font-bold text-neutral-200 font-sans leading-snug">{quest.description}</span>
                        <span className={`shrink-0 text-[9px] font-mono font-bold px-2 py-0.5 rounded ${
                          quest.claimed 
                            ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                            : achieved 
                              ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' 
                              : 'bg-neutral-900 text-neutral-500'
                        }`}>
                          {quest.claimed ? 'CLAIMED' : achieved ? 'READY' : 'ACTIVE'}
                        </span>
                      </div>
                      
                      <div className="flex justify-between text-[10px] text-neutral-500 font-mono">
                        <span>Progress: {percent}%</span>
                        <span>{quest.currentValue} / {quest.targetValue}</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-neutral-900 h-1.5 rounded-full overflow-hidden border border-neutral-850">
                      <div 
                        className={`h-full transition-all duration-300 ${quest.claimed ? 'bg-green-500' : 'bg-rose-500'}`}
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>

                    {/* Payout Details & Claim Button */}
                    <div className="flex justify-between items-center pt-2 mt-1 border-t border-neutral-900">
                      <div className="flex items-center space-x-2 text-[10px] text-neutral-400 font-mono">
                        <span className="flex items-center text-amber-400">
                          <DollarSign size={10} />+{quest.rewardCoins}
                        </span>
                        <span>|</span>
                        <span className="flex items-center text-green-400 gap-0.5">
                          <Zap size={10} />+{quest.rewardLuck * 100}% Luck
                        </span>
                      </div>

                      {quest.claimed ? (
                        <span className="text-[10px] font-mono text-neutral-500 flex items-center gap-0.5">
                          <Check size={10} className="text-green-500" /> Redeemed
                        </span>
                      ) : (
                        <button
                          onClick={() => handleClaim(quest.id)}
                          disabled={!achieved}
                          className="bg-rose-950/20 hover:bg-rose-600 disabled:opacity-30 border border-rose-500/20 hover:border-rose-500 py-1.5 px-3 text-[10px] font-mono text-rose-400 hover:text-white rounded-lg transition"
                        >
                          Redeem Reward
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        ) : (
          /* LEADERS PANEL */
          <motion.div
            key="leader_view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-neutral-800 text-neutral-500 font-mono uppercase text-[9px] tracking-wider">
                    <th className="py-2.5 px-3">Rank</th>
                    <th className="py-2.5 px-3">Username</th>
                    <th className="py-2.5 px-3">Signature Aura</th>
                    <th className="py-2.5 px-3">Roll Total</th>
                    <th className="py-2.5 px-3 text-right">Rarity Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-900">
                  {sortedCompetitors.map((record) => {
                    const isMedalist = record.rank <= 3;
                    const medalColor = record.rank === 1 ? 'text-amber-400' : record.rank === 2 ? 'text-slate-300' : 'text-amber-600';

                    return (
                      <tr 
                        key={record.username}
                        className={`hover:bg-neutral-950/50 transition duration-150 ${
                          record.isCurrentUser ? 'bg-indigo-600/10 font-medium' : ''
                        }`}
                      >
                        <td className="py-2 px-3 font-mono">
                          {isMedalist ? (
                            <span className={`inline-flex items-center gap-0.5 font-bold ${medalColor}`}>
                              <Star size={12} className="fill-current" /> {record.rank}
                            </span>
                          ) : (
                            record.rank
                          )}
                        </td>
                        <td className="py-2 px-3 flex items-center space-x-1">
                          <span className={`${record.isCurrentUser ? 'text-indigo-400 font-black' : 'text-neutral-200'}`}>
                            {record.username}
                          </span>
                          {record.isCurrentUser && (
                            <span className="text-[7.5px] font-mono px-1 bg-indigo-500/20 text-indigo-400 rounded-full font-bold uppercase tracking-widest scale-90">you</span>
                          )}
                        </td>
                        <td className="py-2 px-3 font-mono">
                          <span className="text-neutral-400 capitalize">
                            {record.maxAuraId.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-neutral-500 font-mono">
                          {record.totalRolls.toLocaleString()}
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-neutral-300 font-mono">
                          1:{record.totalScore.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

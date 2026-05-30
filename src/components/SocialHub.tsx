import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, Users, Send, ShieldAlert, Award, Grid, 
  Coins, Sparkles, Heart, Zap, Globe, CheckCircle2 
} from 'lucide-react';
import { ChatMessage, Team, PlayerProfile } from '../types';
import { playClickSound, playSuccessChime, triggerHaptic } from '../utils/sound';
import { AURAS, getAuraById } from '../data/auras';

interface SocialHubProps {
  playerProfile: PlayerProfile;
  chats: ChatMessage[];
  onAddChat: (msg: string) => void;
  onJoinTeam: (teamId: string) => void;
}

const TEAMS: Team[] = [
  {
    id: 'cosmos',
    name: 'Cosmic Alliance',
    color: 'text-purple-400',
    memberCount: 224,
    totalRankPoints: 1254000,
    description: 'Bending nebula particles. Focuses on luck augmentation modifiers.',
    faction: 'Cosmos'
  },
  {
    id: 'solar',
    name: 'Solar Keepers',
    color: 'text-amber-500',
    memberCount: 189,
    totalRankPoints: 1104300,
    description: 'Bursting flaring plasma. Specialized in speed rolling frequencies.',
    faction: 'Solar'
  },
  {
    id: 'lunar',
    name: 'Lunar Eclipse',
    color: 'text-cyan-400',
    memberCount: 215,
    totalRankPoints: 1198000,
    description: 'Stabilizing cooling deep tidal pull gravity to prevent glitch states.',
    faction: 'Lunar'
  },
  {
    id: 'void',
    name: 'Void Syndicate',
    color: 'text-rose-500',
    memberCount: 198,
    totalRankPoints: 1312500,
    description: 'Harnessing pure gravitational weight or dark matter matrix lines.',
    faction: 'Void'
  }
];

const BOT_MESSAGES = [
  "Does anyone have a spare Wind aura for trade? I am offering Emerald!",
  "Matrix aura is so clean, I saw a guy with it in active lobby yesterday.",
  "Just rolled Golden Hour on a 5x speed buff, let's go!!",
  "Is the Cosmic Alliance luck boost still active?",
  "I am searching for Gilded, offering 400 Coins. Head to Marketplace!",
  "Sol RNG feels incredibly smooth today. Loading times are instant.",
  "What is the maximum rarity rolled on the global dashboard?",
  "Gonna craft a supreme Heavenly Device tonight, wish me luck guys!"
];

const BOT_USERNAMES = [
  'Zephyr_X', 'LunarNexus', 'Vortex_Rider', 'Quantum_RNG', 
  'OrbitSlinger', 'AuraCollector99', 'SolarSlayer', 'CosmicChaser'
];

export default function SocialHub({ playerProfile, chats, onAddChat, onJoinTeam }: SocialHubProps) {
  const [activeTab, setActiveTab ] = useState<'chat' | 'teams'>('chat');
  const [inputMessage, setInputMessage] = useState<string>('');
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Auto Scroll Chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chats]);

  // Simulate automated incoming replies/room chat when active
  useEffect(() => {
    const timer = setInterval(() => {
      if (activeTab !== 'chat') return;

      // Select random bot
      const name = BOT_USERNAMES[Math.floor(Math.random() * BOT_USERNAMES.length)];
      const msg = BOT_MESSAGES[Math.floor(Math.random() * BOT_MESSAGES.length)];
      
      // Auto-trigger a system roll banner or peer chat
      if (Math.random() > 0.65) {
        // Roll notification
        const randomAura = AURAS[Math.floor(Math.random() * (AURAS.length - 8) + 8)]; // rare ones
        const announceMsg = `🌟 ${name} HAS UNLOCKED THE RARE [${randomAura.name}] AURA (1 in ${randomAura.probability.toLocaleString()})!!`;
        onAddChat(announceMsg); // Push using standard adder
      } else {
        // Simple chat message from bot
        const botChat: ChatMessage = {
          id: Math.random().toString(),
          username: name,
          message: msg,
          equippedAuraName: 'Common',
          equippedAuraColor: '#a3a3a3',
          timestamp: Date.now()
        };
        // Quick trigger hack to append bot message safely
        // Since we pass callback to parent we can route it beautifully
        onAddChat(`_bot_chat_:${JSON.stringify(botChat)}`);
      }
    }, 18000);

    return () => clearInterval(timer);
  }, [activeTab]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    playClickSound();
    onAddChat(inputMessage);

    // Dynamic AI chatbot reaction simulation
    const userText = inputMessage.toLowerCase();
    setInputMessage('');

    setTimeout(() => {
      let reply = '';
      if (userText.includes('trade') || userText.includes('swap')) {
        reply = "Hey! Let&apos;s check your terms. Go post your duplicates in the secure trading lobby.";
      } else if (userText.includes('luck') || userText.includes('roll')) {
        reply = "I definitely recommend joining Cosmic Alliance! Their passive luck multiplier is highly active.";
      } else if (userText.includes('how') || userText.includes('coin')) {
        reply = "You can earn coins by completing daily sub-space quests or recycling extra auras in Quick Sell.";
      } else if (userText.includes('rare') || userText.includes('sup')) {
        reply = "My highest is Celestial! Antigravity (1 in 10M) is the ultimate dream though.";
      }

      if (reply) {
        const botReply: ChatMessage = {
          id: Math.random().toString(),
          username: BOT_USERNAMES[Math.floor(Math.random() * BOT_USERNAMES.length)],
          message: reply,
          equippedAuraName: 'Rare',
          equippedAuraColor: '#60a5fa',
          timestamp: Date.now()
        };
        onAddChat(`_bot_chat_:${JSON.stringify(botReply)}`);
      }
    }, 1200);
  };

  const handleJoinTeamClick = (teamId: string) => {
    playSuccessChime();
    triggerHaptic(100);
    onJoinTeam(teamId);
  };

  const playerTeam = TEAMS.find(t => t.id === playerProfile.teamId);

  return (
    <div id="social_sub_system" className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-4 sm:p-6 shadow-xl flex flex-col space-y-4">
      {/* Tab Switch header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-neutral-800 pb-3 gap-2">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-950/40 border border-purple-500/20 text-purple-400 rounded-lg">
            <MessageSquare size={20} />
          </div>
          <div>
            <h3 className="font-bold text-lg text-neutral-100 flex items-center gap-1.5">
              Sub-Space Social Hub
              <span className="text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                Live Channels
              </span>
            </h3>
            <p className="text-xs text-neutral-500">Communicate with global players and coordinate cooperative faction team battles</p>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-neutral-950 p-1 rounded-xl border border-neutral-800">
          <button
            onClick={() => { playClickSound(); setActiveTab('chat'); }}
            className={`text-xs px-3 py-1.5 rounded-lg transition font-medium flex items-center gap-1.5 ${
              activeTab === 'chat'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/10'
                : 'text-neutral-400 hover:text-neutral-100'
            }`}
          >
            <MessageSquare size={12} /> Global Chat
          </button>
          <button
            onClick={() => { playClickSound(); setActiveTab('teams'); }}
            className={`text-xs px-3 py-1.5 rounded-lg transition font-medium flex items-center gap-1.5 ${
              activeTab === 'teams'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/10'
                : 'text-neutral-400 hover:text-neutral-100'
            }`}
          >
            <Users size={12} /> Factions ({playerProfile.teamId ? 'Joined' : 'Open'})
          </button>
        </div>
      </div>

      {/* Main Sandbox */}
      <AnimatePresence mode="wait">
        {activeTab === 'chat' ? (
          /* CHAT MODULE */
          <motion.div
            key="chat_sub"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col h-[300px] justify-between space-y-3"
          >
            {/* Messages box */}
            <div className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl p-3 overflow-y-auto space-y-2.5 max-h-[220px] scrollbar-thin">
              {chats.map((chat) => {
                const isAnnouncement = chat.message.startsWith('🌟');
                const isOwnChat = chat.username === playerProfile.username;

                if (isAnnouncement) {
                  return (
                    <div key={chat.id} className="p-1.5 rounded-lg bg-indigo-950/20 border border-indigo-500/10 text-center">
                      <p className="text-[10px] text-amber-300 font-mono tracking-wide">
                        {chat.message}
                      </p>
                    </div>
                  );
                }

                return (
                  <div key={chat.id} className={`flex flex-col ${isOwnChat ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-center space-x-1.5 mb-0.5">
                      <span className={`text-[10px] font-bold font-mono ${isOwnChat ? 'text-indigo-400' : 'text-neutral-400'}`}>
                        {chat.username}
                      </span>
                      {chat.equippedAuraName && (
                        <span 
                          className="text-[8px] px-1 py-0.2 rounded font-mono bg-neutral-900 border border-neutral-800 scale-90"
                          style={{ color: chat.equippedAuraColor }}
                        >
                          {chat.equippedAuraName}
                        </span>
                      )}
                    </div>
                    <div className={`p-2 rounded-xl text-xs max-w-[80%] font-sans ${
                      isOwnChat 
                        ? 'bg-indigo-600/30 text-indigo-100 rounded-tr-none border border-indigo-500/20' 
                        : 'bg-neutral-900 text-neutral-300 rounded-tl-none border border-neutral-800'
                    }`}>
                      {chat.message}
                    </div>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>

            {/* Form */}
            <form onSubmit={handleSendMessage} className="flex space-x-2">
              <input
                type="text"
                maxLength={60}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Connect directly into the grid messaging system..."
                className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-neutral-200 outline-none focus:border-purple-500/50"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim()}
                className="bg-purple-600 hover:bg-purple-500 hover:scale-105 disabled:scale-100 text-white p-2 px-3.5 rounded-xl transition flex items-center justify-center gap-1 disabled:opacity-45"
              >
                <Send size={14} /> Send
              </button>
            </form>
          </motion.div>
        ) : (
          /* TEAMS MODULE */
          <motion.div
            key="teams_sub"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* If player is currently joined show faction details */}
            {playerTeam ? (
              <div className="p-4 rounded-xl bg-purple-950/10 border border-purple-500/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-ping" />
                    <h4 className="font-bold text-sm text-purple-300 uppercase tracking-widest">{playerTeam.name}</h4>
                  </div>
                  <p className="text-xs text-neutral-400 font-mono leading-relaxed max-w-md">{playerTeam.description}</p>
                </div>

                <div className="space-y-1 text-right">
                  <p className="text-[10px] font-mono text-neutral-500 uppercase">Alliance Multiplier</p>
                  <p className="text-xs font-bold text-green-400 font-mono">+15% Global Luck Buff Active</p>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-neutral-950 rounded-lg border border-neutral-800 text-center text-xs text-neutral-400">
                You are currently a Freelance broker. Join an Alliance to secure cooperative global team luck bonuses.
              </div>
            )}

            {/* List of elements */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {TEAMS.map((team) => {
                const isMyTeam = team.id === playerProfile.teamId;
                return (
                  <div 
                    key={team.id}
                    className={`p-4 bg-neutral-950 border rounded-xl transition duration-300 flex flex-col justify-between ${
                      isMyTeam ? 'border-purple-500' : 'border-neutral-800 hover:border-purple-500/30'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className={`text-sm font-black tracking-wide ${team.color}`}>{team.name}</span>
                        <span className="text-[8px] font-mono bg-neutral-900 border border-neutral-800 text-neutral-400 px-2 py-0.5 rounded-full uppercase">
                          {team.faction}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-400 font-sans leading-normal">{team.description}</p>
                      
                      <div className="flex justify-between text-[10px] text-neutral-500 font-mono pt-1">
                        <span>Total Power: {team.totalRankPoints.toLocaleString()}</span>
                        <span>Brokers: {team.memberCount}</span>
                      </div>
                    </div>

                    <div className="pt-4 flex border-t border-neutral-900 mt-4 justify-between items-center">
                      {isMyTeam ? (
                        <span className="text-xs text-purple-400 font-mono font-bold flex items-center gap-1">
                          <CheckCircle2 size={14} /> ACTIVE MEMBER
                        </span>
                      ) : (
                        <button
                          onClick={() => handleJoinTeamClick(team.id)}
                          className="bg-purple-950/30 hover:bg-purple-600 border border-purple-500/20 text-purple-400 hover:text-white py-1 px-3 text-xs font-semibold rounded-lg font-mono transition"
                        >
                          Join Team
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

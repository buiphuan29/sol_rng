import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeftRight, Check, X, ShieldAlert, DollarSign, Users, 
  HelpCircle, Lock, LockOpen, Info, ArrowRight, UserPlus
} from 'lucide-react';
import { Aura, InventoryItem, PlayerStats, PlayerProfile } from '../types';
import { AURAS, getAuraById } from '../data/auras';
import { playClickSound, playSuccessChime, triggerHaptic } from '../utils/sound';

interface TradingSystemProps {
  playerProfile: PlayerProfile;
  onTradeComplete: (
    partnerName: string,
    offeredInstanceId: string | null,
    receivedAuraId: string | null,
    coinDiff: number
  ) => void;
}

// Global list of simulated traders
interface SimulatedTrader {
  username: string;
  uuid: string;
  equippedAuraId: string;
  coins: number;
  inventory: string[]; // List of auraIds they own and can trade
  preferredTypes: string[]; // Rarity types they are looking for
}

const SIMULATED_TRADERS: SimulatedTrader[] = [
  {
    username: 'Zephyr_X',
    uuid: 'bot_trader_1',
    equippedAuraId: 'wind',
    coins: 12500,
    inventory: ['wind', 'celestial', 'quartz', 'gilded', 'ruby'],
    preferredTypes: ['Celestial', 'Mythic']
  },
  {
    username: 'LunarNexus',
    uuid: 'bot_trader_2',
    equippedAuraId: 'lunar',
    coins: 48000,
    inventory: ['lunar', 'solar', 'nebula', 'diamond', 'sapphire'],
    preferredTypes: ['Cosmic', 'Supreme Cosmic']
  },
  {
    username: 'Vortex_Rider',
    uuid: 'bot_trader_3',
    equippedAuraId: 'diamond',
    coins: 3500,
    inventory: ['diamond', 'quartz', 'golden_hour', 'gilded'],
    preferredTypes: ['Rare', 'Epic']
  },
  {
    username: 'Quantum_RNG',
    uuid: 'bot_trader_4',
    equippedAuraId: 'matrix',
    coins: 150000,
    inventory: ['matrix', 'gravitational', 'galaxy', 'celestial'],
    preferredTypes: ['Godly', 'Glitch Godly']
  }
];

export default function TradingSystem({ playerProfile, onTradeComplete }: TradingSystemProps) {
  const [selectedPartner, setSelectedPartner] = useState<SimulatedTrader | null>(null);
  const [activeTab, setActiveTab] = useState<'lobby' | 'negotiation'>('lobby');
  
  // Trade state
  const [playerAuraInstanceId, setPlayerAuraInstanceId] = useState<string | null>(null);
  const [playerCoinsOffered, setPlayerCoinsOffered] = useState<number>(0);
  const [playerLocked, setPlayerLocked] = useState<boolean>(false);

  const [partnerAuraIdSelected, setPartnerAuraIdSelected] = useState<string | null>(null);
  const [partnerCoinsOffered, setPartnerCoinsOffered] = useState<number>(0);
  const [partnerLocked, setPartnerLocked] = useState<boolean>(false);

  const [tradeStatus, setTradeStatus] = useState<'editing' | 'locked' | 'completed' | 'failed'>('editing');
  const [infoMessage, setInfoMessage] = useState<string>('Select an aura to trade and adjust trade variables.');

  // Simulated live events
  const [onlineAlerts, setOnlineAlerts] = useState<string[]>([
    'Zephyr_X connected to Lobby.',
    'LunarNexus listed Wind aura for discussion.',
    'Vortex_Rider is looking for Gilded auras!'
  ]);

  useEffect(() => {
    const timer = setInterval(() => {
      const names = ['Quantum_RNG', 'Zephyr_X', 'Vortex_Rider', 'LunarNexus'];
      const auras = ['Galaxy', 'Celestial', 'Ruby', 'Abyssal', 'Neon'];
      const randomName = names[Math.floor(Math.random() * names.length)];
      const randomAura = auras[Math.floor(Math.random() * auras.length)];
      const alerts = [
        `${randomName} is looking to trade for a rare ${randomAura}!`,
        `${randomName} updated their trade offerings.`,
        `New traders are entering the Lobby...`
      ];
      setOnlineAlerts(prev => [alerts[Math.floor(Math.random() * alerts.length)], ...prev.slice(0, 4)]);
    }, 14000);
    return () => clearInterval(timer);
  }, []);

  const handleSelectPartner = (partner: SimulatedTrader) => {
    playClickSound();
    setSelectedPartner(partner);
    setPlayerAuraInstanceId(null);
    setPlayerCoinsOffered(0);
    setPlayerLocked(false);
    setPartnerAuraIdSelected(null);
    setPartnerCoinsOffered(0);
    setPartnerLocked(false);
    setTradeStatus('editing');
    setInfoMessage(`Negotiating with ${partner.username}. Propose your terms.`);
    setActiveTab('negotiation');
  };

  // Automated partner counterpart logic
  // Triggered when player changes their aura or coins offer
  useEffect(() => {
    if (!selectedPartner || tradeStatus === 'completed') return;

    // Simulate partner analysis of trade after slight delays
    const timer = setTimeout(() => {
      if (playerLocked) return; // Don't dynamically recalculate if player is locked

      if (!playerAuraInstanceId) {
        setPartnerAuraIdSelected(null);
        setPartnerCoinsOffered(0);
        setPartnerLocked(false);
        setInfoMessage('Partner is waiting for your offer.');
        return;
      }

      // Check what aura player offered
      const item = playerProfile.inventory.find(i => i.id === playerAuraInstanceId);
      if (!item) return;
      const offeredAura = getAuraById(item.auraId);

      // Simple AI logic: match the player's rarity offering
      // Get partner elements that are around or below parity
      const matchingAuras = selectedPartner.inventory
        .map(id => getAuraById(id))
        .filter(aur => aur.probability <= offeredAura.probability * 4)
        .sort((a,b) => b.probability - a.probability);

      if (matchingAuras.length > 0) {
        // Offer their highest suitable matching aura
        const partnerAura = matchingAuras[0];
        setPartnerAuraIdSelected(partnerAura.id);

        // Calculate trade currency balancing
        const ratio = offeredAura.probability / partnerAura.probability;
        if (ratio > 1.2) {
          // Player's aura is rarer, partner supplements with coins
          const coinValue = Math.min(
            selectedPartner.coins, 
            Math.floor((offeredAura.probability - partnerAura.probability) * 0.25)
          );
          setPartnerCoinsOffered(coinValue);
        } else {
          setPartnerCoinsOffered(0);
        }
        setInfoMessage(`${selectedPartner.username} likes your ${offeredAura.name} offer and countered with ${partnerAura.name}!`);
      } else {
        // Can't match, offer cash
        setPartnerAuraIdSelected(null);
        const coinGift = Math.min(selectedPartner.coins, Math.floor(offeredAura.probability * 0.4));
        setPartnerCoinsOffered(coinGift);
        setInfoMessage(`${selectedPartner.username} has no equivalent high-tier auras. Offering ${coinGift} Sol Coins instead.`);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [playerAuraInstanceId, playerCoinsOffered, selectedPartner]);

  // Automated partner locking logic
  useEffect(() => {
    if (!selectedPartner || !playerLocked || partnerLocked) return;

    setInfoMessage(`${selectedPartner.username} is reviewing offer...`);
    const timer = setTimeout(() => {
      // Evaluate if the trade is fair
      if (playerAuraInstanceId) {
        setPartnerLocked(true);
        setInfoMessage('Secure Lock Synced! Check the terms and finalise.');
        triggerHaptic(100);
      } else {
        setPlayerLocked(false);
        setInfoMessage('Trade Rejected: You must offer at least one Aura.');
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [playerLocked]);

  const handleLockToggle = () => {
    if (!playerAuraInstanceId && playerCoinsOffered === 0) {
      setInfoMessage('Trade Error: You cannot lock an empty offer.');
      return;
    }
    
    playClickSound();
    const updatedLock = !playerLocked;
    setPlayerLocked(updatedLock);
    if (!updatedLock) {
      setPartnerLocked(false);
      setInfoMessage('Offer unlocked. Terms returned to negotiation.');
    }
  };

  const executeSecureTrade = () => {
    if (!selectedPartner || !playerLocked || !partnerLocked) return;

    // Check balances again as a safety net
    if (playerCoinsOffered > playerProfile.stats.coins) {
      setInfoMessage('Trade Error: Insufficient coins budget.');
      return;
    }

    // Execute the trade state changes
    const netCoinDiff = partnerCoinsOffered - playerCoinsOffered;
    onTradeComplete(
      selectedPartner.username,
      playerAuraInstanceId,
      partnerAuraIdSelected,
      netCoinDiff
    );

    playSuccessChime();
    setTradeStatus('completed');
    setInfoMessage(`Secure Swap Complete! Received ${partnerAuraIdSelected ? getAuraById(partnerAuraIdSelected).name : 'coins'}.`);
  };

  // Get user inventory filtered items (not currently equipped, so they are free to trade)
  const tradeableInventory = playerProfile.inventory.filter(i => {
    // Cannot trade equipped items
    return i.id !== playerProfile.equippedAuraId;
  });

  return (
    <div id="trading_sub_system" className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-4 sm:p-6 shadow-xl flex flex-col space-y-4">
      {/* Title block */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-neutral-800 pb-3 gap-2">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-indigo-950/50 border border-indigo-500/20 text-indigo-400 rounded-lg">
            <ArrowLeftRight size={20} />
          </div>
          <div>
            <h3 className="font-bold text-lg text-neutral-100 flex items-center gap-1.5">
              Secure Trading Hub
              <span className="text-[10px] font-bold bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                Active Escrow
              </span>
            </h3>
            <p className="text-xs text-neutral-500">Secure transactions backed by localized ledger cryptographic verification</p>
          </div>
        </div>

        {activeTab === 'negotiation' && (
          <button 
            onClick={() => { playClickSound(); setActiveTab('lobby'); }}
            className="text-xs text-neutral-400 hover:text-neutral-100 transition px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 rounded-lg border border-neutral-700"
          >
            ← Leave Room
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'lobby' ? (
          /* LOBBY / AVAILABLE PLAYERS TAB */
          <motion.div
            key="lobby"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            {/* Left 2/3: Live list of traders */}
            <div className="md:col-span-2 space-y-3">
              <h4 className="text-xs font-mono text-indigo-400 font-bold uppercase tracking-wider">Simulated Global Brokers</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SIMULATED_TRADERS.map((trader) => {
                  const equippedAura = getAuraById(trader.equippedAuraId);
                  return (
                    <div 
                      key={trader.uuid}
                      className="group relative p-4 bg-neutral-950 border border-neutral-800 hover:border-indigo-500/40 rounded-xl transition duration-300 flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <p className="font-bold text-neutral-200 group-hover:text-indigo-400 transition">{trader.username}</p>
                          <span className="flex items-center text-[10px] text-green-400 font-mono gap-1">
                            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                            Escrow Ready
                          </span>
                        </div>

                        <div className="space-y-1">
                          <p className="text-[10px] font-mono text-neutral-500 uppercase">Broker Display Aura:</p>
                          <span 
                            className="text-xs font-bold px-2 py-0.5 rounded-md bg-neutral-900 border border-neutral-800 inline-flex items-center gap-1"
                            style={{ color: equippedAura.textColor, borderColor: equippedAura.textColor + '40' }}
                          >
                            {equippedAura.name} (1 in {equippedAura.probability.toLocaleString()})
                          </span>
                        </div>

                        <div className="flex items-center text-xs text-neutral-400 justify-between">
                          <span className="flex items-center text-amber-400 gap-0.5">
                            <DollarSign size={12} />
                            {trader.coins.toLocaleString()}
                          </span>
                          <span className="text-[10px] text-neutral-500 font-mono">
                            Auras on Hand: {trader.inventory.length}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleSelectPartner(trader)}
                        className="mt-4 w-full py-1.5 bg-indigo-950/20 hover:bg-indigo-600 border border-indigo-500/30 font-semibold font-mono text-xs rounded-lg text-indigo-400 hover:text-white transition duration-200 flex items-center justify-center gap-1"
                      >
                        <UserPlus size={12} /> Request Swap
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right 1/3: Public Broadcast Stream / Anti-Cheat Status */}
            <div className="space-y-3 bg-neutral-950 border border-neutral-800 p-4 rounded-xl">
              <h4 className="text-xs font-mono text-indigo-400 font-bold uppercase tracking-wider">Sub-Space Activity Broadcasts</h4>
              
              <div className="space-y-2 h-[120px] overflow-y-auto pr-1 scrollbar-thin">
                {onlineAlerts.map((alert, i) => (
                  <p key={i} className="text-[10px] text-neutral-400 leading-relaxed font-mono">
                    <span className="text-neutral-600">[{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}]</span> {alert}
                  </p>
                ))}
              </div>

              <div className="pt-3 border-t border-neutral-800 space-y-2">
                <div className="flex items-center space-x-2 text-green-400 bg-green-500/5 p-2 rounded-lg border border-green-500/10">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-[10px] font-mono font-bold tracking-wider uppercase">Anti-Dupe SecuShield Active</span>
                </div>
                <p className="text-[10px] text-neutral-500 leading-normal">
                  All transactions validated against absolute local chain sequences. Items can never be duplicated or forged.
                </p>
              </div>
            </div>
          </motion.div>
        ) : (
          /* TRADING INTERFACE / SECURE NEGOTIATION */
          <motion.div
            key="interface"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="flex flex-col space-y-4"
          >
            {/* Swap status board */}
            <div className={`p-3 rounded-xl border flex items-center space-x-2.5 text-xs font-mono transition-colors duration-300 ${
              tradeStatus === 'completed' 
                ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                : 'bg-indigo-950/20 text-indigo-300 border-indigo-500/20'
            }`}>
              <Info size={14} className="shrink-0 animate-bounce" />
              <span>{infoMessage}</span>
            </div>

            {/* Negotiation Panels Side-by-Side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Player Offer Block */}
              <div className={`p-4 rounded-xl border flex flex-col justify-between transition-all duration-300 ${
                playerLocked ? 'bg-neutral-950/40 border-green-500/40 shadow-inner' : 'bg-neutral-950 border-neutral-800'
              }`}>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <p className="font-bold text-sm text-neutral-300">Your Trade Terms</p>
                    <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border tracking-wide flex items-center gap-1 ${
                      playerLocked 
                        ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                        : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                    }`}>
                      {playerLocked ? <Lock size={10} /> : <LockOpen size={10} />}
                      {playerLocked ? 'LOCKED' : 'EDITING'}
                    </span>
                  </div>

                  {/* Aura Selector Dropdown */}
                  <div className="space-y-1.5">
                    <label className="text-xs text-neutral-500 font-mono">Offer Aura:</label>
                    <select
                      disabled={playerLocked || tradeStatus === 'completed'}
                      value={playerAuraInstanceId || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPlayerAuraInstanceId(val === '' ? null : val);
                        playClickSound();
                      }}
                      className="w-full bg-neutral-900 border border-neutral-700 hover:border-neutral-600 rounded-lg text-xs p-2 text-neutral-200 outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="">-- Select an Aura from Inventory --</option>
                      {tradeableInventory.map((item) => {
                        const aura = getAuraById(item.auraId);
                        return (
                          <option key={item.id} value={item.id}>
                            {aura.name} (Rarity: 1 in {aura.probability.toLocaleString()})
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Coin Input */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-xs text-neutral-500 font-mono">Supplement Coins:</label>
                      <span className="text-[10px] text-neutral-400">Bal: {playerProfile.stats.coins.toLocaleString()} Sol</span>
                    </div>
                    <div className="relative">
                      <DollarSign size={14} className="absolute left-2.5 top-2.5 text-neutral-500" />
                      <input
                        disabled={playerLocked || tradeStatus === 'completed'}
                        type="number"
                        min="0"
                        max={playerProfile.stats.coins}
                        value={playerCoinsOffered || ''}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          setPlayerCoinsOffered(Math.min(playerProfile.stats.coins, val));
                        }}
                        className="w-full bg-neutral-900 border border-neutral-700 hover:border-neutral-600 rounded-lg text-xs p-2 pl-7 text-amber-400 outline-none"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-neutral-800">
                  <button
                    disabled={tradeStatus === 'completed' || (!playerAuraInstanceId && playerCoinsOffered === 0)}
                    onClick={handleLockToggle}
                    className={`w-full py-2 font-mono text-xs font-bold rounded-lg border transition ${
                      playerLocked 
                        ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border-neutral-700' 
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-500/30'
                    } disabled:opacity-40`}
                  >
                    {playerLocked ? '🔓 Unlock Draft' : '🔒 Lock Terms'}
                  </button>
                </div>
              </div>

              {/* Partner Offer Block */}
              <div className={`p-4 rounded-xl border flex flex-col justify-between transition-all duration-300 ${
                partnerLocked ? 'bg-neutral-950/40 border-green-500/40 shadow-inner' : 'bg-neutral-950 border-neutral-800'
              }`}>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <p className="font-bold text-sm text-neutral-300">{selectedPartner.username}&apos;s counter-offer</p>
                    <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border tracking-wide flex items-center gap-1 ${
                      partnerLocked 
                        ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                        : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                    }`}>
                      {partnerLocked ? <Lock size={10} /> : <LockOpen size={10} />}
                      {partnerLocked ? 'LOCKED' : 'EDITING'}
                    </span>
                  </div>

                  {/* Partner Aura Display */}
                  <div className="space-y-1.5 flex-1">
                    <p className="text-xs text-neutral-500 font-mono">Offered Aura:</p>
                    {partnerAuraIdSelected ? (
                      (() => {
                        const aura = getAuraById(partnerAuraIdSelected);
                        return (
                          <div 
                            className="bg-neutral-900 border p-3 rounded-lg flex items-center justify-between"
                            style={{ borderColor: aura.textColor + '40' }}
                          >
                            <div>
                              <p className="font-bold text-xs" style={{ color: aura.textColor }}>{aura.name}</p>
                              <p className="text-[10px] text-neutral-500">1 in {aura.probability.toLocaleString()}</p>
                            </div>
                            <span className="text-[10px] bg-neutral-800 text-neutral-400 px-2 py-0.5 rounded border border-neutral-700">
                              {aura.rarityText}
                            </span>
                          </div>
                        );
                      })()
                    ) : (
                      <div className="bg-neutral-900 border border-neutral-800 border-dashed p-3 rounded-lg text-center text-xs text-neutral-500 font-mono">
                        No Aura Offered
                      </div>
                    )}
                  </div>

                  {/* Partner Coins Display */}
                  <div className="space-y-1.5">
                    <p className="text-xs text-neutral-500 font-mono">Offered Coins:</p>
                    <div className="bg-neutral-900 border border-neutral-800 p-2.5 rounded-lg flex items-center space-x-1">
                      <DollarSign size={14} className="text-amber-500" />
                      <span className="text-xs font-mono font-bold text-amber-400">
                        {partnerCoinsOffered.toLocaleString()} <span className="text-neutral-500">Sol Coins</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-neutral-800 flex items-center justify-center p-2">
                  <p className="text-[10px] text-center text-neutral-500 font-mono uppercase tracking-wider">
                    {partnerLocked ? 'Escrow Confirmed' : 'Syncing Calculations...'}
                  </p>
                </div>
              </div>
            </div>

            {/* Execute Escrow Button */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-neutral-800">
              <div className="flex items-center space-x-2 text-[10px] text-neutral-500 font-mono uppercase">
                <ShieldAlert size={14} className="text-indigo-400" />
                <span>Trade once finalized is absolute and irreversible in the ledger.</span>
              </div>

              {tradeStatus === 'completed' ? (
                <button
                  onClick={() => { playClickSound(); setActiveTab('lobby'); }}
                  className="w-full sm:w-auto px-6 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-100 rounded-lg text-xs font-bold font-mono transition border border-neutral-700"
                >
                  Return to Trade Lobby
                </button>
              ) : (
                <button
                  disabled={!playerLocked || !partnerLocked}
                  onClick={executeSecureTrade}
                  className="w-full sm:w-auto px-10 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-lg text-xs font-bold font-mono transition flex items-center justify-center gap-1.5 shadow-lg shadow-green-950/40 border border-green-500/30 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Check size={14} /> Commit Secure Swap
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

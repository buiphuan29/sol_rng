import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBag, Trash2, Tag, DollarSign, Plus, ArrowUpRight, 
  Percent, ArrowDown, HelpCircle, CheckCircle, RefreshCcw 
} from 'lucide-react';
import { Aura, InventoryItem, PlayerStats, PlayerProfile, MarketplaceListing } from '../types';
import { AURAS, getAuraById } from '../data/auras';
import { playClickSound, playSuccessChime, triggerHaptic } from '../utils/sound';

interface MarketplaceProps {
  playerProfile: PlayerProfile;
  marketListings: MarketplaceListing[];
  onAddListing: (auraInstanceId: string, price: number) => void;
  onBuyListing: (listingId: string) => void;
  onQuickSell: (auraInstanceId: string) => void;
}

export default function Marketplace({ 
  playerProfile, 
  marketListings, 
  onAddListing, 
  onBuyListing, 
  onQuickSell 
}: MarketplaceProps) {
  const [activeTab, setActiveTab] = useState<'buy' | 'sell' | 'quick_sell'>('buy');
  const [sellAuraInstanceId, setSellAuraInstanceId] = useState<string>('');
  const [sellPrice, setSellPrice] = useState<number>(100);
  const [marketStatus, setMarketStatus] = useState<string>('');

  // Calculate quick sell value for a given aura
  const getQuickSellValue = (aura: Aura): number => {
    // Rarity factor: 1 in X is priced proportionally with diminishing returns
    // So 1 in 100 is worth ~50 coins, 1 in 10,000 is ~3,000, 1 in 10M is ~1,500,000!
    if (aura.id === 'common') return 5;
    return Math.floor(Math.sqrt(aura.probability) * 12) + Math.floor(aura.probability * 0.05) + 15;
  };

  const handleCreateListing = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sellAuraInstanceId) {
      setMarketStatus('Please select an aura to list.');
      return;
    }
    if (sellPrice <= 0) {
      setMarketStatus('Price must be greater than 0.');
      return;
    }

    onAddListing(sellAuraInstanceId, sellPrice);
    setSellAuraInstanceId('');
    setSellPrice(100);
    setMarketStatus('Item successfully listed on the Global Exchange index!');
    playSuccessChime();
    triggerHaptic(100);

    setTimeout(() => setMarketStatus(''), 4000);
  };

  const handleBuy = (listing: MarketplaceListing) => {
    if (listing.price > playerProfile.stats.coins) {
      setMarketStatus('Insufficient coins balance for this purchase!');
      triggerHaptic(50);
      return;
    }
    onBuyListing(listing.id);
    playSuccessChime();
    setMarketStatus(`Acquired ${getAuraById(listing.auraId).name} successfully!`);
    setTimeout(() => setMarketStatus(''), 4000);
  };

  const handleQuickSellClick = (instanceId: string) => {
    const item = playerProfile.inventory.find(i => i.id === instanceId);
    if (!item) return;
    const aura = getAuraById(item.auraId);
    const value = getQuickSellValue(aura);
    playSuccessChime();
    onQuickSell(instanceId);
    setMarketStatus(`Quick sold ${aura.name} for ${value} Sol Coins.`);
    setTimeout(() => setMarketStatus(''), 4000);
  };

  // Filter out equipped item
  const tradeableInventory = playerProfile.inventory.filter(i => {
    return i.id !== playerProfile.equippedAuraId;
  });

  return (
    <div id="marketplace_sub_system" className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-4 sm:p-6 shadow-xl flex flex-col space-y-4">
      {/* Title block */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-neutral-800 pb-3 gap-2">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-amber-950/40 border border-amber-500/20 text-amber-400 rounded-lg">
            <ShoppingBag size={20} />
          </div>
          <div>
            <h3 className="font-bold text-lg text-neutral-100 flex items-center gap-1.5">
              Marketplace & Quick Sell
              <span className="text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                Inflation Checked
              </span>
            </h3>
            <p className="text-xs text-neutral-500 font-sans">Trade high-rarity listings with online bots and cash-out duplicate energy vectors</p>
          </div>
        </div>

        {/* Tab Headers */}
        <div className="flex bg-neutral-950 p-1 rounded-xl border border-neutral-800 max-w-full overflow-x-auto">
          {['buy', 'sell', 'quick_sell'].map((tab) => (
            <button
              key={tab}
              onClick={() => { playClickSound(); setActiveTab(tab as any); }}
              className={`text-xs px-3 py-1.5 rounded-lg transition font-medium capitalize shrink-0 ${
                activeTab === tab
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/10 shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-100'
              }`}
            >
              {tab.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {marketStatus && (
        <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs font-mono flex items-center gap-2">
          <CheckCircle size={14} className="shrink-0" />
          <span>{marketStatus}</span>
        </div>
      )}

      {/* Tabs panels */}
      <AnimatePresence mode="wait">
        {activeTab === 'buy' && (
          /* BUY LISTINGS TAB */
          <motion.div
            key="buy_tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3"
          >
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-mono text-amber-500 font-bold uppercase tracking-wider">Active Public Index</h4>
              <span className="text-[10px] text-neutral-500 font-mono flex items-center gap-1">
                <RefreshCcw size={10} className="animate-spin" /> Live Listings Auto-Refreshed
              </span>
            </div>

            {marketListings.filter(l => l.status === 'active').length === 0 ? (
              <div className="p-8 text-center bg-neutral-950 border border-neutral-800 rounded-xl">
                <p className="text-xs text-neutral-500 font-mono">No active public listings on the market. Create one!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {marketListings.filter(l => l.status === 'active').map((listing) => {
                  const aura = getAuraById(listing.auraId);
                  const isSourcedByMe = listing.sellerUuid === playerProfile.uuid;
                  return (
                    <div 
                      key={listing.id}
                      className="p-3.5 bg-neutral-950 border border-neutral-800 hover:border-amber-500/20 rounded-xl relative flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <span 
                              className="text-xs font-bold block"
                              style={{ color: aura.textColor }}
                            >
                              {aura.name}
                            </span>
                            <span className="text-[9px] text-neutral-500 font-mono">
                              Rarity: 1 in {aura.probability.toLocaleString()}
                            </span>
                          </div>
                          <span className="text-[9px] font-mono bg-neutral-900 border border-neutral-800 text-neutral-400 px-1.5 py-0.5 rounded">
                            {aura.rarityText}
                          </span>
                        </div>

                        <div className="p-1 px-2 bg-neutral-900 rounded border border-neutral-800 flex justify-between items-center">
                          <span className="text-[10px] text-neutral-500">Listed by:</span>
                          <span className={`text-[10px] font-mono ${isSourcedByMe ? 'text-indigo-400' : 'text-neutral-300'}`}>
                            {isSourcedByMe ? 'You' : listing.sellerName}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-4 border-t border-neutral-900 pt-3">
                        <div className="flex items-center text-amber-400 font-bold font-mono">
                          <DollarSign size={14} />
                          <span className="text-sm">{listing.price.toLocaleString()}</span>
                        </div>

                        {isSourcedByMe ? (
                          <span className="text-[10px] text-neutral-500 font-mono">Locked (Self-Offer)</span>
                        ) : (
                          <button
                            onClick={() => handleBuy(listing)}
                            disabled={listing.price > playerProfile.stats.coins}
                            className="bg-amber-950/30 hover:bg-amber-500 border border-amber-500/30 font-semibold font-mono text-xs px-3 py-1.5 rounded-lg text-amber-400 hover:text-black transition duration-200 disabled:opacity-30 flex items-center gap-1"
                          >
                            Acquire <ArrowUpRight size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'sell' && (
          /* CREATE SELL LISTING TAB */
          <motion.div
            key="sell_tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            {/* Left 2/3 Create listing form */}
            <form onSubmit={handleCreateListing} className="md:col-span-2 p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-4">
              <h4 className="text-xs font-mono text-amber-500 font-black uppercase tracking-wider">List New Asset Element</h4>
              
              <div className="space-y-1.5">
                <label className="text-xs text-neutral-400 font-mono">Select Dual/Duplicate Aura:</label>
                <select
                  value={sellAuraInstanceId}
                  onChange={(e) => { playClickSound(); setSellAuraInstanceId(e.target.value); }}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg text-xs p-2 text-neutral-200 outline-none"
                >
                  <option value="">-- Choose Aura --</option>
                  {tradeableInventory.map((item) => {
                    const aura = getAuraById(item.auraId);
                    return (
                      <option key={item.id} value={item.id}>
                        {aura.name} (1 in {aura.probability.toLocaleString()})
                      </option>
                    );
                  })}
                </select>
                <p className="text-[10px] text-neutral-500">Note: Equipped system vectors cannot be auctioned on the marketplace index.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-neutral-400 font-mono">Auction Listing price:</label>
                <div className="relative">
                  <DollarSign size={14} className="absolute left-2.5 top-2.5 text-neutral-500" />
                  <input
                    type="number"
                    min="1"
                    value={sellPrice}
                    onChange={(e) => setSellPrice(Math.max(1, parseInt(e.target.value) || 0))}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-lg text-xs p-2 pl-7 text-amber-400 outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={!sellAuraInstanceId}
                className="w-full py-2 bg-amber-600 hover:bg-amber-500 font-bold font-mono text-xs rounded-lg text-white transition disabled:opacity-40 select-none flex items-center justify-center gap-1.5"
              >
                <Plus size={14} /> Publish Open Escrow Listing
              </button>
            </form>

            {/* Right 1/3 tips */}
            <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-3">
              <h5 className="text-xs font-mono text-neutral-400 font-bold uppercase">Trading Tips</h5>
              <p className="text-[10px] text-neutral-500 leading-relaxed font-sans">
                Auras like <span className="text-teal-300">Wind</span> or <span className="text-purple-400">Celestial</span> often sell very quickly to incoming simulated traders. Setting a fair price based on the 1-in-X frequency increases purchase index velocity!
              </p>
              <div className="p-2.5 rounded bg-amber-500/5 border border-amber-500/10 text-[9px] text-neutral-400 font-mono">
                BROKER TAX RATE: 0%<br />
                All transactions completed with peer-to-peer integrity check.
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'quick_sell' && (
          /* QUICK SELL SHOP */
          <motion.div
            key="quick_sell_tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3"
          >
            <div className="flex justify-between items-center border-b border-neutral-800 pb-2">
              <h4 className="text-xs font-mono text-amber-500 font-bold uppercase tracking-wider">Fast Liquidation Terminal</h4>
              <p className="text-[10px] text-neutral-500 font-mono">Quickly sell unwanted items directly back into the core database</p>
            </div>

            {tradeableInventory.length === 0 ? (
              <div className="p-8 text-center bg-neutral-950 border border-neutral-800 rounded-xl">
                <p className="text-xs text-neutral-500 font-mono">You do not have any tradeable/duplicate auras on you.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin">
                {tradeableInventory.map((item) => {
                  const aura = getAuraById(item.auraId);
                  const sellVal = getQuickSellValue(aura);
                  return (
                    <div 
                      key={item.id}
                      className="p-2.5 bg-neutral-950 border border-neutral-800 hover:border-red-500/10 rounded-xl flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-1.5 h-6 rounded-full" style={{ backgroundColor: aura.textColor }} />
                        <div>
                          <p className="text-xs font-bold" style={{ color: aura.textColor }}>{aura.name}</p>
                          <p className="text-[10px] text-neutral-500 font-mono">Rarity index: 1 in {aura.probability.toLocaleString()}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <span className="text-xs font-mono font-bold text-amber-400 flex items-center gap-0.5">
                          <DollarSign size={12} />
                          {sellVal.toLocaleString()}
                        </span>
                        <button
                          onClick={() => handleQuickSellClick(item.id)}
                          className="bg-red-950/20 hover:bg-red-600 border border-red-500/20 hover:border-red-500 py-1 px-2 text-[10px] font-mono text-red-400 hover:text-white rounded transition"
                        >
                          Recycle Asset
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

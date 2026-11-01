import React from 'react';
import { AppData, ShopItem } from '../../types';
import { Sparkles, ShoppingBag } from 'lucide-react';

interface Props {
  data: AppData;
  onBuyItem: (item: ShopItem) => void;
  onUseItem ? : (item: ShopItem) => void;
}

export const ShopScreen: React.FC < Props > = ({ data, onBuyItem, onUseItem }) => {
  const { player, shop } = data;
  
  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      <div className="bg-slate-900/90 border border-cyan-500/30 rounded-2xl p-6 flex items-center justify-between">
        <div>
          <div className="text-xs font-mono text-cyan-400 tracking-widest">[ SYSTEM SHOP ]</div>
          <h1 className="text-2xl font-bold font-mono text-white mt-1">Study Boosts & Potions</h1>
        </div>
        <div className="bg-yellow-950/40 border border-yellow-500/30 rounded-xl px-4 py-2 font-mono text-xs text-yellow-400 flex items-center gap-1">
          <Sparkles className="w-4 h-4" /> Gold: {player.gold}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {shop.map((item) => (
          <div key={item.id} className="bg-slate-900/90 border border-cyan-500/30 rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono text-yellow-400 flex items-center gap-1 font-bold">
                  <Sparkles className="w-3.5 h-3.5" /> {item.cost} Gold
                </span>
                <span className="text-xs font-mono text-cyan-400">Owned: {item.quantity}</span>
              </div>
              <h3 className="text-lg font-bold font-mono text-white mb-1">{item.name}</h3>
              <p className="text-xs font-mono text-cyan-400/80 mb-4">{item.description}</p>

              {/* Item effect controls */}
              {item.type === 'potion' && (
                <>
                  {player.focusPotionActive ? (
                    <div className="text-[11px] font-mono text-cyan-300 bg-cyan-950/60 border border-cyan-500/40 rounded-lg px-3 py-2 mb-3">
                      Active: applies to your next focus session
                    </div>
                  ) : item.quantity > 0 ? (
                    <button
                      onClick={() => onUseItem && onUseItem(item)}
                      className="w-full mb-3 py-2 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/40 text-cyan-300 font-mono text-[11px] font-bold uppercase tracking-wider transition-all"
                    >
                      Use Potion
                    </button>
                  ) : null}
                </>
              )}

              {item.type === 'scroll' && (
                <>
                  {player.revisionScrollActive ? (
                    <div className="text-[11px] font-mono text-cyan-300 bg-cyan-950/60 border border-cyan-500/40 rounded-lg px-3 py-2 mb-3">
                      Active: applies to your next review
                    </div>
                  ) : item.quantity > 0 ? (
                    <button
                      onClick={() => onUseItem && onUseItem(item)}
                      className="w-full mb-3 py-2 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/40 text-cyan-300 font-mono text-[11px] font-bold uppercase tracking-wider transition-all"
                    >
                      Use Scroll
                    </button>
                  ) : null}
                </>
              )}

              {item.type === 'shield' && (
                <div className="text-[11px] font-mono text-cyan-300/80 mb-3">
                  Used automatically when you miss exactly one day.
                </div>
              )}
            </div>

            <button
              onClick={() => onBuyItem(item)}
              disabled={player.gold < item.cost}
              className={
                'w-full py-2.5 rounded-xl font-mono text-xs font-bold uppercase transition-all ' +
                (player.gold >= item.cost
                  ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed')
              }
            >
              Purchase Item
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
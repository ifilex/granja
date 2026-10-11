import React, { useState } from 'react';
import { FarmState, MarketListing, RoadsideSlot } from '../types/game';
import { GAME_ITEMS } from '../data/gameData';
import { soundManager } from '../utils/audio';
import { Newspaper, Store, RefreshCw, Search, Coins, Sparkles, Check, Tag } from 'lucide-react';
import confetti from 'canvas-confetti';

interface GlobalMarketModalProps {
  state: FarmState;
  newspaperListings: MarketListing[];
  onClose: () => void;
  onBuyListing: (listing: MarketListing) => void;
  onRefreshNewspaper: () => void;
  onListItemForSale: (slotId: number, itemId: string, quantity: number, price: number, hasAd: boolean) => void;
  onCollectSaleCoins: (slotId: number) => void;
  onVisitSeller: (sellerId: string) => void;
}

export const GlobalMarketModal: React.FC<GlobalMarketModalProps> = ({
  state,
  newspaperListings,
  onClose,
  onBuyListing,
  onRefreshNewspaper,
  onListItemForSale,
  onCollectSaleCoins,
  onVisitSeller,
}) => {
  const [activeTab, setActiveTab] = useState<'newspaper' | 'my_shop'>('newspaper');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Sell slot configuration state
  const [editingSlotId, setEditingSlotId] = useState<number | null>(null);
  const [selectedSellItemId, setSelectedSellItemId] = useState<string>('');
  const [sellQty, setSellQty] = useState<number>(1);
  const [sellPrice, setSellPrice] = useState<number>(10);
  const [includeAd, setIncludeAd] = useState<boolean>(true);

  // Filter listings
  const filteredListings = newspaperListings.filter((item) => {
    const meta = GAME_ITEMS[item.itemId];
    if (!meta) return false;
    const matchesSearch =
      meta.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sellerName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = filterCategory === 'all' || meta.category === filterCategory;
    return matchesSearch && matchesCat && !item.isSold;
  });

  // Available items in player's inventory to put on sale
  const sellableInventory = (Object.entries(state.inventory) as [string, number][])
    .filter(([_, count]) => count > 0)
    .map(([id, count]) => ({
      ...GAME_ITEMS[id],
      count,
    }));

  const selectedSellItemMeta = selectedSellItemId ? GAME_ITEMS[selectedSellItemId] : null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-3">
      <div className="bg-gradient-to-b from-amber-900 via-amber-950 to-amber-950 border-2 border-amber-600 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header with Navigation Tabs */}
        <div className="px-4 sm:px-6 py-3 bg-amber-800/90 border-b border-amber-700 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                soundManager.playClick();
                setActiveTab('newspaper');
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-black text-xs sm:text-sm transition ${
                activeTab === 'newspaper'
                  ? 'bg-amber-100 text-amber-950 shadow-md'
                  : 'bg-amber-950/60 text-amber-200 hover:bg-amber-900/60'
              }`}
            >
              <Newspaper className="w-4 h-4" />
              <span>Diario del Mercado</span>
            </button>

            <button
              onClick={() => {
                soundManager.playClick();
                setActiveTab('my_shop');
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-black text-xs sm:text-sm transition ${
                activeTab === 'my_shop'
                  ? 'bg-amber-100 text-amber-950 shadow-md'
                  : 'bg-amber-950/60 text-amber-200 hover:bg-amber-900/60'
              }`}
            >
              <Store className="w-4 h-4" />
              <span>Mi Puesto de Venta</span>
            </button>
          </div>

          <button
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-amber-950/80 hover:bg-amber-900 text-amber-300 flex items-center justify-center font-bold text-lg border border-amber-700"
          >
            ✕
          </button>
        </div>

        {/* TAB 1: NEWSPAPER MARKETPLACE */}
        {activeTab === 'newspaper' && (
          <div className="p-3 sm:p-5 overflow-y-auto flex-1 flex flex-col space-y-3">
            {/* Filter and Search Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 bg-amber-950/70 p-2.5 rounded-2xl border border-amber-800">
              <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-amber-400" />
                <input
                  type="text"
                  placeholder="Buscar trigo, leche, clavos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent text-amber-100 placeholder-amber-400/60 text-xs sm:text-sm focus:outline-none w-full"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="bg-amber-900/80 text-amber-200 border border-amber-700 rounded-xl px-2 py-1 text-xs font-bold focus:outline-none"
                >
                  <option value="all">Todas las Categorías</option>
                  <option value="crop">🌾 Cosechas</option>
                  <option value="animal_product">🥛 Ganadería</option>
                  <option value="artisan">🍞 Artesanales</option>
                  <option value="material">🔩 Herramientas</option>
                </select>

                <button
                  onClick={() => {
                    soundManager.playClick();
                    onRefreshNewspaper();
                  }}
                  className="bg-amber-700 hover:bg-amber-600 text-amber-100 px-3 py-1 rounded-xl text-xs font-black flex items-center gap-1 shadow active:scale-95 transition"
                  title="Buscar nuevas ofertas en el mundo"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-yellow-300" />
                  <span>Actualizar</span>
                </button>
              </div>
            </div>

            {/* Newspaper Classifieds Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
              {filteredListings.map((listing) => {
                const itemMeta = GAME_ITEMS[listing.itemId];
                const canAfford = state.coins >= listing.price;

                return (
                  <div
                    key={listing.id}
                    className="relative bg-amber-50 rounded-2xl border-2 border-amber-300 p-3 shadow-md hover:shadow-lg transition flex flex-col justify-between min-h-[165px]"
                  >
                    {/* Seller Banner */}
                    <div className="flex items-center justify-between pb-1.5 border-b border-amber-200">
                      <div
                        onClick={() => onVisitSeller(listing.sellerId)}
                        className="flex items-center gap-1 cursor-pointer hover:underline"
                        title="Visitar granja del vendedor"
                      >
                        <span className="text-sm">{listing.sellerAvatar}</span>
                        <span className="text-[11px] font-black text-amber-950 truncate max-w-[80px]">
                          {listing.sellerName}
                        </span>
                      </div>
                      <span className="text-[9px] font-bold text-amber-800 bg-amber-200/80 px-1 rounded">
                        Nv.{listing.sellerLevel}
                      </span>
                    </div>

                    {/* Central Item Display */}
                    <div className="flex flex-col items-center justify-center my-2">
                      <span className="text-3xl sm:text-4xl filter drop-shadow">
                        {itemMeta?.icon}
                      </span>
                      <span className="text-xs font-black text-amber-950 mt-1">
                        {itemMeta?.name}
                      </span>
                      <span className="text-[11px] font-extrabold text-amber-800">
                        Cantidad: x{listing.quantity}
                      </span>
                    </div>

                    {/* Price & Buy Button */}
                    <button
                      onClick={() => {
                        if (canAfford) {
                          onBuyListing(listing);
                          confetti({ particleCount: 20, spread: 45, origin: { y: 0.6 } });
                        }
                      }}
                      disabled={!canAfford}
                      className={`w-full py-1.5 rounded-xl font-black text-xs flex items-center justify-center gap-1 shadow transition active:scale-95 ${
                        canAfford
                          ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:brightness-110'
                          : 'bg-stone-300 text-stone-500 cursor-not-allowed'
                      }`}
                    >
                      <Coins className="w-3.5 h-3.5" />
                      <span>{listing.price} 🪙</span>
                    </button>
                  </div>
                );
              })}
            </div>

            {filteredListings.length === 0 && (
              <div className="text-center py-12 text-amber-300/70 font-bold text-sm">
                No hay ofertas activas para esta búsqueda. ¡Prueba refrescar el periódico!
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MY ROADSIDE SHOP (MY SALES SLOTS) */}
        {activeTab === 'my_shop' && (
          <div className="p-3 sm:p-5 overflow-y-auto flex-1 flex flex-col space-y-4">
            <div className="bg-amber-950/70 p-3 rounded-2xl border border-amber-800 flex items-center justify-between">
              <div>
                <h4 className="font-extrabold text-sm text-amber-100">
                  Tu Puesto de Venta Junto al Camino
                </h4>
                <p className="text-xs text-amber-300">
                  Coloca productos aquí. Si activas el anuncio del periódico, otros jugadores te comprarán rápidamente.
                </p>
              </div>
            </div>

            {/* Slots Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {state.roadsideSlots.map((slot) => {
                const itemMeta = slot.itemId ? GAME_ITEMS[slot.itemId] : null;

                if (!slot.itemId) {
                  return (
                    <div
                      key={slot.id}
                      onClick={() => {
                        soundManager.playClick();
                        setEditingSlotId(slot.id);
                        setSelectedSellItemId('');
                      }}
                      className="h-36 rounded-2xl bg-amber-950/60 border-2 border-dashed border-amber-700/80 hover:bg-amber-900/40 cursor-pointer flex flex-col items-center justify-center text-amber-300 transition transform active:scale-95 shadow-inner"
                    >
                      <span className="text-3xl mb-1">🧺</span>
                      <span className="text-xs font-black">Caja #{slot.id} Vacía</span>
                      <span className="text-[10px] text-amber-400">Toca para poner a la venta</span>
                    </div>
                  );
                }

                return (
                  <div
                    key={slot.id}
                    className={`relative h-36 rounded-2xl border-2 p-3 flex flex-col justify-between shadow-md ${
                      slot.isSold
                        ? 'bg-gradient-to-b from-amber-800 to-amber-900 border-yellow-400 ring-2 ring-yellow-400/40'
                        : 'bg-amber-900/70 border-amber-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-amber-300">
                        Caja #{slot.id}
                      </span>
                      {slot.hasAd && (
                        <span className="bg-blue-600 text-white font-black text-[9px] px-1.5 py-0.2 rounded">
                          📰 Con Anuncio
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col items-center justify-center">
                      <span className="text-3xl">{itemMeta?.icon}</span>
                      <span className="text-xs font-black text-amber-100 truncate">
                        {itemMeta?.name} x{slot.quantity}
                      </span>
                    </div>

                    {slot.isSold ? (
                      <button
                        onClick={() => {
                          onCollectSaleCoins(slot.id);
                          confetti({ particleCount: 25, spread: 50, origin: { y: 0.6 } });
                        }}
                        className="w-full bg-yellow-400 hover:bg-yellow-300 text-amber-950 font-black text-xs py-1.5 rounded-xl flex items-center justify-center gap-1 shadow animate-bounce"
                      >
                        <Coins className="w-3.5 h-3.5" />
                        <span>¡Cobrar {slot.price} 🪙!</span>
                      </button>
                    ) : (
                      <div className="text-center text-xs font-extrabold text-amber-300 bg-amber-950/70 py-1 rounded-xl">
                        En venta por {slot.price} 🪙
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Modal Drawer to set up sale for an empty slot */}
            {editingSlotId !== null && (
              <div className="bg-amber-950/95 border-2 border-amber-600 rounded-2xl p-4 space-y-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-extrabold text-amber-100">
                    Poner a la venta en Caja #{editingSlotId}
                  </h4>
                  <button
                    onClick={() => setEditingSlotId(null)}
                    className="text-xs text-amber-400 hover:text-white font-bold"
                  >
                    ✕ Cancelar
                  </button>
                </div>

                {/* Select Item from inventory */}
                <div>
                  <span className="text-xs font-black text-amber-300 block mb-1">
                    Selecciona un producto de tu almacén:
                  </span>
                  <div className="flex items-center gap-2 overflow-x-auto pb-2">
                    {sellableInventory.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          setSelectedSellItemId(item.id);
                          setSellQty(Math.min(10, item.count));
                          setSellPrice(item.basePrice * Math.min(10, item.count));
                        }}
                        className={`p-2 rounded-xl border-2 flex flex-col items-center shrink-0 w-16 transition ${
                          selectedSellItemId === item.id
                            ? 'bg-amber-800 border-yellow-400 shadow-md'
                            : 'bg-amber-900/60 border-amber-700/60'
                        }`}
                      >
                        <span className="text-2xl">{item.icon}</span>
                        <span className="text-[10px] font-black text-amber-100 truncate w-full text-center">
                          {item.name}
                        </span>
                        <span className="text-[9px] text-amber-300">x{item.count}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Adjust Quantity and Price */}
                {selectedSellItemMeta && (
                  <div className="bg-amber-900/60 p-3 rounded-xl border border-amber-800 space-y-3">
                    {/* Quantity */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-200">Cantidad:</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSellQty(Math.max(1, sellQty - 1))}
                          className="w-7 h-7 bg-amber-800 text-white rounded font-black"
                        >
                          -
                        </button>
                        <span className="font-black text-amber-100 px-2">{sellQty}</span>
                        <button
                          onClick={() =>
                            setSellQty(
                              Math.min(
                                state.inventory[selectedSellItemId] || 1,
                                sellQty + 1
                              )
                            )
                          }
                          className="w-7 h-7 bg-amber-800 text-white rounded font-black"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Price Slider */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-200">Precio Total:</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min={sellQty * selectedSellItemMeta.minPrice}
                          max={sellQty * selectedSellItemMeta.maxPrice}
                          value={sellPrice}
                          onChange={(e) => setSellPrice(Number(e.target.value))}
                          className="w-32 accent-yellow-400"
                        />
                        <span className="font-black text-yellow-300 text-sm">
                          {sellPrice} 🪙
                        </span>
                      </div>
                    </div>

                    {/* Newspaper Ad toggle */}
                    <label className="flex items-center gap-2 cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={includeAd}
                        onChange={(e) => setIncludeAd(e.target.checked)}
                        className="rounded accent-emerald-500 w-4 h-4"
                      />
                      <span className="text-xs font-bold text-amber-100">
                        Publicar con anuncio gratis en el Periódico Mundial
                      </span>
                    </label>

                    <button
                      onClick={() => {
                        onListItemForSale(
                          editingSlotId,
                          selectedSellItemId,
                          sellQty,
                          sellPrice,
                          includeAd
                        );
                        setEditingSlotId(null);
                      }}
                      className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black py-2 rounded-xl shadow active:scale-95 transition"
                    >
                      Confirmar y Poner en Venta
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

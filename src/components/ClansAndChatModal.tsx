import React, { useState } from 'react';
import { FarmState, Clan, ChatMessage, ClanMember } from '../types/game';
import { GAME_ITEMS } from '../data/gameData';
import { soundManager } from '../utils/audio';
import { Users, MessageSquare, Send, HandHeart, Trophy, Shield, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ClansAndChatModalProps {
  state: FarmState;
  clan: Clan;
  clanChat: ChatMessage[];
  globalChat: ChatMessage[];
  onClose: () => void;
  onSendChatMessage: (text: string, isClan: boolean, requestItem?: string) => void;
  onFulfillSupplyRequest: (messageId: string) => void;
}

export const ClansAndChatModal: React.FC<ClansAndChatModalProps> = ({
  state,
  clan,
  clanChat,
  globalChat,
  onClose,
  onSendChatMessage,
  onFulfillSupplyRequest,
}) => {
  const [activeTab, setActiveTab] = useState<'clan_chat' | 'global_chat' | 'members'>('clan_chat');
  const [inputText, setInputText] = useState('');
  const [showRequestPicker, setShowRequestPicker] = useState(false);

  const handleSend = () => {
    if (!inputText.trim()) return;
    onSendChatMessage(inputText.trim(), activeTab === 'clan_chat');
    setInputText('');
  };

  const handleRequestItem = (itemId: string) => {
    const item = GAME_ITEMS[itemId];
    onSendChatMessage(`¡Hola clan! ¿Alguien tiene ${item?.name || 'suministros'} para donarme?`, true, itemId);
    setShowRequestPicker(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-3">
      <div className="bg-gradient-to-b from-amber-900 via-amber-950 to-amber-950 border-2 border-amber-600 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col h-[90vh]">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3 bg-amber-800/90 border-b border-amber-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-3xl">{clan.badgeIcon}</span>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-amber-100 leading-tight">
                {clan.name}
              </h3>
              <div className="flex items-center gap-2 text-xs text-amber-300">
                <span className="flex items-center gap-1">
                  <Trophy className="w-3 h-3 text-yellow-400" />
                  {clan.trophies} Trofeos
                </span>
                <span>•</span>
                <span>{clan.members.length} Granjeros</span>
              </div>
            </div>
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

        {/* Navigation Tabs */}
        <div className="px-4 py-2 bg-amber-950/90 border-b border-amber-800/80 flex items-center gap-2">
          <button
            onClick={() => {
              soundManager.playClick();
              setActiveTab('clan_chat');
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-xl font-black text-xs transition ${
              activeTab === 'clan_chat'
                ? 'bg-amber-100 text-amber-950 shadow'
                : 'bg-amber-900/60 text-amber-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Chat del Clan</span>
          </button>

          <button
            onClick={() => {
              soundManager.playClick();
              setActiveTab('global_chat');
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-xl font-black text-xs transition ${
              activeTab === 'global_chat'
                ? 'bg-amber-100 text-amber-950 shadow'
                : 'bg-amber-900/60 text-amber-200'
            }`}
          >
            <span>🌍 Chat Global</span>
          </button>

          <button
            onClick={() => {
              soundManager.playClick();
              setActiveTab('members');
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-xl font-black text-xs transition ${
              activeTab === 'members'
                ? 'bg-amber-100 text-amber-950 shadow'
                : 'bg-amber-900/60 text-amber-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Miembros ({clan.members.length})</span>
          </button>
        </div>

        {/* Tab 1 & 2: Chat Feed */}
        {(activeTab === 'clan_chat' || activeTab === 'global_chat') && (
          <div className="flex-1 flex flex-col justify-between overflow-hidden p-3 sm:p-4">
            {/* Messages Scrollable List */}
            <div className="overflow-y-auto space-y-2.5 flex-1 pr-1">
              {(activeTab === 'clan_chat' ? clanChat : globalChat).map((msg) => {
                const isMe = msg.senderId === 'player_me';

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-1.5 text-[11px] text-amber-300 font-bold mb-0.5 px-1">
                      <span>{msg.senderAvatar}</span>
                      <span>{msg.senderName}</span>
                    </div>

                    <div
                      className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-2.5 sm:p-3 text-xs sm:text-sm font-medium shadow-md ${
                        isMe
                          ? 'bg-gradient-to-r from-amber-600 to-yellow-600 text-white rounded-br-none'
                          : 'bg-amber-900/80 text-amber-100 border border-amber-700/80 rounded-bl-none'
                      }`}
                    >
                      <p>{msg.text}</p>

                      {/* Attached Supply Request Card */}
                      {msg.request && (
                        <div className="mt-2 pt-2 border-t border-amber-700/60 bg-amber-950/60 p-2 rounded-xl flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">
                              {GAME_ITEMS[msg.request.itemId]?.icon}
                            </span>
                            <div>
                              <span className="text-xs font-bold text-amber-100 block">
                                Pide: {msg.request.countRequested}x{' '}
                                {GAME_ITEMS[msg.request.itemId]?.name}
                              </span>
                              <span className="text-[10px] text-amber-300">
                                Donado: {msg.request.countFulfilled} /{' '}
                                {msg.request.countRequested}
                              </span>
                            </div>
                          </div>

                          {!isMe && msg.request.status === 'open' && (
                            <button
                              onClick={() => {
                                onFulfillSupplyRequest(msg.id);
                                confetti({ particleCount: 25, spread: 50 });
                              }}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 shadow active:scale-95 transition"
                            >
                              <HandHeart className="w-3.5 h-3.5" />
                              <span>Donar</span>
                            </button>
                          )}

                          {msg.request.status === 'fulfilled' && (
                            <span className="bg-emerald-700 text-white text-[10px] font-black px-2 py-0.5 rounded">
                              ✓ Completado
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Request Item Drawer */}
            {showRequestPicker && (
              <div className="bg-amber-950/95 border-2 border-amber-600 rounded-2xl p-3 my-2 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-200">
                    ¿Qué cultivo o producto necesitas de tu clan?
                  </span>
                  <button
                    onClick={() => setShowRequestPicker(false)}
                    className="text-xs text-amber-400 font-bold"
                  >
                    ✕
                  </button>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {['wheat', 'corn', 'carrot', 'milk', 'egg', 'bread'].map((id) => {
                    const item = GAME_ITEMS[id];
                    return (
                      <button
                        key={id}
                        onClick={() => handleRequestItem(id)}
                        className="bg-amber-900/80 hover:bg-amber-800 border border-amber-700 p-2 rounded-xl flex flex-col items-center justify-center transition active:scale-95"
                      >
                        <span className="text-2xl">{item.icon}</span>
                        <span className="text-[10px] font-extrabold text-amber-100 truncate w-full text-center">
                          {item.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Chat Input Bar */}
            <div className="mt-3 flex items-center gap-2">
              {activeTab === 'clan_chat' && (
                <button
                  onClick={() => setShowRequestPicker(!showRequestPicker)}
                  className="bg-amber-700 hover:bg-amber-600 text-amber-100 font-black text-xs px-2.5 py-2.5 rounded-xl border border-amber-600 flex items-center gap-1 shadow shrink-0"
                  title="Pedir suministros al clan"
                >
                  <HandHeart className="w-4 h-4 text-yellow-300" />
                  <span className="hidden sm:inline">Pedir</span>
                </button>
              )}

              <input
                type="text"
                placeholder={
                  activeTab === 'clan_chat'
                    ? 'Escribe al clan de granjeros...'
                    : 'Chat global con otros jugadores...'
                }
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                className="flex-1 bg-amber-950/80 border border-amber-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-amber-100 placeholder-amber-400/60 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />

              <button
                onClick={handleSend}
                className="bg-amber-600 hover:bg-amber-500 text-white p-2.5 rounded-xl shadow active:scale-95 transition"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: Clan Members List */}
        {activeTab === 'members' && (
          <div className="p-4 overflow-y-auto flex-1 space-y-2.5">
            {clan.members.map((member) => (
              <div
                key={member.id}
                className="bg-amber-950/70 border border-amber-800/80 rounded-2xl p-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <span className="text-3xl">{member.avatar}</span>
                    {member.isOnline ? (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-amber-950 rounded-full" />
                    ) : (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-stone-500 border-2 border-amber-950 rounded-full" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-sm text-amber-100">
                        {member.name}
                      </h4>
                      <span className="text-[10px] bg-amber-800 text-amber-200 px-1.5 py-0.2 rounded font-bold">
                        Nv.{member.level}
                      </span>
                    </div>
                    <span className="text-xs text-amber-300 capitalize">
                      {member.role === 'leader' ? '👑 Líder' : member.role === 'elder' ? '⭐ Veterano' : 'Granjero'}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-black text-yellow-300 block">
                    {member.donationsMonth} donaciones
                  </span>
                  <span className="text-[10px] text-amber-400">este mes</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

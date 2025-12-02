
import React, { useState, useEffect, useRef } from 'react';
import { Coach, ChatChannel, ChatMessage } from '../types';
import { MOCK_COACHES, MOCK_CHATS } from '../constants';
import { 
  MessageSquare, 
  Users, 
  Plus, 
  Send, 
  MoreVertical, 
  Trash2, 
  Search, 
  Circle,
  Hash,
  User,
  X
} from 'lucide-react';

const CoachesChat: React.FC = () => {
  const [coaches, setCoaches] = useState<Coach[]>(MOCK_COACHES);
  const [channels, setChannels] = useState<ChatChannel[]>(MOCK_CHATS);
  const [activeChannelId, setActiveChannelId] = useState<string>('general');
  const [newMessage, setNewMessage] = useState("");
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // New Coach Form State
  const [newCoachName, setNewCoachName] = useState("");
  const [newCoachRole, setNewCoachRole] = useState("");

  const activeChannel = channels.find(c => c.id === activeChannelId) || channels[0];
  const currentUser = coaches.find(c => c.id === 'me') || coaches[0];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeChannel.messages]);

  const handleSendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newMessage.trim()) return;

    const msg: ChatMessage = {
      id: Date.now().toString(),
      senderId: currentUser.id,
      text: newMessage,
      timestamp: new Date()
    };

    setChannels(prev => prev.map(c => {
      if (c.id === activeChannelId) {
        return { ...c, messages: [...c.messages, msg] };
      }
      return c;
    }));

    setNewMessage("");

    // Simulate Reply
    if (activeChannelId === 'general') return; // Don't spam general
    setTimeout(() => {
        const replyMsg: ChatMessage = {
            id: (Date.now() + 1).toString(),
            senderId: activeChannel.participantIds.find(pid => pid !== 'me') || 'c1',
            text: "Got it, Coach.",
            timestamp: new Date()
        };
        setChannels(prev => prev.map(c => {
            if (c.id === activeChannelId) {
                return { ...c, messages: [...c.messages, replyMsg] };
            }
            return c;
        }));
    }, 2000);
  };

  const handleAddCoach = () => {
      if (!newCoachName || !newCoachRole) return;
      const newCoach: Coach = {
          id: `c_${Date.now()}`,
          name: newCoachName,
          role: newCoachRole,
          isOnline: false
      };
      setCoaches([...coaches, newCoach]);
      setNewCoachName("");
      setNewCoachRole("");
  };

  const handleRemoveCoach = (id: string) => {
      if (id === 'me') return;
      setCoaches(coaches.filter(c => c.id !== id));
  };

  const startDM = (coachId: string) => {
      const existingChannel = channels.find(c => !c.isGroup && c.participantIds.includes(coachId));
      if (existingChannel) {
          setActiveChannelId(existingChannel.id);
      } else {
          const coach = coaches.find(c => c.id === coachId);
          if (!coach) return;
          const newChannel: ChatChannel = {
              id: `dm_${coachId}`,
              name: coach.name,
              isGroup: false,
              participantIds: ['me', coachId],
              messages: [],
              unreadCount: 0
          };
          setChannels([...channels, newChannel]);
          setActiveChannelId(newChannel.id);
      }
      setIsManageModalOpen(false);
  };

  return (
    <div className="flex h-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Sidebar */}
      <div className="w-80 bg-slate-50 border-r border-slate-200 flex flex-col">
        <div className="p-4 border-b border-slate-200 bg-white">
          <h2 className="text-xl font-bold text-slate-800 flex items-center">
            <MessageSquare className="w-5 h-5 mr-2 text-indigo-600" />
            Seam Meeting
          </h2>
          <p className="text-xs text-slate-500">Coaches Room</p>
        </div>
        
        <div className="flex-grow overflow-y-auto p-3 space-y-6">
            {/* Group Channels */}
            <div>
                <div className="flex items-center justify-between px-2 mb-2">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Groups</h3>
                    <button 
                        onClick={() => {
                            const name = prompt("Enter Group Name:");
                            if (name) {
                                const newGroup: ChatChannel = {
                                    id: `g_${Date.now()}`,
                                    name,
                                    isGroup: true,
                                    participantIds: ['me'],
                                    messages: [],
                                    unreadCount: 0
                                };
                                setChannels([...channels, newGroup]);
                                setActiveChannelId(newGroup.id);
                            }
                        }} 
                        className="text-slate-400 hover:text-indigo-600"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                </div>
                <div className="space-y-1">
                    {channels.filter(c => c.isGroup).map(c => (
                        <button
                            key={c.id}
                            onClick={() => setActiveChannelId(c.id)}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeChannelId === c.id ? 'bg-indigo-100 text-indigo-900' : 'text-slate-600 hover:bg-slate-200'}`}
                        >
                            <div className="flex items-center">
                                <Hash className="w-4 h-4 mr-2 opacity-50" />
                                {c.name}
                            </div>
                            {c.unreadCount > 0 && (
                                <span className="bg-indigo-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{c.unreadCount}</span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Direct Messages */}
            <div>
                <div className="flex items-center justify-between px-2 mb-2">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Direct Messages</h3>
                    <button onClick={() => setIsManageModalOpen(true)} className="text-slate-400 hover:text-indigo-600">
                        <Plus className="w-4 h-4" />
                    </button>
                </div>
                <div className="space-y-1">
                    {channels.filter(c => !c.isGroup).map(c => {
                        const otherId = c.participantIds.find(id => id !== 'me');
                        const coach = coaches.find(u => u.id === otherId);
                        return (
                            <button
                                key={c.id}
                                onClick={() => setActiveChannelId(c.id)}
                                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeChannelId === c.id ? 'bg-indigo-100 text-indigo-900' : 'text-slate-600 hover:bg-slate-200'}`}
                            >
                                <div className="flex items-center">
                                    <div className="relative mr-2">
                                        <div className="w-6 h-6 bg-slate-300 rounded-full flex items-center justify-center text-xs text-slate-600 overflow-hidden">
                                            {coach?.name.charAt(0)}
                                        </div>
                                        {coach?.isOnline && (
                                            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></div>
                                        )}
                                    </div>
                                    <span className="truncate max-w-[140px]">{c.name}</span>
                                </div>
                                {c.unreadCount > 0 && (
                                    <span className="bg-indigo-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{c.unreadCount}</span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
        
        {/* User Status */}
        <div className="p-4 border-t border-slate-200 bg-white">
            <button 
                onClick={() => setIsManageModalOpen(true)}
                className="w-full flex items-center justify-center py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
                <Users className="w-4 h-4 mr-2" />
                Manage Staff
            </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-grow flex flex-col h-full bg-slate-50/50">
        {/* Chat Header */}
        <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm z-10">
            <div className="flex items-center">
                {activeChannel.isGroup ? (
                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 mr-3">
                        <Hash className="w-5 h-5" />
                    </div>
                ) : (
                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mr-3 relative">
                        {activeChannel.name.charAt(0)}
                        {coaches.find(c => activeChannel.participantIds.includes(c.id) && c.id !== 'me')?.isOnline && (
                             <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></div>
                        )}
                    </div>
                )}
                <div>
                    <h3 className="font-bold text-slate-800 text-lg leading-tight">{activeChannel.name}</h3>
                    <p className="text-xs text-slate-500">
                        {activeChannel.isGroup 
                            ? `${activeChannel.participantIds.length} members` 
                            : coaches.find(c => activeChannel.participantIds.includes(c.id) && c.id !== 'me')?.role || 'Coach'
                        }
                    </p>
                </div>
            </div>
            <button className="text-slate-400 hover:text-slate-600">
                <MoreVertical className="w-5 h-5" />
            </button>
        </div>

        {/* Messages */}
        <div className="flex-grow overflow-y-auto p-6 space-y-4">
            {activeChannel.messages.map((msg, index) => {
                const isMe = msg.senderId === 'me';
                const sender = coaches.find(c => c.id === msg.senderId);
                const showHeader = index === 0 || activeChannel.messages[index-1].senderId !== msg.senderId;

                return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`flex flex-col max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                            {showHeader && !isMe && (
                                <span className="text-xs text-slate-500 mb-1 ml-1">{sender?.name}</span>
                            )}
                            <div className={`px-4 py-3 rounded-2xl text-sm shadow-sm ${
                                isMe 
                                ? 'bg-indigo-600 text-white rounded-tr-none' 
                                : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
                            }`}>
                                {msg.text}
                            </div>
                            <span className="text-[10px] text-slate-400 mt-1 px-1">
                                {msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>
                        </div>
                    </div>
                );
            })}
            <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-slate-200">
            <form onSubmit={handleSendMessage} className="relative">
                <input 
                    type="text" 
                    className="w-full bg-slate-100 border border-slate-200 rounded-full pl-5 pr-12 py-3 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    placeholder={`Message ${activeChannel.name}...`}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                />
                <button 
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors"
                >
                    <Send className="w-4 h-4" />
                </button>
            </form>
        </div>
      </div>

      {/* Manage Staff Modal */}
      {isManageModalOpen && (
        <div className="absolute inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-slate-800 flex items-center">
                        <Users className="w-5 h-5 mr-2 text-indigo-600" />
                        Manage Coaching Staff
                    </h3>
                    <button onClick={() => setIsManageModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="p-6">
                    <div className="space-y-3 mb-6 max-h-60 overflow-y-auto pr-2">
                        {coaches.map(coach => (
                            <div key={coach.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                                <div className="flex items-center">
                                    <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-slate-600 font-bold text-xs mr-3">
                                        {coach.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-800">{coach.name} {coach.id === 'me' && '(You)'}</p>
                                        <p className="text-xs text-slate-500">{coach.role}</p>
                                    </div>
                                </div>
                                <div className="flex space-x-2">
                                    {coach.id !== 'me' && (
                                        <>
                                            <button 
                                                onClick={() => startDM(coach.id)}
                                                className="p-1.5 text-indigo-600 hover:bg-indigo-100 rounded"
                                                title="Message"
                                            >
                                                <MessageSquare className="w-4 h-4" />
                                            </button>
                                            <button 
                                                onClick={() => handleRemoveCoach(coach.id)}
                                                className="p-1.5 text-red-500 hover:bg-red-100 rounded"
                                                title="Remove"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="pt-4 border-t border-slate-200">
                        <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Add New Coach</h4>
                        <div className="space-y-3">
                            <input 
                                className="w-full p-2 border rounded text-sm" 
                                placeholder="Coach Name"
                                value={newCoachName}
                                onChange={e => setNewCoachName(e.target.value)}
                            />
                            <div className="flex gap-2">
                                <input 
                                    className="flex-1 p-2 border rounded text-sm" 
                                    placeholder="Role (e.g. 1st Base)"
                                    value={newCoachRole}
                                    onChange={e => setNewCoachRole(e.target.value)}
                                />
                                <button 
                                    onClick={handleAddCoach}
                                    disabled={!newCoachName || !newCoachRole}
                                    className="bg-indigo-600 text-white px-4 py-2 rounded text-sm font-bold hover:bg-indigo-700 disabled:opacity-50"
                                >
                                    Add
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default CoachesChat;
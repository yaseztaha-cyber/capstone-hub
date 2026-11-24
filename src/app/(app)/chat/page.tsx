'use client';

import { useState, useRef, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { useTranslations } from '@/lib/useTranslations';
import { Card } from '@/components/ui/Card';
import { Send, User } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';

export default function ChatPage() {
  const { chatMessages, sendChatMessageAction, currentUser, members } = useAppStore();
  const { t } = useTranslations();
  const [message, setMessage] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages.length]);

  const handleSend = () => {
    if (!message.trim()) return;
    sendChatMessageAction(message.trim());
    setMessage('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getUserName = (userId: string) => {
    const member = members.find(m => m.userId === userId);
    return member?.user.name || 'Unknown';
  };

  return (
    <div className="p-6 max-w-3xl mx-auto flex flex-col h-[calc(100vh-8rem)]">
      <div className="mb-4">
        <h1 className="text-xl font-semibold text-gray-900">{t('teamChat')}</h1>
        <p className="text-sm text-gray-500 mt-0.5">{t('teamChatDescription')}</p>
      </div>

      <Card className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {chatMessages.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-gray-500">{t('noMessagesYet')}</p>
            </div>
          ) : (
            chatMessages.map(msg => {
              const isMe = msg.userId === currentUser?.id;
              return (
                <div key={msg.id} className={cn('flex gap-2', isMe && 'flex-row-reverse')}>
                  <div className="w-7 h-7 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
                    <User size={14} className="text-teal-700" />
                  </div>
                  <div className={cn('max-w-[70%]', isMe && 'text-right')}>
                    <div className="flex items-center gap-2 mb-0.5" style={{ flexDirection: isMe ? 'row-reverse' : 'row' }}>
                      <span className="text-xs font-medium text-gray-900">{isMe ? t('you') : getUserName(msg.userId)}</span>
                      <span className="text-xs text-gray-400">{formatDate(msg.timestamp)}</span>
                    </div>
                    <div className={cn(
                      'px-3 py-2 rounded-lg text-sm leading-relaxed',
                      isMe ? 'bg-teal-700 text-white rounded-tr-sm' : 'bg-gray-100 text-gray-900 rounded-tl-sm'
                    )}>
                      {msg.content}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-gray-200 p-3">
          <div className="flex items-end gap-2">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('typeMessagePlaceholder')}
              rows={1}
              className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 resize-none"
            />
            <button
              onClick={handleSend}
              disabled={!message.trim()}
              className="p-2 bg-teal-700 text-white rounded-lg hover:bg-teal-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}

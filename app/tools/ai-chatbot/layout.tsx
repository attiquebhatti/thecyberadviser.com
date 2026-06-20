// Server Component — sets dynamic rendering for all AI Training Chatbot pages
export const dynamic = 'force-dynamic';

import { ChatbotInit } from './ChatbotInit';

export default function AiChatbotLayout({ children }: { children: React.ReactNode }) {
  return (
    <ChatbotInit>
      <div className="min-h-screen bg-[#0a0e1a] text-slate-100 pt-24">
        {children}
      </div>
    </ChatbotInit>
  );
}

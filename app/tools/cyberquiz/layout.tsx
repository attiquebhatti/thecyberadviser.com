// Server Component — sets dynamic rendering for all CyberQuiz pages
// (prevents SSR prerender errors from socket.io-client / browser globals)
export const dynamic = 'force-dynamic';

import { CyberQuizInit } from './CyberQuizInit';

export default function CyberQuizLayout({ children }: { children: React.ReactNode }) {
  return (
    <CyberQuizInit>
      <div className="bg-[#0f0f1a] min-h-screen text-[#f1f5f9] pt-24">
        {children}
      </div>
    </CyberQuizInit>
  );
}

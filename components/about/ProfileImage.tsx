'use client';

export function ProfileImage() {
  return (
    <div className="group relative">
      <div className="absolute -inset-8 bg-gradient-to-r from-[#FFC300]/10 to-transparent blur-3xl opacity-0 group-hover:opacity-40 transition-opacity duration-700" />
      
      <div className="relative aspect-[4/5] rounded-2xl overflow-hidden border border-white/[0.04] bg-obsidian-900/40 p-1.5 transition-all duration-500 group-hover:scale-[1.01] group-hover:border-[#FFC300]/30 group-hover:shadow-[0_20px_50px_rgba(255,195,0,0.05)]">
        {/* interactive top highlight */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-[#FFC300]/20 group-hover:bg-[#FFC300] transition-colors duration-500 z-20" />
        
        <div className="relative w-full h-full rounded-[calc(1rem+2px)] overflow-hidden border border-white/[0.06] bg-obsidian-950">
          <img
            src="/images/profile.jpg"
            alt="Attique Bhatti - Cybersecurity Advisor"
            className="w-full h-full object-cover object-center grayscale-[0.2] group-hover:grayscale-0 transition-all duration-700 group-hover:scale-[1.02]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-500" />
          
          <div className="absolute bottom-6 left-6 right-6 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
            <p className="text-white font-bold text-lg leading-tight">Attique Bhatti</p>
            <p className="text-[#FFC300] text-xs font-semibold uppercase tracking-wider mt-1">Enterprise Security Consultant</p>
          </div>
        </div>
      </div>
    </div>
  );
}

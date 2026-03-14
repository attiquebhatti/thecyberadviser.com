'use client';

export function ProfileImage() {
  return (
    <div className="relative">
      <div className="absolute -inset-8 bg-gradient-to-r from-amber-500/10 to-transparent blur-3xl opacity-40" />
      <div className="relative aspect-[4/5] rounded-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#003566]/30 to-[#001D3D]/50 border-2 border-[#003566]" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#FFC300]/40 to-transparent" />
        <div className="absolute inset-4">
          <div className="relative w-full h-full rounded-xl overflow-hidden border border-[#003566]/60">
            <img
              src="/images/profile.jpg"
              alt="Attique Bhatti - Cybersecurity Advisor"
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#000814]/40 via-transparent to-transparent pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );
}

export const STORE_SITE_STYLES = `
  @keyframes marquee {
    0% { transform: translateX(0%); }
    100% { transform: translateX(-50%); }
  }
  .store-animate-marquee {
    display: flex;
    width: 200%;
    animation: marquee 35s linear infinite;
  }
  .store-animate-marquee:hover {
    animation-play-state: paused;
  }
  @keyframes wave {
    0%, 100% { transform: scaleY(0.25); }
    50% { transform: scaleY(1); }
  }
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-6px); }
  }
  .store-animate-float {
    animation: float 5s infinite ease-in-out;
  }
  .store-hide-scrollbar::-webkit-scrollbar { display: none; }
  .store-hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
  @keyframes slideUp { from { transform: translateY(16px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  .store-animate-slide-up { animation: slideUp 0.28s ease-out; }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  .store-animate-fade-in { animation: fadeIn 0.25s ease-out; }
  /* Legacy class names used by the Coming Soon phone simulator */
  .animate-marquee {
    display: flex;
    width: 200%;
    animation: marquee 35s linear infinite;
  }
  .animate-marquee:hover { animation-play-state: paused; }
  .hide-scrollbar::-webkit-scrollbar { display: none; }
  .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
  .animate-slide-up { animation: slideUp 0.28s ease-out; }
  .animate-fade-in { animation: fadeIn 0.25s ease-out; }
  .animate-float { animation: float 5s infinite ease-in-out; }
`;

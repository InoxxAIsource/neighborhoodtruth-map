import { motion } from 'framer-motion';
import { sceneTransitions } from '@/lib/video/animations';
import { useEffect, useState } from 'react';

export const Scene3CommunityVotes = () => {
  const [score, setScore] = useState(12);

  useEffect(() => {
    const timer = setInterval(() => {
      setScore(s => (s < 248 ? s + Math.floor(Math.random() * 8) + 2 : 248));
    }, 40);
    return () => clearInterval(timer);
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center z-10"
      {...sceneTransitions.pushLeft}
    >
      <div className="flex flex-col items-center gap-12 w-full px-8">
        <motion.div
          className="bg-white/10 backdrop-blur-xl border border-white/20 p-12 rounded-[2.5rem] flex flex-col items-center gap-8 w-[80vw] shadow-[0_0_50px_rgba(34,197,94,0.15)]"
          initial={{ scale: 0.8, opacity: 0, rotateY: 45 }}
          animate={{ scale: 1, opacity: 1, rotateY: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="bg-brand-navy border-2 border-brand-teal px-8 py-3 rounded-full text-[2.25vw] font-display font-bold text-white mb-2 shadow-lg">
            🌙 Safe at night
          </div>
          
          <div className="flex items-center justify-center gap-10 bg-black/20 w-full py-8 rounded-3xl">
            <div className="flex flex-col items-center">
              <motion.div
                className="w-20 h-20 bg-brand-green/20 rounded-full flex items-center justify-center text-brand-green ring-4 ring-brand-green/30"
                animate={{ scale: [1, 1.15, 1], y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 0.6, repeatType: "reverse" }}
              >
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
              </motion.div>
            </div>
            
            <motion.div 
              className="text-[6vw] font-display font-black text-brand-green tabular-nums w-[4ch] text-left drop-shadow-[0_0_15px_rgba(34,197,94,0.5)]"
            >
              +{score}
            </motion.div>
          </div>
        </motion.div>

        <motion.h2
          className="font-display text-[3.5vw] text-white font-bold tracking-tight"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 1, ease: [0.16, 1, 0.3, 1] }}
        >
          Verified by locals.
        </motion.h2>
      </div>
    </motion.div>
  );
};

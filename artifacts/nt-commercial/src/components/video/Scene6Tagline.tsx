import { motion } from 'framer-motion';
import { sceneTransitions } from '@/lib/video/animations';

export const Scene6Tagline = () => {
  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-brand-navy"
      {...sceneTransitions.clipCircle}
    >
      <motion.div
        initial={{ opacity: 0, scale: 1.2, filter: "blur(10px)" }}
        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
        transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col items-center"
      >
        <motion.div 
          className="w-24 h-24 bg-brand-teal rounded-full mb-10 flex items-center justify-center shadow-[0_0_60px_rgba(13,148,136,0.6)] relative"
          initial={{ y: 50, scale: 0 }}
          animate={{ y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.2 }}
        >
          <motion.div 
            className="absolute inset-0 rounded-full border-2 border-brand-teal"
            animate={{ scale: [1, 1.5, 1], opacity: [0.8, 0, 0.8] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          />
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
        </motion.div>

        <motion.h1 
          className="font-display text-6xl md:text-8xl lg:text-[7rem] font-black text-white tracking-tighter"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 1, ease: "easeOut" }}
        >
          NeighborhoodTruth
        </motion.h1>
        
        <motion.p 
          className="font-display text-3xl md:text-4xl text-brand-orange mt-6 mb-16 font-bold tracking-tight"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.2, duration: 1, ease: "easeOut" }}
        >
          Know before you go.
        </motion.p>

        <motion.div
          className="px-8 py-4 rounded-2xl bg-white/5 border border-white/10 text-white/80 font-mono text-2xl tracking-widest"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2, duration: 1 }}
        >
          placelabels.com
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

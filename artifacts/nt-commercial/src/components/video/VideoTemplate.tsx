// Video Template
import { AnimatePresence, motion } from 'framer-motion';
import { useVideoPlayer } from '@/lib/video';
import { Scene1Hook } from './Scene1Hook';
import { Scene2LabelsDrop } from './Scene2LabelsDrop';
import { Scene3CommunityVotes } from './Scene3CommunityVotes';
import { Scene4AIChat } from './Scene4AIChat';
import { Scene5ZoneBloom } from './Scene5ZoneBloom';
import { Scene6Tagline } from './Scene6Tagline';

const SCENE_DURATIONS = {
  hook: 4000,
  labels: 6000,
  votes: 5000,
  chat: 6000,
  zones: 5000,
  tagline: 8000,
};

export default function VideoTemplate() {
  const { currentScene } = useVideoPlayer({
    durations: SCENE_DURATIONS,
  });

  return (
    <div
      className="w-full h-screen overflow-hidden relative flex items-center justify-center font-body text-white bg-brand-navy"
    >
      {/* Background layer outside AnimatePresence for cross-scene continuity */}
      <motion.div 
        className="absolute inset-0 z-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)',
          backgroundSize: '4vw 4vw',
          backgroundPosition: 'center center'
        }}
        animate={{
          scale: currentScene === 0 ? 1.5 : currentScene === 1 ? 1 : currentScene === 5 ? 0 : 1.1,
          opacity: currentScene === 5 ? 0 : 0.2,
          rotate: currentScene * 2, // Slight rotation for subtle movement
        }}
        transition={{ duration: 3, ease: 'easeInOut' }}
      />
      
      {/* Ambient noise for texture */}
      <div className="absolute inset-0 z-[1] opacity-[0.03] pointer-events-none mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }}></div>

      <AnimatePresence mode="wait">
        {currentScene === 0 && <Scene1Hook key="hook" />}
        {currentScene === 1 && <Scene2LabelsDrop key="labels" />}
        {currentScene === 2 && <Scene3CommunityVotes key="votes" />}
        {currentScene === 3 && <Scene4AIChat key="chat" />}
        {currentScene === 4 && <Scene5ZoneBloom key="zones" />}
        {currentScene === 5 && <Scene6Tagline key="tagline" />}
      </AnimatePresence>
    </div>
  );
}

// Video Template
import { AnimatePresence, motion } from 'framer-motion';
import { useState, useRef } from 'react';
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

const TOTAL_MS = Object.values(SCENE_DURATIONS).reduce((a, b) => a + b, 0);

function RecordButton() {
  const [status, setStatus] = useState<'idle' | 'recording' | 'done'>('idle');
  const [countdown, setCountdown] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const downloadUrlRef = useRef<string>('');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function startRecording() {
    try {
      const stream = await (navigator.mediaDevices as any).getDisplayMedia({
        video: { frameRate: 30 },
        audio: false,
        preferCurrentTab: true,
      } as any);

      chunksRef.current = [];
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm';
      const recorder = new MediaRecorder(stream, { mimeType });
      recorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((t: MediaStreamTrack) => t.stop());
        const blob = new Blob(chunksRef.current, { type: mimeType });
        downloadUrlRef.current = URL.createObjectURL(blob);
        setStatus('done');
        if (timerRef.current) clearInterval(timerRef.current);
      };

      recorder.start(200);
      setStatus('recording');
      setCountdown(Math.ceil(TOTAL_MS / 1000));

      timerRef.current = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) {
            clearInterval(timerRef.current!);
            recorder.stop();
            return 0;
          }
          return c - 1;
        });
      }, 1000);

    } catch {
      setStatus('idle');
    }
  }

  function download() {
    const a = document.createElement('a');
    a.href = downloadUrlRef.current;
    a.download = 'neighborhoodtruth-commercial.webm';
    a.click();
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      {status === 'idle' && (
        <button
          onClick={startRecording}
          className="flex items-center gap-2 px-4 py-2 rounded-full text-white text-sm font-semibold shadow-lg"
          style={{ background: '#FF6B35' }}
        >
          <span className="w-3 h-3 rounded-full bg-white inline-block" />
          Record & Download
        </button>
      )}

      {status === 'recording' && (
        <div
          className="flex items-center gap-2 px-4 py-2 rounded-full text-white text-sm font-semibold shadow-lg"
          style={{ background: '#1B2A4A', border: '2px solid #FF6B35' }}
        >
          <span className="w-3 h-3 rounded-full bg-red-500 inline-block animate-pulse" />
          Recording… {countdown}s left
        </div>
      )}

      {status === 'done' && (
        <button
          onClick={download}
          className="flex items-center gap-2 px-4 py-2 rounded-full text-white text-sm font-semibold shadow-lg"
          style={{ background: '#0d9488' }}
        >
          ↓ Download Video
        </button>
      )}

      {status === 'idle' && (
        <p className="text-white/40 text-xs text-right max-w-[160px]">
          Captures this tab for 34 s then saves as .webm
        </p>
      )}
    </div>
  );
}

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
          rotate: currentScene * 2,
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

      <RecordButton />
    </div>
  );
}

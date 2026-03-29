import { useCallback, useRef } from 'react';

function createTone(context, {
  frequency,
  start,
  duration,
  gain,
  type = 'sine',
}) {
  const oscillator = context.createOscillator();
  const gainNode = context.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);

  gainNode.gain.setValueAtTime(0.0001, start);
  gainNode.gain.exponentialRampToValueAtTime(gain, start + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  oscillator.connect(gainNode);
  gainNode.connect(context.destination);

  oscillator.start(start);
  oscillator.stop(start + duration + 0.02);
}

export function useChessSounds() {
  const audioContextRef = useRef(null);

  const ensureContext = useCallback(() => {
    if (typeof window === 'undefined') return null;

    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextCtor) return null;

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContextCtor();
    }

    const context = audioContextRef.current;
    if (context.state === 'suspended') {
      void context.resume().catch(() => {});
    }

    return context;
  }, []);

  const playPattern = useCallback((tones) => {
    const context = ensureContext();
    if (!context) return;

    const start = context.currentTime + 0.005;

    tones.forEach((tone) => {
      createTone(context, {
        ...tone,
        start: start + (tone.offset ?? 0),
      });
    });
  }, [ensureContext]);

  const playMove = useCallback(() => {
    playPattern([
      { frequency: 392, duration: 0.08, gain: 0.04, type: 'triangle' },
      { frequency: 523.25, offset: 0.04, duration: 0.1, gain: 0.03, type: 'triangle' },
    ]);
  }, [playPattern]);

  const playCapture = useCallback(() => {
    playPattern([
      { frequency: 330, duration: 0.08, gain: 0.045, type: 'sawtooth' },
      { frequency: 196, offset: 0.04, duration: 0.12, gain: 0.035, type: 'square' },
    ]);
  }, [playPattern]);

  const playCheck = useCallback(() => {
    playPattern([
      { frequency: 622.25, duration: 0.08, gain: 0.04, type: 'triangle' },
      { frequency: 783.99, offset: 0.05, duration: 0.12, gain: 0.035, type: 'triangle' },
    ]);
  }, [playPattern]);

  const playGameEnd = useCallback(() => {
    playPattern([
      { frequency: 523.25, duration: 0.1, gain: 0.045, type: 'triangle' },
      { frequency: 659.25, offset: 0.08, duration: 0.12, gain: 0.04, type: 'triangle' },
      { frequency: 783.99, offset: 0.16, duration: 0.18, gain: 0.035, type: 'triangle' },
    ]);
  }, [playPattern]);

  return {
    playMove,
    playCapture,
    playCheck,
    playGameEnd,
  };
}

export default useChessSounds;

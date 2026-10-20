import { createContext, useContext, useRef, useState, type ReactNode } from 'react';
import { analyzeAudio, ApiError, type AnalysisResponse, type ExtraModel } from '../lib/api';

// A recording peaking below this (0..1, from AnalyserNode byte data) is treated
// as near-silent -- likely a muted mic or the phone too far from the noise.
const SILENCE_PEAK_THRESHOLD = 0.03;

interface AudioAnalysisContextValue {
  audioLabel: string;
  isRecording: boolean;
  isAnalyzing: boolean;
  result: AnalysisResponse | null;
  error: string | null;
  hasAudio: boolean;
  audioLevel: number;
  silenceWarning: string | null;
  extraModel: ExtraModel | null;
  setExtraModel: (model: ExtraModel | null) => void;
  resetSelection: () => void;
  selectFile: (file: File) => void;
  toggleRecording: () => Promise<void>;
  analyze: () => Promise<void>;
}

const AudioAnalysisContext = createContext<AudioAnalysisContextValue | null>(null);

// Lives above the router's <Outlet/>, so navigating away from Home (e.g. to
// About) and back no longer loses an in-flight analysis or its result --
// only signing out / explicitly clearing the selection does.
export function AudioAnalysisProvider({ children }: { children: ReactNode }) {
  const [audioBlob, setAudioBlob] = useState<Blob | File | null>(null);
  const [audioLabel, setAudioLabel] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [silenceWarning, setSilenceWarning] = useState<string | null>(null);
  const [extraModel, setExtraModel] = useState<ExtraModel | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const peakLevelRef = useRef(0);

  const stopLevelMeter = () => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    audioContextRef.current?.close();
    audioContextRef.current = null;
    setAudioLevel(0);
  };

  const resetSelection = () => {
    setAudioBlob(null);
    setAudioLabel('');
    setResult(null);
    setError(null);
    setSilenceWarning(null);
  };

  const selectFile = (file: File) => {
    setResult(null);
    setError(null);
    setSilenceWarning(null);
    setAudioBlob(file);
    setAudioLabel(file.name);
  };

  const toggleRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];

      const AudioContextCtor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      const audioContext = new AudioContextCtor();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      audioContextRef.current = audioContext;
      peakLevelRef.current = 0;

      const levelData = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteTimeDomainData(levelData);
        let peak = 0;
        for (let i = 0; i < levelData.length; i++) {
          const amplitude = Math.abs(levelData[i] - 128) / 128;
          if (amplitude > peak) peak = amplitude;
        }
        setAudioLevel(peak);
        if (peak > peakLevelRef.current) peakLevelRef.current = peak;
        animationFrameRef.current = requestAnimationFrame(tick);
      };
      tick();

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setResult(null);
        setError(null);
        setSilenceWarning(
          peakLevelRef.current < SILENCE_PEAK_THRESHOLD
            ? "This recording sounds very quiet -- make sure you're close to the noise. You can still analyze it, but the result may be unreliable."
            : null
        );
        setAudioBlob(blob);
        setAudioLabel('Recorded audio');
        stream.getTracks().forEach((track) => track.stop());
        stopLevelMeter();
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch {
      setError('Microphone access was denied or is unavailable.');
    }
  };

  const analyze = async () => {
    if (!audioBlob) {
      setError('Please record or upload a sound first.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await analyzeAudio(audioBlob, 'recording.webm', extraModel ?? undefined);
      setResult(response);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Something went wrong. Please try again.';
      setError(message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <AudioAnalysisContext.Provider
      value={{
        audioLabel,
        isRecording,
        isAnalyzing,
        result,
        error,
        hasAudio: audioBlob !== null,
        audioLevel,
        silenceWarning,
        extraModel,
        setExtraModel,
        resetSelection,
        selectFile,
        toggleRecording,
        analyze,
      }}
    >
      {children}
    </AudioAnalysisContext.Provider>
  );
}

export function useAudioAnalysis() {
  const ctx = useContext(AudioAnalysisContext);
  if (!ctx) throw new Error('useAudioAnalysis must be used within an AudioAnalysisProvider');
  return ctx;
}

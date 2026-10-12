import { useEffect, useRef, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import {
  Amount,
  Box,
  Button,
  ChevronLeftIcon,
  Heading,
  IconButton,
  MicIcon,
  PlayIcon,
  Spinner,
  StopCircleIcon,
  Text,
} from '@razorpay/blade/components';
import { cashVoiceNotes, customers } from '../data';
import { useAppState } from '../state/AppStateContext';
import { useNav } from '../state/NavContext';
import { getCustomer, getOutput } from '../state/selectors';
import { parseVoicePayment } from '../utils/parseVoicePayment';
import { formatTime } from '../utils/dates';

type Stage = 'idle' | 'recording' | 'transcribing' | 'transcribed' | 'thinking' | 'matched' | 'no_amount';

// A real voice note, really transcribed (Web Speech API — free, no key, no
// backend) and really matched (name + amount parsing against the live
// customer/bill data, same spirit as allocateOldestFirst). Works for any of
// the 5 customers, not just one scripted scenario. If the browser has no
// mic or no speech recognition, it falls back to the scripted Verma
// transcript below, which still flows through the same real matching —
// the demo can't dead-end either way.
const FALLBACK_NOTE = cashVoiceNotes[0];
const BAR_COUNT = 28;
const MAX_SECONDS = 15;
const PRIMARY = 'hsla(218, 89%, 51%, 1)';
const RECORDING_RED = 'hsla(4, 85%, 44%, 1)';

const pulse = keyframes`
  0% { box-shadow: 0 0 0 0 hsla(4, 85%, 44%, 0.45); }
  70% { box-shadow: 0 0 0 14px hsla(4, 85%, 44%, 0); }
  100% { box-shadow: 0 0 0 0 hsla(4, 85%, 44%, 0); }
`;

const RecDot = styled.span`
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: ${RECORDING_RED};
  animation: ${pulse} 1.4s ease-out infinite;
`;

const Bars = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  height: 64px;
  width: 100%;
`;

const Bar = styled.span<{ $h: number; $color: string }>`
  width: 5px;
  border-radius: 3px;
  background: ${({ $color }) => $color};
  height: ${({ $h }) => Math.max(4, Math.round($h * 64))}px;
  transition: height 80ms linear;
`;

function formatDuration(seconds: number) {
  const s = Math.max(0, Math.round(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function getSpeechRecognitionCtor(): SpeechRecognitionConstructor | undefined {
  return window.SpeechRecognition ?? window.webkitSpeechRecognition;
}

export function AddCashScreen() {
  const { state, recordVoicePayment } = useAppState();
  const { back, navigate } = useNav();
  const [stage, setStage] = useState<Stage>('idle');
  const [levels, setLevels] = useState<number[]>(() => Array(BAR_COUNT).fill(0));
  const [elapsed, setElapsed] = useState(0);
  const [liveText, setLiveText] = useState('');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recordedAt, setRecordedAt] = useState<string | null>(null);
  const [eventId, setEventId] = useState<string | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const startedAtRef = useRef(0);
  const playerRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const finalTranscriptRef = useRef('');

  const out = eventId ? getOutput(state, eventId) : undefined;

  function stopMeters() {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    if (timerRef.current !== null) window.clearInterval(timerRef.current);
    rafRef.current = null;
    timerRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    void audioCtxRef.current?.close().catch(() => undefined);
    audioCtxRef.current = null;
  }

  function stopRecognition() {
    try {
      recognitionRef.current?.stop();
    } catch {
      // Already stopped — nothing to do.
    }
    recognitionRef.current = null;
  }

  // Clean up the microphone, recognizer, meters and recording URL when
  // leaving the screen.
  useEffect(
    () => () => {
      stopMeters();
      stopRecognition();
      if (recorderRef.current && recorderRef.current.state !== 'inactive') recorderRef.current.stop();
      playerRef.current?.pause();
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    },
    [],
  );

  function resetRecording() {
    setStage('idle');
    setTranscript('');
    setLiveText('');
    setAudioUrl(null);
    setDuration(null);
    setEventId(null);
    finalTranscriptRef.current = '';
  }

  function simulateRecording() {
    setRecordedAt(new Date().toISOString());
    setStage('recording');
    setTimeout(() => {
      setTranscript(FALLBACK_NOTE.transcript);
      setStage('transcribed');
    }, 1300);
  }

  async function startRecording() {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      simulateRecording();
      return;
    }
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      simulateRecording();
      return;
    }
    streamRef.current = stream;
    setRecordedAt(new Date().toISOString());

    // Live level meter from the real microphone signal.
    const ctx = new AudioContext();
    audioCtxRef.current = ctx;
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    ctx.createMediaStreamSource(stream).connect(analyser);
    const data = new Uint8Array(analyser.fftSize);
    const tick = () => {
      analyser.getByteTimeDomainData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i++) {
        const v = (data[i] - 128) / 128;
        sum += v * v;
      }
      const level = Math.min(1, Math.sqrt(sum / data.length) * 4);
      setLevels((prev) => [...prev.slice(1), level]);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    const chunks: Blob[] = [];
    const recorder = new MediaRecorder(stream);
    recorderRef.current = recorder;
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      const url = URL.createObjectURL(blob);
      urlRef.current = url;
      setAudioUrl(url);
      setDuration((performance.now() - startedAtRef.current) / 1000);
    };

    // Real transcription, running alongside the recording — free, no API
    // key, no backend (the browser's own speech recognition). If it's not
    // available (e.g. Safari/Firefox), recording still works; the
    // transcript just falls back to the scripted line on stop.
    finalTranscriptRef.current = '';
    setLiveText('');
    const SpeechRecognitionCtor = getSpeechRecognitionCtor();
    if (SpeechRecognitionCtor) {
      const recognition = new SpeechRecognitionCtor();
      recognition.lang = 'en-IN';
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.onresult = (e) => {
        let finalChunk = '';
        let interimChunk = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const piece = e.results[i][0].transcript;
          if (e.results[i].isFinal) finalChunk += piece;
          else interimChunk += piece;
        }
        if (finalChunk) finalTranscriptRef.current += finalChunk;
        setLiveText(finalTranscriptRef.current + interimChunk);
      };
      recognition.onerror = () => {
        // Swallow — stopRecording() falls back to the scripted transcript
        // if nothing was ever recognized.
      };
      try {
        recognition.start();
        recognitionRef.current = recognition;
      } catch {
        recognitionRef.current = null;
      }
    }

    startedAtRef.current = performance.now();
    setElapsed(0);
    setLevels(Array(BAR_COUNT).fill(0));
    timerRef.current = window.setInterval(() => {
      const secs = (performance.now() - startedAtRef.current) / 1000;
      setElapsed(secs);
      if (secs >= MAX_SECONDS) stopRecording();
    }, 200);
    recorder.start();
    setStage('recording');
  }

  function stopRecording() {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') recorderRef.current.stop();
    stopRecognition();
    stopMeters();
    setStage('transcribing');
    // Give the recognizer's async final result a moment to land before
    // reading it back.
    setTimeout(() => {
      const recognized = finalTranscriptRef.current.trim();
      setTranscript(recognized || FALLBACK_NOTE.transcript);
      setStage('transcribed');
    }, 1200);
  }

  function togglePlay() {
    if (!audioUrl) return;
    if (!playerRef.current) {
      playerRef.current = new Audio(audioUrl);
      playerRef.current.onended = () => setIsPlaying(false);
    }
    if (isPlaying) {
      playerRef.current.pause();
      playerRef.current.currentTime = 0;
      setIsPlaying(false);
    } else {
      void playerRef.current.play();
      setIsPlaying(true);
    }
  }

  function matchIt() {
    playerRef.current?.pause();
    setIsPlaying(false);

    const parsed = parseVoicePayment(transcript, customers);
    if (parsed.amount === null) {
      setStage('no_amount');
      return;
    }
    const amount = parsed.amount;
    const newEventId = `voice_${Date.now()}`;
    setEventId(newEventId);
    setStage('thinking');
    setTimeout(() => {
      recordVoicePayment({
        eventId: newEventId,
        transcript,
        recordedAt: recordedAt ?? new Date().toISOString(),
        audioLabel: duration !== null ? `Voice note · ${formatDuration(duration)}` : FALLBACK_NOTE.audioLabel,
        amount,
        customerId: parsed.customerId,
        rawLabel: parsed.rawLabel,
      });
      setStage('matched');
    }, 1300);
  }

  const isLiveRecording = stage === 'recording' && streamRef.current !== null;
  const noteLabel = duration !== null ? `Voice note · ${formatDuration(duration)}` : FALLBACK_NOTE.audioLabel;
  const matchedCustomer = out?.payerMatch.customerId ? getCustomer(out.payerMatch.customerId) : undefined;

  return (
    <Box>
      <Box
        display="flex"
        alignItems="center"
        gap="spacing.2"
        padding="spacing.4"
        borderBottomWidth="thin"
        borderColor="surface.border.gray.muted"
      >
        <IconButton icon={ChevronLeftIcon} accessibilityLabel="Back" onClick={back} />
        <Heading size="small">Add cash</Heading>
      </Box>

      <Box padding="spacing.6" display="flex" flexDirection="column" alignItems="center">
        {stage === 'idle' && (
          <Box display="flex" flexDirection="column" alignItems="center" gap="spacing.5" paddingTop="spacing.9">
            <Text color="surface.text.gray.muted" textAlign="center">
              Got cash from a customer? Just say their name and the amount — Hisaab Agent will match it to their
              bills.
            </Text>
            <Box padding="spacing.4" backgroundColor="surface.background.gray.moderate" borderRadius="medium">
              <Text size="small" color="surface.text.gray.muted" textAlign="center">
                Try saying
              </Text>
              <Text marginTop="spacing.1" textAlign="center" weight="semibold">
                "Verma ne 8000 cash diye"
              </Text>
            </Box>
            <Button icon={MicIcon} size="large" onClick={() => void startRecording()}>
              Record voice note
            </Button>
          </Box>
        )}

        {stage === 'recording' && isLiveRecording && (
          <Box width="100%" display="flex" flexDirection="column" alignItems="center" gap="spacing.5" paddingTop="spacing.8">
            <Box display="flex" alignItems="center" gap="spacing.3">
              <RecDot />
              <Text weight="semibold">Listening… {formatDuration(elapsed)}</Text>
            </Box>
            <Bars aria-hidden>
              {levels.map((h, i) => (
                <Bar key={i} $h={h} $color={PRIMARY} />
              ))}
            </Bars>
            <Text size="small" color="surface.text.gray.muted" textAlign="center">
              {liveText ? `"${liveText}"` : "Tap stop when you're done"}
            </Text>
            <Button icon={StopCircleIcon} variant="secondary" size="large" onClick={stopRecording}>
              Stop
            </Button>
          </Box>
        )}

        {stage === 'recording' && !isLiveRecording && (
          <Box display="flex" flexDirection="column" alignItems="center" gap="spacing.4" paddingTop="spacing.10">
            <Spinner accessibilityLabel="Recording" label="Recording…" labelPosition="bottom" size="large" />
          </Box>
        )}

        {stage === 'transcribing' && (
          <Box display="flex" flexDirection="column" alignItems="center" gap="spacing.4" paddingTop="spacing.10">
            <Spinner
              accessibilityLabel="Hisaab Agent is transcribing"
              label="Hisaab Agent is transcribing…"
              labelPosition="bottom"
              size="large"
              color="primary"
            />
          </Box>
        )}

        {(stage === 'transcribed' || stage === 'thinking' || stage === 'matched' || stage === 'no_amount') && (
          <Box width="100%" display="flex" flexDirection="column" gap="spacing.5">
            <Box padding="spacing.4" backgroundColor="surface.background.gray.moderate" borderRadius="medium">
              <Box display="flex" alignItems="center" justifyContent="space-between" gap="spacing.3">
                <Text size="small" color="surface.text.gray.muted">
                  {noteLabel} · {formatTime(recordedAt ?? FALLBACK_NOTE.recordedAt)}
                </Text>
                {audioUrl && (
                  <Button
                    size="small"
                    variant="tertiary"
                    icon={isPlaying ? StopCircleIcon : PlayIcon}
                    onClick={togglePlay}
                  >
                    {isPlaying ? 'Stop' : 'Play'}
                  </Button>
                )}
              </Box>
              <Text marginTop="spacing.2" size="large">
                "{transcript}"
              </Text>
            </Box>

            {stage === 'transcribed' && (
              <Button isFullWidth onClick={matchIt}>
                Match it
              </Button>
            )}

            {stage === 'no_amount' && (
              <Box display="flex" flexDirection="column" gap="spacing.3">
                <Text size="small" color="surface.text.gray.muted">
                  Didn't catch an amount in that — try recording again, with a number.
                </Text>
                <Button variant="secondary" isFullWidth onClick={resetRecording}>
                  Record again
                </Button>
              </Box>
            )}

            {stage === 'thinking' && (
              <Box display="flex" justifyContent="center" paddingY="spacing.6">
                <Spinner
                  accessibilityLabel="Hisaab Agent is matching"
                  label="Hisaab Agent is matching…"
                  labelPosition="bottom"
                  size="large"
                  color="primary"
                />
              </Box>
            )}

            {stage === 'matched' && out && (
              <Box display="flex" flexDirection="column" gap="spacing.4">
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Text weight="semibold">{matchedCustomer?.name ?? `"${out.payerMatch.rawLabel}"`}</Text>
                  <Amount value={out.amount} suffix="none" size="large" type="heading" />
                </Box>
                <Text size="small" color="surface.text.gray.muted">
                  {out.payerMatch.reasoning}
                </Text>
                <Button isFullWidth onClick={() => eventId && navigate({ name: 'matchDetail', eventId })}>
                  Review match
                </Button>
              </Box>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
}

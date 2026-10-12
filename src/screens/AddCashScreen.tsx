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
import { aiOutputs, cashVoiceNotes } from '../data';
import { useNav } from '../state/NavContext';
import { getCustomer } from '../state/selectors';
import { formatTime } from '../utils/dates';

type Stage = 'idle' | 'recording' | 'transcribing' | 'transcribed' | 'thinking' | 'matched';

// This demo has exactly one voice note scenario (Verma, ₹8,000 cash) —
// matches the PRD's own demo moment. The microphone recording is real (the
// merchant's own voice, with a live level meter and playback), but the
// transcript and match are pre-computed, like every other AI output here.
// If the microphone isn't available or permission is denied, it falls back
// to the simulated recording.
const NOTE = cashVoiceNotes[0];
const OUT = aiOutputs[NOTE.id];
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

export function AddCashScreen() {
  const { back, navigate } = useNav();
  const [stage, setStage] = useState<Stage>('idle');
  const [levels, setLevels] = useState<number[]>(() => Array(BAR_COUNT).fill(0));
  const [elapsed, setElapsed] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const startedAtRef = useRef(0);
  const playerRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);

  const customer = getCustomer(OUT.payerMatch.customerId ?? '');

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

  // Clean up the microphone, meters and recording URL when leaving the screen.
  useEffect(
    () => () => {
      stopMeters();
      if (recorderRef.current && recorderRef.current.state !== 'inactive') recorderRef.current.stop();
      playerRef.current?.pause();
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    },
    [],
  );

  function simulateRecording() {
    setStage('recording');
    setTimeout(() => setStage('transcribed'), 1300);
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
    stopMeters();
    setStage('transcribing');
    setTimeout(() => setStage('transcribed'), 1200);
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
    setStage('thinking');
    setTimeout(() => setStage('matched'), 1300);
  }

  const isLiveRecording = stage === 'recording' && streamRef.current !== null;
  const noteLabel = duration !== null ? `Voice note · ${formatDuration(duration)}` : NOTE.audioLabel;

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
              Got cash from a customer? Just say it, and Hisaab Agent will match it to their bills.
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
            <Text size="small" color="surface.text.gray.muted">
              Tap stop when you're done
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

        {(stage === 'transcribed' || stage === 'thinking' || stage === 'matched') && (
          <Box width="100%" display="flex" flexDirection="column" gap="spacing.5">
            <Box padding="spacing.4" backgroundColor="surface.background.gray.moderate" borderRadius="medium">
              <Box display="flex" alignItems="center" justifyContent="space-between" gap="spacing.3">
                <Text size="small" color="surface.text.gray.muted">
                  {noteLabel} · {formatTime(NOTE.recordedAt)}
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
                "{NOTE.transcript}"
              </Text>
            </Box>

            {stage === 'transcribed' && (
              <Button isFullWidth onClick={matchIt}>
                Match it
              </Button>
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

            {stage === 'matched' && (
              <Box display="flex" flexDirection="column" gap="spacing.4">
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Text weight="semibold">{customer?.name ?? 'Unidentified'}</Text>
                  <Amount value={OUT.amount} suffix="none" size="large" type="heading" />
                </Box>
                <Text size="small" color="surface.text.gray.muted">
                  {OUT.payerMatch.reasoning}
                </Text>
                <Button isFullWidth onClick={() => navigate({ name: 'matchDetail', eventId: NOTE.id })}>
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

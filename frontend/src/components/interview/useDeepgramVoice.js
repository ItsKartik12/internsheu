import { useCallback, useEffect, useRef, useState } from 'react'
import { getDeepgramTokenApi } from '../../services/api'

// Voice pipeline hook — adapted from the reference ai-interviewer
// implementation (Interview.tsx): Deepgram nova-3 WebSocket with the
// `token` subprotocol, MediaRecorder 250ms chunks, 3s KeepAlive heartbeat
// (prevents Deepgram's ~12.8s idle disconnect), interim/final transcript
// handling that never clobbers manual edits, and bounded auto-reconnect.

const DEEPGRAM_WS_URL =
  'wss://api.deepgram.com/v1/listen?model=nova-3&language=en-US&smart_format=true&interim_results=true&endpointing=500'

const MAX_RECONNECT_ATTEMPTS = 3

function getRecorderMimeType() {
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/mp4',
  ]
  if (typeof MediaRecorder === 'undefined') {
    throw new Error('This browser does not support audio recording. Please use Chrome.')
  }
  const supported = candidates.find((type) => MediaRecorder.isTypeSupported(type))
  if (!supported) {
    throw new Error('No supported microphone audio format in this browser.')
  }
  return supported
}

export default function useDeepgramVoice() {
  const [status, setStatus] = useState('idle') // idle | requesting-mic | connecting | listening | error
  const [draft, setDraft] = useState('')
  const [interim, setInterim] = useState('')
  const [error, setError] = useState('')
  const [reconnecting, setReconnecting] = useState(false)

  const socketRef = useRef(null)
  const recorderRef = useRef(null)
  const streamRef = useRef(null)
  const keepAliveRef = useRef(null)
  const trackRef = useRef(null)
  const reconnectAttemptsRef = useRef(0)
  const isReconnectingRef = useRef(false)
  const userEditedRef = useRef(false)
  const draftRef = useRef('')
  const onFinalRef = useRef(null)

  useEffect(() => {
    draftRef.current = draft
  }, [draft])

  /** Set a callback invoked with each finalized transcript segment. */
  const onFinalSegment = useCallback((cb) => {
    onFinalRef.current = cb
  }, [])

  /** Draft setter that marks manual edits so interim text never clobbers them. */
  const editDraft = useCallback((value) => {
    userEditedRef.current = true
    draftRef.current = value
    setDraft(value)
  }, [])

  function clearKeepAlive() {
    if (keepAliveRef.current) {
      window.clearInterval(keepAliveRef.current)
      keepAliveRef.current = null
    }
  }

  function cleanupSession({ keepStream = false } = {}) {
    clearKeepAlive()
    if (recorderRef.current) {
      recorderRef.current.ondataavailable = null
      recorderRef.current.onerror = null
      recorderRef.current.onstop = null
      if (recorderRef.current.state !== 'inactive') {
        try {
          recorderRef.current.stop()
        } catch {}
      }
      recorderRef.current = null
    }
    if (socketRef.current) {
      socketRef.current.onopen = null
      socketRef.current.onclose = null
      socketRef.current.onerror = null
      socketRef.current.onmessage = null
      try {
        socketRef.current.close()
      } catch {}
      socketRef.current = null
    }
    if (!keepStream && streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
      trackRef.current = null
    }
  }

  /** Mute/unmute the mic track non-destructively (AI speaking / processing). */
  const setMicMuted = useCallback((muted) => {
    if (trackRef.current) {
      try {
        trackRef.current.enabled = !muted
      } catch {}
    }
  }, [])

  function setupSocketAndRecorder(token) {
    return new Promise((resolve, reject) => {
      if (!streamRef.current) {
        reject(new Error('Microphone stream is not available.'))
        return
      }
      let socket
      try {
        socket = new WebSocket(DEEPGRAM_WS_URL, ['token', token.trim()])
      } catch (err) {
        reject(new Error('Could not open the speech recognition connection.'))
        return
      }
      socketRef.current = socket

      let opened = false

      socket.onopen = () => {
        opened = true
        let recorder
        try {
          const mimeType = getRecorderMimeType()
          recorder = new MediaRecorder(streamRef.current, { mimeType })
        } catch (err) {
          reject(err)
          return
        }
        recorderRef.current = recorder

        recorder.ondataavailable = (event) => {
          if (event.data.size === 0 || socketRef.current?.readyState !== WebSocket.OPEN) return
          event.data.arrayBuffer().then((audio) => {
            const sock = socketRef.current
            if (sock && sock.readyState === WebSocket.OPEN) {
              try {
                sock.send(audio)
              } catch {}
            }
          })
        }

        recorder.onerror = () => {
          setError('The browser could not read microphone audio.')
          setStatus('error')
        }

        recorder.start(250)

        // 3s KeepAlive heartbeat — keeps the socket open while the candidate
        // thinks, edits the transcript, or the backend generates a question.
        try {
          socket.send(JSON.stringify({ type: 'KeepAlive' }))
        } catch {}
        clearKeepAlive()
        keepAliveRef.current = window.setInterval(() => {
          const sock = socketRef.current
          if (sock && sock.readyState === WebSocket.OPEN) {
            try {
              sock.send(JSON.stringify({ type: 'KeepAlive' }))
            } catch {}
          }
        }, 3000)

        resolve()
      }

      socket.onmessage = (event) => {
        try {
          const received = JSON.parse(event.data)
          if (received.type === 'Metadata') return
          const transcript = received.channel?.alternatives?.[0]?.transcript?.trim()
          if (!transcript) return

          const isFinal = received.is_final === true
          const speechFinal = received.speech_final === true

          if (!isFinal) {
            // Interim: show live, but never overwrite manual edits.
            if (!userEditedRef.current) setInterim(transcript)
            return
          }

          // Final segment: append to the current draft (manual edits kept).
          const current = draftRef.current.trim()
          const next = current ? `${current} ${transcript}` : transcript
          draftRef.current = next
          setDraft(next)
          setInterim('')
          if (speechFinal) userEditedRef.current = false
          if (onFinalRef.current) onFinalRef.current(transcript)
        } catch {}
      }

      socket.onerror = () => {
        if (!opened) {
          reject(new Error('Failed to connect to the speech recognition service.'))
        }
      }

      socket.onclose = (event) => {
        if (!opened) {
          reject(new Error('Speech recognition connection closed before opening.'))
          return
        }
        if (event?.code === 1000) return // clean close (we closed it)
        handleDrop()
      }
    })
  }

  function handleDrop() {
    clearKeepAlive()
    if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
      reconnectAttemptsRef.current += 1
      setReconnecting(true)
      const delay = reconnectAttemptsRef.current * 1200
      setTimeout(() => {
        reconnect().finally(() => setReconnecting(false))
      }, delay)
    } else {
      setError('Speech recognition disconnected. Your text is saved. Click "Reconnect Voice" to resume.')
      setStatus('error')
    }
  }

  const reconnect = useCallback(async () => {
    if (isReconnectingRef.current) return
    isReconnectingRef.current = true
    try {
      cleanupSession({ keepStream: true })
      if (!streamRef.current || trackRef.current?.readyState !== 'live') {
        // Mic track died — need a fresh one.
        await start()
      } else {
        const { token } = await getDeepgramTokenApi()
        await setupSocketAndRecorder(token)
        reconnectAttemptsRef.current = 0
        setError('')
        setStatus('listening')
      }
    } catch (err) {
      setError(err.message || 'Reconnection failed.')
      setStatus('error')
    } finally {
      isReconnectingRef.current = false
    }
  }, [])

  const start = useCallback(async () => {
    setError('')
    reconnectAttemptsRef.current = 0
    userEditedRef.current = false
    try {
      cleanupSession()
      setStatus('requesting-mic')
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      trackRef.current = stream.getAudioTracks()[0] || null

      setStatus('connecting')
      const { token } = await getDeepgramTokenApi()
      await setupSocketAndRecorder(token)
      setStatus('listening')
      return true
    } catch (err) {
      cleanupSession()
      const msg = err?.message || ''
      if (err?.name === 'NotAllowedError' || /permission|denied/i.test(msg)) {
        setError('Microphone permission was denied. Enable it in your browser settings to speak your answers — or type your answer instead.')
      } else if (err?.name === 'NotFoundError' || /not found|no microphone/i.test(msg)) {
        setError('No microphone was found. You can still type your answers.')
      } else {
        setError(msg || 'Could not start the voice connection.')
      }
      setStatus('error')
      return false
    }
  }, [])

  const stop = useCallback(() => {
    cleanupSession()
    setStatus('idle')
    setInterim('')
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupSession()
    }
  }, [])

  return {
    status,
    draft,
    interim,
    error,
    reconnecting,
    start,
    stop,
    reconnect,
    editDraft,
    setMicMuted,
    onFinalSegment,
  }
}

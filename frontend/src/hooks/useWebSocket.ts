import { useCallback, useEffect, useRef, useState } from 'react'
import { useRoomStore } from '@/store/roomStore'
import type { WSEvent } from '@/types'

export type SocketStatus = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error'

export function useWebSocket(roomId: string | undefined, enabled: boolean) {
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const connectRef = useRef<() => void>(() => undefined)
  const shouldReconnect = useRef(true)
  const [status, setStatus] = useState<SocketStatus>('idle')
  const { setMembers, addMember, removeMember, setPomodoro } = useRoomStore()

  const connect = useCallback(() => {
    if (!roomId || !enabled) return
    setStatus('connecting')
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const base = (import.meta.env.VITE_WS_URL as string | undefined) ?? `${protocol}//${window.location.host}`
    const ws = new WebSocket(`${base.replace(/\/$/, '')}/ws/${roomId}`)
    wsRef.current = ws

    ws.onopen = () => {
      setStatus('connected')
      ws.send(JSON.stringify({ event: 'join_room' }))
    }

    ws.onmessage = event => {
      try {
        const message = JSON.parse(String(event.data)) as WSEvent
        switch (message.event) {
          case 'room_state':
            setMembers(message.members)
            setPomodoro(message.pomodoro)
            break
          case 'pomodoro_tick':
            setPomodoro({
              status: message.status,
              remaining_secs: message.remaining_secs,
              duration_secs: message.duration_secs,
              session_id: message.session_id ?? null,
            })
            break
          case 'pomodoro_done':
            setPomodoro({ status: 'completed', remaining_secs: 0, duration_secs: 0, session_id: message.session_id })
            break
          case 'member_joined':
            addMember(message.user)
            break
          case 'member_left':
            removeMember(message.user_id)
            break
          case 'user_typing':
            break
        }
      } catch {
        // Ignore malformed frames; the next room_state will resynchronise the client.
      }
    }

    ws.onerror = () => setStatus('error')
    ws.onclose = () => {
      setStatus('disconnected')
      if (shouldReconnect.current && enabled) reconnectTimer.current = setTimeout(() => connectRef.current(), 3000)
    }
  }, [addMember, enabled, removeMember, roomId, setMembers, setPomodoro])

  useEffect(() => {
    connectRef.current = connect
    shouldReconnect.current = true
    if (enabled) queueMicrotask(connect)
    return () => {
      shouldReconnect.current = false
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current)
      wsRef.current?.close()
      wsRef.current = null
      setStatus('idle')
    }
  }, [connect, enabled])

  const send = useCallback((event: string, payload: Record<string, unknown> = {}) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ event, ...payload }))
      return true
    }
    return false
  }, [])

  return { send, status }
}

import { useCallback, useEffect, useRef } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useRoomStore } from '@/store/roomStore'
import type { WSEvent } from '@/types'

export function useWebSocket(roomId: string | undefined) {
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { setMembers, addMember, removeMember, setPomodoro, tickPomodoro } = useRoomStore()
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)

  const connect = useCallback(() => {
    if (!roomId || !isAuthenticated) return
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = import.meta.env.VITE_WS_URL ?? `${protocol}//${window.location.host}`
    const url = `${host}/ws/${roomId}`
    const ws = new WebSocket(url)
    wsRef.current = ws

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'join_room' }))
    }

    ws.onmessage = (e: MessageEvent) => {
      try {
        const event = JSON.parse(e.data as string) as WSEvent
        switch (event.type) {
          case 'room_state':
            setMembers(event.data.members)
            setPomodoro(event.data.pomodoro)
            break
          case 'pomodoro_tick':
            tickPomodoro(event.data.remaining_secs)
            break
          case 'pomodoro_done':
            setPomodoro({ status: 'done', remaining_secs: 0, session_id: event.data.session_id })
            break
          case 'member_joined':
            addMember(event.data)
            break
          case 'member_left':
            removeMember(event.data.id)
            break
        }
      } catch { /* ignore malformed */ }
    }

    ws.onclose = () => {
      reconnectTimer.current = setTimeout(connect, 3000)
    }

    ws.onerror = () => ws.close()
  }, [roomId, isAuthenticated, setMembers, setPomodoro, tickPomodoro, addMember, removeMember])

  useEffect(() => {
    connect()
    const handleFocus = () => {
      if (!wsRef.current || wsRef.current.readyState > 1) connect()
    }
    window.addEventListener('focus', handleFocus)
    return () => {
      window.removeEventListener('focus', handleFocus)
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current)
      wsRef.current?.close()
    }
  }, [connect])

  const send = useCallback((type: string, data?: Record<string, unknown>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, ...data }))
    }
  }, [])

  return { send }
}

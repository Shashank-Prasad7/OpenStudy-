import { useCallback, useEffect, useRef, useState } from 'react'
import { useRoomStore } from '@/store/roomStore'
import type { WSEvent } from '@/types'

export type SocketStatus = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error'

function getWsBase() {
  const envBase = import.meta.env.VITE_WS_URL as string | undefined
  if (envBase) return envBase.replace(/\/$/, '')

  const apiBase = import.meta.env.VITE_API_URL as string | undefined
  if (apiBase) {
    return apiBase.replace(/^http:/, 'ws:').replace(/^https:/, 'wss:').replace(/\/$/, '')
  }

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${protocol}//${window.location.host}`
}

export function useWebSocket(roomId: string | undefined, enabled: boolean) {
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reconnectAttempts = useRef(0)
  const shouldReconnect = useRef(true)
  const [status, setStatus] = useState<SocketStatus>('idle')
  const [lastCloseReason, setLastCloseReason] = useState<string>('')
  const { setMembers, addMember, removeMember, setPomodoro } = useRoomStore()

  const handleMessage = useCallback((raw: MessageEvent) => {
    try {
      const message = JSON.parse(String(raw.data)) as WSEvent
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
          setPomodoro({ status: 'completed', remaining_secs: 0, duration_secs: 25 * 60, session_id: message.session_id })
          break
        case 'member_joined':
          addMember(message.user)
          break
        case 'member_left':
          removeMember(message.user_id)
          break
        default:
          break
      }
    } catch (error) {
      console.warn('Bad websocket message:', raw.data, error)
    }
  }, [addMember, removeMember, setMembers, setPomodoro])

  const connect = useCallback(() => {
    if (!roomId || !enabled) return
    if (wsRef.current?.readyState === WebSocket.OPEN || wsRef.current?.readyState === WebSocket.CONNECTING) return

    setStatus('connecting')
    setLastCloseReason('')

    let wsUrl = `${getWsBase()}/ws/${roomId}`

const token =
  localStorage.getItem('access_token') ||
  localStorage.getItem('token') ||
  localStorage.getItem('openstudy_token')

if (token) {
  wsUrl += `?token=${encodeURIComponent(token)}`
}

console.info('Opening room websocket:', wsUrl)

const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => {
      reconnectAttempts.current = 0
      setStatus('connected')
      ws.send(JSON.stringify({ event: 'join_room' }))
    }

    ws.onmessage = handleMessage

    ws.onerror = () => {
      setStatus('error')
      console.error('Room websocket error. Check backend, Redis, cookies, and VITE_WS_URL.')
    }

    ws.onclose = event => {
      wsRef.current = null
      setStatus('disconnected')

      const reason = event.code === 1013
        ? 'Redis/backend realtime service is not running.'
        : event.code === 1008
          ? 'Login/session problem or room membership problem.'
          : event.reason || `Closed with code ${event.code}`

      setLastCloseReason(reason)
      console.warn('Room websocket closed:', { code: event.code, reason })

      if (shouldReconnect.current && enabled) {
        const delay = Math.min(1000 * 2 ** reconnectAttempts.current, 8000)
        reconnectAttempts.current += 1
        reconnectTimer.current = setTimeout(connect, delay)
      }
    }
  }, [enabled, handleMessage, roomId])

  useEffect(() => {
    shouldReconnect.current = true
    if (enabled) connect()

    return () => {
      shouldReconnect.current = false
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current)
      wsRef.current?.close(1000, 'leaving room')
      wsRef.current = null
      setStatus('idle')
    }
  }, [connect, enabled, roomId])

  const send = useCallback((event: string, payload: Record<string, unknown> = {}) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ event, ...payload }))
      return true
    }
    return false
  }, [])

  return { send, status, lastCloseReason }
}

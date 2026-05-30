import { useEffect, useRef, useState, useCallback } from 'react'

export function useSignalFeed(onMessage: (msg: unknown) => void) {
  const wsRef = useRef<WebSocket | null>(null)
  const [connected, setConnected] = useState(false)
  const reconnectRef = useRef<ReturnType<typeof setTimeout>>()
  const attemptsRef = useRef(0)

  const connect = useCallback(() => {
    const token = localStorage.getItem('token')
    if (!token) return

    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws'
    const ws = new WebSocket(`${proto}://${window.location.host}/ws/feed?token=${token}`)
    wsRef.current = ws

    ws.onopen = () => {
      setConnected(true)
      attemptsRef.current = 0
    }
    ws.onmessage = (e) => {
      try {
        onMessage(JSON.parse(e.data))
      } catch {
        // ignore parse errors
      }
    }
    ws.onclose = () => {
      setConnected(false)
      const delay = Math.min(1000 * 2 ** attemptsRef.current, 30000)
      attemptsRef.current++
      reconnectRef.current = setTimeout(connect, delay)
    }
    ws.onerror = () => ws.close()
  }, [onMessage])

  useEffect(() => {
    connect()
    return () => {
      clearTimeout(reconnectRef.current)
      wsRef.current?.close()
    }
  }, [connect])

  return connected
}

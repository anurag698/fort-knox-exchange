
"use client";
import { useEffect, useRef, useState } from "react";

type MsgHandler = (data: any) => void;

export default function useWebSocketSafe(
  url: string,
  onMessage: MsgHandler,
  opts?: { autoReconnect?: boolean; maxBackoffMs?: number }
) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef(0);
  const backoffTimerRef = useRef<number | null>(null);
  const [status, setStatus] = useState<"closed" | "connecting" | "open">("closed");

  const autoReconnect = opts?.autoReconnect ?? true;
  const maxBackoffMs = opts?.maxBackoffMs ?? 30000;

  useEffect(() => {
    let mounted = true;

    const connect = () => {
      if (!mounted || !url) return;
      try {
        setStatus("connecting");
        const ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onopen = () => {
          reconnectRef.current = 0;
          setStatus("open");
          console.info("[WS] open", url);
        };

        ws.onmessage = (ev) => {
          try {
            const payload = typeof ev.data === "string" ? JSON.parse(ev.data) : ev.data;
            onMessage(payload);
          } catch (err) {
            console.error("[WS] parse error", err, ev.data);
          }
        };

        ws.onerror = (ev) => {
          console.error("[WS] error event", ev, ws.url);
        };

        ws.onclose = (ev) => {
          console.warn("[WS] closed", ev.code, ev.reason);
          setStatus("closed");
          if (autoReconnect && mounted) scheduleReconnect();
        };
      } catch (err) {
        console.error("[WS] connect failed", err);
        if (autoReconnect && mounted) scheduleReconnect();
      }
    };

    const scheduleReconnect = () => {
      reconnectRef.current++;
      const base = Math.min(maxBackoffMs, 500 * Math.pow(2, Math.min(8, reconnectRef.current)));
      const jitter = Math.random() * 500;
      const delay = base + jitter;
      if (backoffTimerRef.current) window.clearTimeout(backoffTimerRef.current);
      backoffTimerRef.current = window.setTimeout(() => {
        connect();
      }, delay);
      console.info(`[WS] reconnect scheduled in ${Math.round(delay)} ms`);
    };

    connect();

    return () => {
      mounted = false;
      if (backoffTimerRef.current) window.clearTimeout(backoffTimerRef.current);
      try {
        wsRef.current?.close();
      } catch (e) {}
    };
  }, [url, onMessage, autoReconnect, maxBackoffMs]); 

  const send = (obj: any) => {
    try {
      const ws = wsRef.current;
      if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(obj));
      else console.warn("[WS] send failed: not open");
    } catch (err) {
      console.error("[WS] send error", err);
    }
  };

  return { send, status };
}

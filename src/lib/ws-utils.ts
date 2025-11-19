// usage: import { safeWsSend } from "@/lib/ws-utils";
export function safeWsSend(ws: WebSocket | null, msg: any) {
  if (!ws) return;
  try {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(typeof msg === "string" ? msg : JSON.stringify(msg));
      return;
    }
    const onOpen = () => {
      if (ws.readyState === WebSocket.OPEN) {
        try { ws.send(typeof msg === "string" ? msg : JSON.stringify(msg)); } catch {}
      }
      ws.removeEventListener("open", onOpen);
    };
    ws.addEventListener("open", onOpen);
  } catch (e) {}
}

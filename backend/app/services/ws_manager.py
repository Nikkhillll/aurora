"""
Broadcast hub. Lives in services/ (not routers/) so both the WS route and the
ingest route can import it without a circular import.

NOTE: this is per-process state. Run a SINGLE uvicorn worker in production or
half your broadcasts vanish into a process that has no clients attached.
"""
import logging

from fastapi import WebSocket

log = logging.getLogger("aurora.ws")

# websocket -> station_id filter (None = all stations)
_clients: dict[WebSocket, str | None] = {}


async def connect(ws: WebSocket, station_id: str | None) -> None:
    await ws.accept()
    _clients[ws] = station_id
    log.info("client connected (station=%s, total=%d)", station_id, len(_clients))


def disconnect(ws: WebSocket) -> None:
    _clients.pop(ws, None)


def client_count() -> int:
    return len(_clients)


async def broadcast(message: dict, station_id: str | None = None) -> None:
    dead = []
    for ws, subscribed in list(_clients.items()):
        if station_id and subscribed and subscribed != station_id:
            continue
        try:
            await ws.send_json(message)
        except Exception:
            dead.append(ws)
    for ws in dead:
        _clients.pop(ws, None)

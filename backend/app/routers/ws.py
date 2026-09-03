from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.services import state, ws_manager

router = APIRouter()


@router.websocket("/ws/live")
async def live(websocket: WebSocket, station_id: str | None = None):
    await ws_manager.connect(websocket, station_id)
    try:
        # Send current state immediately so the client isn't blank until the
        # next ingest tick.
        if station_id and station_id in state.STATIONS:
            await websocket.send_json(
                {"type": "telemetry", "payload": state.snapshot(station_id)}
            )
        while True:
            msg = await websocket.receive_json()
            if msg.get("type") == "ping":
                await websocket.send_json({"type": "pong"})
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception:
        ws_manager.disconnect(websocket)

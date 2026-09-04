import asyncio
import json
import websockets

async def test():
    async with websockets.connect(
        "ws://127.0.0.1:8000/ws/live?station_id=maitri"
    ) as ws:
        print("CONNECTED")
        print("INITIAL:")
        print(json.dumps(json.loads(await ws.recv()), indent=2))

        print("\nWAITING FOR LIVE UPDATE...")
        message = await ws.recv()

        print("LIVE UPDATE RECEIVED:")
        print(json.dumps(json.loads(message), indent=2))

asyncio.run(test())

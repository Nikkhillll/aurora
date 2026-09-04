import asyncio
import json
import websockets

async def test():
    async with websockets.connect(
        "ws://127.0.0.1:8000/ws/live?station_id=maitri"
    ) as ws:
        print("CONNECTED")

        message = await ws.recv()
        print("INITIAL MESSAGE:")
        print(json.dumps(json.loads(message), indent=2))

        await ws.send(json.dumps({"type": "ping"}))

        response = await ws.recv()
        print("PING RESPONSE:")
        print(response)

asyncio.run(test())

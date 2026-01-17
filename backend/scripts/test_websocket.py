"""Quick WebSocket test for city updates."""
import asyncio
import aiohttp


async def main():
    url = "ws://127.0.0.1:8001/ws/city/ahmedabad"
    async with aiohttp.ClientSession() as session:
        async with session.ws_connect(url) as ws:
            print("Connected to", url)
            msg = await ws.receive(timeout=10)
            print("Message type:", msg.type)
            print("Payload:")
            print(msg.data)


if __name__ == "__main__":
    asyncio.run(main())

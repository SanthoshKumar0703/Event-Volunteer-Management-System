"""
EventFlow WebSocket API
Realtime WebSocket endpoints for notifications and live updates
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException, status
from typing import Dict, List, Optional, Any
import json
from datetime import datetime, timezone

from ..core.config import get_settings
from ..core.security import verify_token
from ..core.websocket import websocket_manager

router = APIRouter(prefix="/api", tags=["WebSocket"])

settings = get_settings()


# WebSocket endpoint for notifications
@router.websocket("/ws/{user_id}")
async def websocket_notifications(
    websocket: WebSocket,
    user_id: str,
    token: Optional[str] = None
):
    """WebSocket endpoint for realtime notifications"""
    try:
        # Verify token
        if token:
            try:
                payload = verify_token(token)
                if str(payload.get("sub")) != user_id:
                    await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
                    return
            except Exception as e:
                print(f"WebSocket authentication error: {e}")
                await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
                return
        
        # Accept connection
        connection_id = await websocket_manager.connect(websocket, user_id)
        
        try:
            while True:
                data = await websocket.receive_text()
                
                try:
                    message = json.loads(data)
                    message_type = message.get("type")
                    
                    # Handle ping
                    if message_type == "PING":
                        await websocket.send_text(json.dumps({
                            "type": "PONG",
                            "timestamp": datetime.now(timezone.utc).isoformat()
                        }))
                        continue
                    
                    # Handle other message types
                    print(f"Received WebSocket message: {message}")
                    
                except json.JSONDecodeError:
                    print(f"Invalid JSON: {data}")
                    await websocket.send_text(json.dumps({
                        "type": "ERROR",
                        "error": "Invalid JSON format",
                        "timestamp": datetime.now(timezone.utc).isoformat()
                    }))
        
        except WebSocketDisconnect:
            print(f"Client {user_id} disconnected: {connection_id}")
            await websocket_manager.disconnect(websocket, user_id, connection_id)
        except Exception as e:
            print(f"WebSocket error: {e}")
            await websocket_manager.disconnect(websocket, user_id, connection_id)
            try:
                await websocket.close(code=1011)  # Internal Error
            except:
                pass
    
    except Exception as e:
        print(f"WebSocket connection error: {e}")
        try:
            await websocket.close(code=1011)
        except:
            pass


# Test WebSocket endpoint
@router.get("/ws/test")
async def test_websocket():
    """Test WebSocket connection"""
    return {
        "success": True,
        "message": "WebSocket endpoint is available",
        "url": f"ws://{settings.HOST}:{settings.PORT}/api/ws/{{user_id}}?token={{access_token}}"
    }

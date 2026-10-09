"""
EventFlow WebSocket Manager
Handles realtime WebSocket connections and message broadcasting
"""

import json
from typing import Dict, List, Optional, Any, Callable, Awaitable
from fastapi import WebSocket, WebSocketDisconnect
from collections import defaultdict
import asyncio
from datetime import datetime, timezone

from .config import get_settings


class ConnectionManager:
    """Manages WebSocket connections for multiple users"""
    
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = defaultdict(list)
        self.user_connections: Dict[str, WebSocket] = {}
        self.connection_id_counter = 0
        self.settings = get_settings()
        self.lock = asyncio.Lock()
    
    async def connect(self, websocket: WebSocket, user_id: str) -> str:
        """Accept a new WebSocket connection"""
        await websocket.accept()
        
        connection_id = f"conn_{self.connection_id_counter}_{user_id}"
        self.connection_id_counter += 1
        
        async with self.lock:
            self.active_connections[user_id].append(websocket)
            self.user_connections[connection_id] = websocket
        
        print(f"🟢 WebSocket connected: {connection_id} for user {user_id}")
        
        # Send connection acknowledgment
        await self.send_personal_message(
            websocket,
            {
                "type": "CONNECTION_ESTABLISHED",
                "data": {
                    "connectionId": connection_id,
                    "userId": user_id,
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                },
            },
        )
        
        return connection_id
    
    async def disconnect(self, websocket: WebSocket, user_id: str, connection_id: str) -> None:
        """Remove a WebSocket connection"""
        async with self.lock:
            if user_id in self.active_connections:
                if websocket in self.active_connections[user_id]:
                    self.active_connections[user_id].remove(websocket)
                if not self.active_connections[user_id]:
                    del self.active_connections[user_id]
            
            if connection_id in self.user_connections:
                del self.user_connections[connection_id]
        
        print(f"🔴 WebSocket disconnected: {connection_id} for user {user_id}")
    
    async def send_personal_message(
        self,
        websocket: WebSocket,
        message: Dict[str, Any],
    ) -> None:
        """Send a message to a specific WebSocket connection"""
        try:
            await websocket.send_text(json.dumps(message))
        except Exception as e:
            print(f"⚠️ Error sending message: {e}")
            # Connection is likely closed, remove it
            await self.disconnect(websocket, "", "")
    
    async def broadcast_message(
        self,
        message: Dict[str, Any],
        user_ids: Optional[List[str]] = None,
    ) -> None:
        """Broadcast a message to multiple users"""
        if user_ids:
            # Send to specific users
            for user_id in user_ids:
                await self.send_to_user(user_id, message)
        else:
            # Broadcast to all connected users
            async with self.lock:
                for user_id, connections in self.active_connections.items():
                    for connection in connections:
                        try:
                            await connection.send_text(json.dumps(message))
                        except Exception as e:
                            print(f"⚠️ Error broadcasting to {user_id}: {e}")
                            await self.disconnect(connection, user_id, "")
    
    async def send_to_user(
        self,
        user_id: str,
        message: Dict[str, Any],
    ) -> None:
        """Send a message to a specific user (all their connections)"""
        async with self.lock:
            if user_id in self.active_connections:
                for connection in self.active_connections[user_id]:
                    try:
                        await connection.send_text(json.dumps(message))
                    except Exception as e:
                        print(f"⚠️ Error sending to {user_id}: {e}")
                        await self.disconnect(connection, user_id, "")
    
    async def send_to_all(
        self,
        message: Dict[str, Any],
    ) -> None:
        """Send a message to all connected users"""
        async with self.lock:
            for user_id, connections in self.active_connections.items():
                for connection in connections:
                    try:
                        await connection.send_text(json.dumps(message))
                    except Exception as e:
                        print(f"⚠️ Error broadcasting to all: {e}")
                        await self.disconnect(connection, user_id, "")
    
    async def send_to_room(
        self,
        room: str,
        message: Dict[str, Any],
    ) -> None:
        """Send a message to all users in a room"""
        # In this implementation, rooms are user-specific
        # For event-based rooms, we'd need to track room memberships
        pass
    
    def get_active_users(self) -> List[str]:
        """Get list of currently connected user IDs"""
        return list(self.active_connections.keys())
    
    def get_connection_count(self) -> int:
        """Get total number of active connections"""
        return sum(len(conns) for conns in self.active_connections.values())
    
    async def close_all_connections(self) -> None:
        """Close all WebSocket connections"""
        async with self.lock:
            for user_id, connections in self.active_connections.items():
                for connection in connections:
                    try:
                        await connection.close()
                    except:
                        pass
            self.active_connections.clear()
            self.user_connections.clear()


# Singleton instance
websocket_manager = ConnectionManager()


class WebSocketHandler:
    """Handles WebSocket endpoints and message routing"""
    
    def __init__(self):
        self.manager = websocket_manager
        self.message_handlers: Dict[str, Callable] = {}
    
    def register_handler(
        self,
        message_type: str,
        handler: Callable[[WebSocket, Dict[str, Any]], Awaitable[Any]],
    ) -> None:
        """Register a message handler for a specific message type"""
        self.message_handlers[message_type] = handler
    
    async def handle_connection(
        self,
        websocket: WebSocket,
        user_id: str,
    ) -> None:
        """Handle a WebSocket connection"""
        connection_id = await self.manager.connect(websocket, user_id)
        
        try:
            while True:
                data = await websocket.receive_text()
                message = json.loads(data)
                
                # Handle ping/pong
                if message.get("type") == "PING":
                    await self.manager.send_personal_message(
                        websocket,
                        {"type": "PONG", "timestamp": datetime.now(timezone.utc).isoformat()},
                    )
                    continue
                
                # Route to appropriate handler
                message_type = message.get("type")
                if message_type and message_type in self.message_handlers:
                    handler = self.message_handlers[message_type]
                    await handler(websocket, message.get("data", {}))
                else:
                    print(f"⚠️ Unknown message type: {message_type}")
                    await self.manager.send_personal_message(
                        websocket,
                        {
                            "type": "ERROR",
                            "error": "UNKNOWN_MESSAGE_TYPE",
                            "message": f"Unknown message type: {message_type}",
                        },
                    )
        
        except WebSocketDisconnect:
            print(f"🔴 Client disconnected: {connection_id}")
            self.manager.disconnect(websocket, user_id, connection_id)
        except Exception as e:
            print(f"⚠️ WebSocket error: {e}")
            self.manager.disconnect(websocket, user_id, connection_id)
            try:
                await websocket.close(code=1011)  # Internal Error
            except:
                pass


# Notification WebSocket handler
class NotificationWebSocket:
    """Handles notification-specific WebSocket functionality"""
    
    def __init__(self):
        self.manager = websocket_manager
    
    async def send_notification(
        self,
        user_id: str,
        notification: Dict[str, Any],
    ) -> None:
        """Send a notification to a user via WebSocket"""
        await self.manager.send_to_user(
            user_id,
            {
                "type": "NEW_NOTIFICATION",
                "data": notification,
            },
        )
    
    async def broadcast_notification(
        self,
        user_ids: List[str],
        notification: Dict[str, Any],
    ) -> None:
        """Broadcast a notification to multiple users"""
        await self.manager.broadcast_message(
            {
                "type": "NEW_NOTIFICATION",
                "data": notification,
            },
            user_ids=user_ids,
        )
    
    async def send_event_update(
        self,
        user_ids: List[str],
        event_data: Dict[str, Any],
    ) -> None:
        """Send event update to users"""
        await self.manager.broadcast_message(
            {
                "type": "EVENT_UPDATE",
                "data": event_data,
            },
            user_ids=user_ids,
        )
    
    async def send_task_update(
        self,
        user_id: str,
        task_data: Dict[str, Any],
    ) -> None:
        """Send task update to user"""
        await self.manager.send_to_user(
            user_id,
            {
                "type": "TASK_UPDATE",
                "data": task_data,
            },
        )
    
    async def send_online_users(
        self,
        user_id: str,
    ) -> None:
        """Send list of online users to a user"""
        online_users = self.manager.get_active_users()
        await self.manager.send_to_user(
            user_id,
            {
                "type": "ONLINE_USERS",
                "data": {"users": online_users},
            },
        )


# Create instances
notification_ws = NotificationWebSocket()

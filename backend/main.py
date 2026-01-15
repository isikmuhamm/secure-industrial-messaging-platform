from fastapi import FastAPI, Depends, APIRouter, WebSocket, WebSocketDisconnect, HTTPException
from sqlalchemy.orm import Session
import crud, models, database, auth
import json
from database import SessionLocal
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm


app = FastAPI()
router = APIRouter()
app.include_router(router)

# Set to track online users
online_users = set()


def get_db():
    """Database session dependency for FastAPI endpoints."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Create database tables on first startup
models.Base.metadata.create_all(bind=database.engine)


# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    """Welcome endpoint for the API."""
    return {"message": "Welcome to the FastAPI application!"}


@app.post("/users/", response_model=crud.UserCreate)
def create_user(user: crud.UserCreate, db: Session = Depends(get_db)):
    """Create a new user account."""
    return crud.create_user(db=db, user=user)


@app.get("/users/", response_model=list[crud.UserResponse])
def get_users(db: Session = Depends(get_db)):
    """Retrieve all registered users."""
    users = crud.get_users(db=db)
    return users


@app.get("/users/{username}", response_model=crud.UserResponse)
def get_user_by_username(username: str, db: Session = Depends(get_db)):
    """Find a user by their username."""
    user = db.query(models.User).filter(models.User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"username": user.username, "id": user.id}


@app.post("/messages/")
def send_message(message: crud.MessageCreate, db: Session = Depends(get_db)):
    """Send a new chat message."""
    return crud.create_chat_message(
        db=db,
        sender_id=message.sender_id,
        receiver_id=message.recipient_id,
        content=message.content
    )


@app.post("/token")
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Authenticate user and return access token."""
    user = crud.get_user(db, form_data.username)
    if not user or not auth.verify_password(form_data.password, user.password):
        raise HTTPException(
            status_code=400,
            detail="Incorrect username or password",
        )
    access_token_expires = auth.timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.id}, expires_delta=access_token_expires
    )
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user_id": user.id,
        "username": user.username
    }


class ConnectionManager:
    """Manages WebSocket connections for real-time messaging."""
    
    def __init__(self):
        # active_connections: user_id -> {"username": str, "websocket": WebSocket}
        self.active_connections: dict[int, dict] = {}

    async def connect(self, user_id: int, username: str, websocket: WebSocket):
        """Accept and store a new WebSocket connection."""
        await websocket.accept()
        self.active_connections[user_id] = {"username": username, "websocket": websocket}
        print(f"Connection established: {username} (ID: {user_id})")

    def disconnect(self, user_id: int):
        """Remove a WebSocket connection."""
        if user_id in self.active_connections:
            disconnected_user = self.active_connections.pop(user_id)
            print(f"Connection closed: {disconnected_user['username']} (ID: {user_id})")

    async def save_message_to_db(self, db: Session, sender_id: int, recipient_id: int, content: str):
        """Persist a chat message to the database."""
        chat_message = crud.create_chat_message(db, sender_id, recipient_id, content)
        print(f"Message saved: {sender_id} -> {recipient_id}: {content}")

    async def send_personal_message(self, message: str, recipient_id: int, db: Session):
        """Send a message to a specific recipient via WebSocket."""
        message_data = json.loads(message)
        sender_id = message_data['sender_id']
        content = message_data['content']

        print(f"Incoming message: {message_data}, Recipient: {recipient_id}")

        # Get recipient's WebSocket connection
        recipient_connection = self.active_connections.get(recipient_id)

        # Save message to database
        await self.save_message_to_db(db, sender_id, recipient_id, content)

        # Forward message if recipient is connected
        if recipient_connection:
            recipient_websocket = recipient_connection["websocket"]
            await recipient_websocket.send_text(message)
            print(f"Message sent to recipient: {recipient_id}")
        else:
            print(f"Connection not found: {recipient_id} (Active connections: {list(self.active_connections.keys())})")
        

connection_manager = ConnectionManager()


@app.websocket("/ws/{username}")
async def websocket_endpoint(websocket: WebSocket, username: str):
    """WebSocket endpoint for real-time messaging."""
    db = next(get_db())
    user = db.query(models.User).filter(models.User.username == username).first()

    if user:
        user_id = user.id
        online_users.add(username)
        await connection_manager.connect(user_id, username, websocket)
        try:
            while True:
                data = await websocket.receive_text()
                message_data = json.loads(data)
                print(message_data)

                recipient_id = message_data['recipient_id']
                try:
                    await connection_manager.send_personal_message(json.dumps(message_data), recipient_id, db)
                except Exception as e:
                    print(f"Error: {e}")

        except WebSocketDisconnect:
            online_users.remove(username)
            connection_manager.disconnect(user_id)
        finally:
            online_users.discard(username)


@app.get("/online-users/")
async def get_online_users(db: Session = Depends(get_db)):
    """Retrieve list of currently online users."""
    online_users_info = []
    for user_id, connection in connection_manager.active_connections.items():
        user = db.query(models.User).filter(models.User.id == user_id).first()
        if user:
            online_users_info.append({"username": connection["username"], "id": user_id})
    return online_users_info


@app.get("/users/chat/")
async def get_chat_users(user_id: int, db: Session = Depends(database.get_db)):
    """Retrieve users that the current user has previously messaged."""
    return crud.get_chat_users(db=db, user_id=user_id)


@app.get("/messages/")
def get_messages(user_id: int, target_user_id: int, db: Session = Depends(database.get_db)):
    """Retrieve message history between two users."""
    messages = crud.get_chat_messages(db=db, current_user_id=user_id, target_user_id=target_user_id)
    return {"messages": messages}
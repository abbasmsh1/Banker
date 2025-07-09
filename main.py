from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Base, User
from sqlalchemy.orm import Session
from pydantic import BaseModel
from passlib.context import CryptContext
import jwt
import datetime as dt
from fastapi.security import OAuth2PasswordBearer
from fastapi import Security
from typing import List, Optional
from models import Account, Beneficiary, Transaction
from fastapi import Body
import random
import string

DATABASE_URL = "sqlite:///./bank.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)

app = FastAPI()

SECRET_KEY = "your_secret_key"  # Change this in production
ALGORITHM = "HS256"

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        user_id: int = payload.get("user_id")
        if username is None or user_id is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
    return user

# Pydantic models
class UserCreate(BaseModel):
    username: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

def get_password_hash(password):
    return pwd_context.hash(password)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: dt.timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = dt.datetime.utcnow() + expires_delta
    else:
        expire = dt.datetime.utcnow() + dt.timedelta(minutes=30)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

@app.get("/")
def read_root():
    return {"message": "Welcome to the Banking API"}

@app.post("/register", response_model=Token)
def register(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    hashed_password = get_password_hash(user.password)
    new_user = User(username=user.username, password=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    access_token = create_access_token(data={"sub": new_user.username, "user_id": new_user.id, "is_admin": new_user.is_admin})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/login", response_model=Token)
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.username == user.username).first()
    if not db_user or not verify_password(user.password, db_user.password):
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    access_token = create_access_token(data={"sub": db_user.username, "user_id": db_user.id, "is_admin": db_user.is_admin})
    return {"access_token": access_token, "token_type": "bearer"}

# Pydantic models for accounts, beneficiaries, transactions
class AccountCreate(BaseModel):
    name: str
    father_name: str
    phone_number: str
    user_id: int

class AccountOut(BaseModel):
    id: int
    user_id: int
    name: str
    father_name: str
    phone_number: str
    iban: str
    address: str
    balance: float
    class Config:
        from_attributes = True

class BeneficiaryCreate(BaseModel):
    name: str
    iban: str
    address: str
    class Config:
        from_attributes = True

class BeneficiaryOut(BaseModel):
    id: int
    name: str
    iban: str
    address: str
    class Config:
        from_attributes = True

class TransactionCreate(BaseModel):
    to_iban: Optional[str] = None
    to_address: Optional[str] = None
    amount: float

class TransactionOut(BaseModel):
    id: int
    type: str
    amount: float
    timestamp: dt.datetime
    to_iban: Optional[str]
    to_address: Optional[str]
    class Config:
        from_attributes = True

def generate_iban():
    # Generates a 14-digit IBAN starting with 'AB'
    return 'AB' + ''.join([str(random.randint(0, 9)) for _ in range(12)])

def generate_crypto_address():
    # Generates a 34-character crypto address starting with 'CR'
    chars = string.ascii_uppercase + string.digits
    return 'CR' + ''.join(random.choices(chars, k=32))

def admin_required(user: User = Depends(get_current_user)):
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin privileges required")
    return user

@app.post("/accounts", response_model=AccountOut)
def create_account(account: AccountCreate, db: Session = Depends(get_db), admin: User = Depends(admin_required)):
    # Only one account per user
    existing = db.query(Account).filter(Account.user_id == account.user_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="User already has an account")
    iban = generate_iban()
    crypto_address = generate_crypto_address()
    db_account = Account(
        user_id=account.user_id,
        name=account.name,
        father_name=account.father_name,
        phone_number=account.phone_number,
        iban=iban,
        address=crypto_address,
        balance=0.0
    )
    db.add(db_account)
    db.commit()
    db.refresh(db_account)
    return db_account

@app.get("/accounts", response_model=List[AccountOut])
def get_accounts(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    accounts = db.query(Account).filter(Account.user_id == user.id).all()
    return accounts

@app.post("/beneficiaries", response_model=BeneficiaryOut)
def add_beneficiary(beneficiary: BeneficiaryCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    db_beneficiary = Beneficiary(user_id=user.id, **beneficiary.dict())
    db.add(db_beneficiary)
    db.commit()
    db.refresh(db_beneficiary)
    return db_beneficiary

@app.get("/beneficiaries", response_model=List[BeneficiaryOut])
def get_beneficiaries(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.query(Beneficiary).filter(Beneficiary.user_id == user.id).all()

@app.post("/transfer", response_model=TransactionOut)
def transfer_money(tx: TransactionCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    # Find sender's account
    sender_account = db.query(Account).filter(Account.user_id == user.id).first()
    if not sender_account or sender_account.balance < tx.amount:
        raise HTTPException(status_code=400, detail="Insufficient funds or account not found")
    # Find recipient account by IBAN or address
    recipient_account = None
    if tx.to_iban:
        recipient_account = db.query(Account).filter(Account.iban == tx.to_iban).first()
    elif tx.to_address:
        recipient_account = db.query(Account).filter(Account.address == tx.to_address).first()
    if not recipient_account:
        raise HTTPException(status_code=404, detail="Recipient not found")
    # Transfer
    sender_account.balance -= tx.amount
    recipient_account.balance += tx.amount
    # Log transactions
    send_tx = Transaction(account_id=sender_account.id, type="send", amount=tx.amount, to_iban=tx.to_iban, to_address=tx.to_address)
    receive_tx = Transaction(account_id=recipient_account.id, type="receive", amount=tx.amount, to_iban=sender_account.iban, to_address=sender_account.address)
    db.add_all([send_tx, receive_tx])
    db.commit()
    db.refresh(send_tx)
    return send_tx

@app.get("/transactions", response_model=List[TransactionOut])
def get_transactions(db: Session = Depends(get_db), user: User = Depends(get_current_user), period: Optional[str] = None):
    account = db.query(Account).filter(Account.user_id == user.id).first()
    if not account:
        return []
    query = db.query(Transaction).filter(Transaction.account_id == account.id)
    now = dt.datetime.utcnow()
    if period == "daily":
        start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        query = query.filter(Transaction.timestamp >= start)
    elif period == "weekly":
        start = now - dt.timedelta(days=now.weekday())
        start = start.replace(hour=0, minute=0, second=0, microsecond=0)
        query = query.filter(Transaction.timestamp >= start)
    return query.order_by(Transaction.timestamp.desc()).all() 

# Helper: admin dependency

class UserOut(BaseModel):
    id: int
    username: str
    is_admin: bool
    class Config:
        from_attributes = True

@app.post("/admin/create_user", response_model=UserOut)
def admin_create_user(user: UserCreate, db: Session = Depends(get_db), admin: User = Depends(admin_required)):
    db_user = db.query(User).filter(User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    hashed_password = get_password_hash(user.password)
    new_user = User(username=user.username, password=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

class UserAccountCreate(BaseModel):
    username: str
    password: str
    is_admin: bool = False
    name: str
    father_name: str
    phone_number: str

@app.post("/admin/create_user_account", response_model=UserOut)
def admin_create_user_account(data: UserAccountCreate, db: Session = Depends(get_db), admin: User = Depends(admin_required)):
    db_user = db.query(User).filter(User.username == data.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    hashed_password = get_password_hash(data.password)
    new_user = User(username=data.username, password=hashed_password, is_admin=data.is_admin)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    iban = generate_iban()
    crypto_address = generate_crypto_address()
    db_account = Account(
        user_id=new_user.id,
        name=data.name,
        father_name=data.father_name,
        phone_number=data.phone_number,
        iban=iban,
        address=crypto_address,
        balance=0.0
    )
    db.add(db_account)
    db.commit()
    db.refresh(db_account)
    return new_user

@app.get("/admin/account/{account_id}", response_model=AccountOut)
def admin_get_account(account_id: int, db: Session = Depends(get_db), admin: User = Depends(admin_required)):
    account = db.query(Account).filter(Account.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    return account

@app.get("/admin/total_money")
def admin_total_money(db: Session = Depends(get_db), admin: User = Depends(admin_required)):
    total = db.query(Account).with_entities(Account.balance).all()
    total_sum = sum([a[0] for a in total])
    return {"total_money": total_sum}

@app.get("/admin/total_transferred_today")
def admin_total_transferred_today(db: Session = Depends(get_db), admin: User = Depends(admin_required)):
    now = dt.datetime.utcnow()
    start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    total = db.query(Transaction).filter(Transaction.type == "send", Transaction.timestamp >= start).with_entities(Transaction.amount).all()
    total_sum = sum([t[0] for t in total])
    return {"total_transferred_today": total_sum} 

class AddMoneyRequest(BaseModel):
    iban: str
    amount: float

@app.post("/admin/add_money")
def admin_add_money(req: AddMoneyRequest, db: Session = Depends(get_db), admin: User = Depends(admin_required)):
    print(f"Looking for IBAN: {req.iban}")  # Debug
    account = db.query(Account).filter(Account.iban == req.iban).first()
    if not account:
        # List all IBANs for debugging
        all_accounts = db.query(Account.iban).all()
        available_ibans = [acc[0] for acc in all_accounts]
        print(f"Available IBANs: {available_ibans}")  # Debug
        raise HTTPException(status_code=404, detail=f"Account not found. Available IBANs: {available_ibans}")
    account.balance += req.amount
    db.commit()
    return {"message": f"Added {req.amount} to account {req.iban}", "new_balance": account.balance}

@app.get("/admin/all_accounts", response_model=List[AccountOut])
def admin_get_all_accounts(db: Session = Depends(get_db), admin: User = Depends(admin_required)):
    return db.query(Account).all() 
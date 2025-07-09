from models import Base, User
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from passlib.context import CryptContext

DATABASE_URL = "sqlite:///./bank.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_admin():
    db = SessionLocal()
    username = "admin"
    password = "adminpassword"  # Change this if you want a different password
    existing = db.query(User).filter(User.username == username).first()
    if existing:
        print("Admin user already exists.")
        return
    hashed_password = pwd_context.hash(password)
    admin_user = User(username=username, password=hashed_password, is_admin=True)
    db.add(admin_user)
    db.commit()
    db.close()
    print(f"Admin user created! Username: {username} Password: {password}")

if __name__ == "__main__":
    create_admin() 
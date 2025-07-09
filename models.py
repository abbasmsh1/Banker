from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship, declarative_base
import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    is_admin = Column(Boolean, default=False)
    accounts = relationship('Account', back_populates='user')
    beneficiaries = relationship('Beneficiary', back_populates='user')

class Account(Base):
    __tablename__ = 'accounts'
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    name = Column(String, nullable=False)
    father_name = Column(String, nullable=False)
    phone_number = Column(String, nullable=False)
    iban = Column(String, unique=True, index=True, nullable=False)
    address = Column(String, unique=True, index=True, nullable=False)  # crypto address
    balance = Column(Float, default=0.0)
    user = relationship('User', back_populates='accounts')
    transactions = relationship('Transaction', back_populates='account')

class Beneficiary(Base):
    __tablename__ = 'beneficiaries'
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    name = Column(String, nullable=False)
    iban = Column(String, nullable=False)
    address = Column(String, nullable=False)
    user = relationship('User', back_populates='beneficiaries')

class Transaction(Base):
    __tablename__ = 'transactions'
    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, ForeignKey('accounts.id'))
    type = Column(String, nullable=False)  # 'send' or 'receive'
    amount = Column(Float, nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    to_iban = Column(String, nullable=True)
    to_address = Column(String, nullable=True)
    account = relationship('Account', back_populates='transactions') 
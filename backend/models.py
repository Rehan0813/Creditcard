from sqlalchemy import Column, Integer, String, Float, DateTime, Text, LargeBinary, ForeignKey
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=True)
    phone = Column(String, unique=True, index=True, nullable=True)
    password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    uploaded_files = relationship("UploadedFile", back_populates="user")
    predictions = relationship("Prediction", back_populates="user")
    feedbacks = relationship("Feedback", back_populates="user")

class UploadedFile(Base):
    __tablename__ = "uploaded_files"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    filename = Column(String, nullable=False)
    file_content = Column(LargeBinary, nullable=False)  # Store file as binary
    file_size = Column(Integer, nullable=False)
    upload_date = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="uploaded_files")

class Prediction(Base):
    __tablename__ = "predictions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Transaction data
    amount = Column(Float, nullable=False)
    transaction_time = Column(String, nullable=False)
    merchant_category = Column(String, nullable=False)
    country = Column(String, nullable=False)
    device_type = Column(String, nullable=False)
    payment_method = Column(String, nullable=False)
    channel = Column(String, nullable=True)
    merchant_country = Column(String, nullable=True)
    transaction_count_24h = Column(Integer, nullable=True)
    avg_amount_24h = Column(Float, nullable=True)
    
    # Prediction results
    fraud_score = Column(Float, nullable=False)
    risk_level = Column(String, nullable=False)
    recommended_action = Column(String, nullable=False)
    prediction_date = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="predictions")
    feedbacks = relationship("Feedback", back_populates="prediction")

class Feedback(Base):
    __tablename__ = "feedbacks"
    
    id = Column(Integer, primary_key=True, index=True)
    prediction_id = Column(Integer, ForeignKey("predictions.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Feedback data
    human_decision = Column(String, nullable=False)  # 'fraud' or 'legit'
    reasons = Column(Text, nullable=True)  # Comma-separated reasons
    thoughts = Column(Text, nullable=True)
    model_rating = Column(String, nullable=False)  # 'accurate', 'partially_accurate', 'not_accurate'
    feedback_date = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    prediction = relationship("Prediction", back_populates="feedbacks")
    user = relationship("User", back_populates="feedbacks")

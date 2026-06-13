from uuid import uuid4
from datetime import datetime, timedelta
from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from .base import Base

class Invitation(Base):
    __tablename__ =  invitations
    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    room_id = Column(PGUUID(as_uuid=True), ForeignKey(study_rooms.id), nullable=False)
    invited_user_id = Column(PGUUID(as_uuid=True), ForeignKey(users.id), nullable=False)
    token = Column(String(64), unique=True, nullable=False, default=lambda: uuid4().hex)
    expires_at = Column(DateTime, nullable=False, default=lambda: datetime.utcnow() + timedelta(days=1))

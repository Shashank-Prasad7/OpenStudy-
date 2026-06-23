from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.dependencies import get_current_user
from app.models.room import RoomMember, RoomVisibility, StudyRoom
from app.models.user import User
from app.schemas.room import PaginatedRooms, RoomCreate, RoomDetail, RoomRead, RoomUpdate
from app.utils import api_error, forbidden, not_found

router = APIRouter(prefix="/rooms", tags=["study rooms"])


async def _get_room_detail(db: AsyncSession, room_id: UUID) -> StudyRoom:
    room = await db.scalar(
        select(StudyRoom)
        .where(StudyRoom.id == room_id)
        .options(selectinload(StudyRoom.members).selectinload(RoomMember.user))
    )
    if room is None:
        raise not_found("Room")
    return room


@router.get("", response_model=PaginatedRooms)
async def list_rooms(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_db),
) -> PaginatedRooms:
    total = await db.scalar(select(func.count()).select_from(StudyRoom).where(StudyRoom.visibility == RoomVisibility.public))
    rooms = (
        await db.scalars(
            select(StudyRoom)
            .where(StudyRoom.visibility == RoomVisibility.public)
            .options(selectinload(StudyRoom.members))
            .order_by(StudyRoom.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
    ).all()
    return PaginatedRooms(
        items=[RoomRead.model_validate(room) for room in rooms],
        total=total or 0,
        limit=limit,
        offset=offset,
    )


@router.post("", response_model=RoomDetail, status_code=status.HTTP_201_CREATED)
async def create_room(
    payload: RoomCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> StudyRoom:
    room = StudyRoom(**payload.model_dump(), created_by=current_user.id)
    db.add(room)
    await db.flush()
    db.add(RoomMember(room_id=room.id, user_id=current_user.id))
    await db.commit()
    return await _get_room_detail(db, room.id)


@router.get("/{room_id}", response_model=RoomDetail)
async def get_room(room_id: UUID, db: AsyncSession = Depends(get_db)) -> StudyRoom:
    return await _get_room_detail(db, room_id)


@router.patch("/{room_id}", response_model=RoomDetail)
async def update_room(
    room_id: UUID,
    payload: RoomUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> StudyRoom:
    room = await _get_room_detail(db, room_id)
    if room.created_by != current_user.id:
        raise forbidden()
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(room, field, value)
    await db.commit()
    return await _get_room_detail(db, room_id)


@router.delete("/{room_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_room(
    room_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    room = await _get_room_detail(db, room_id)
    if room.created_by != current_user.id:
        raise forbidden()
    await db.delete(room)
    await db.commit()


@router.post("/{room_id}/join", response_model=RoomDetail)
async def join_room(
    room_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> StudyRoom:
    room = await _get_room_detail(db, room_id)
    if any(member.user_id == current_user.id for member in room.members):
        return room
    if len(room.members) >= room.max_members:
        raise api_error(status.HTTP_409_CONFLICT, "Room is full.", "room_full")
    db.add(RoomMember(room_id=room.id, user_id=current_user.id))
    await db.commit()
    return await _get_room_detail(db, room.id)


@router.post("/{room_id}/leave", response_model=RoomDetail)
async def leave_room(
    room_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> StudyRoom:
    room = await _get_room_detail(db, room_id)
    if room.created_by == current_user.id:
        raise api_error(status.HTTP_409_CONFLICT, "Room creator cannot leave; delete the room instead.", "creator_cannot_leave")
    membership = await db.scalar(
        select(RoomMember).where(RoomMember.room_id == room_id, RoomMember.user_id == current_user.id)
    )
    if membership is None:
        raise api_error(status.HTTP_409_CONFLICT, "You are not a member of this room.", "not_member")
    await db.delete(membership)
    await db.commit()
    return await _get_room_detail(db, room_id)

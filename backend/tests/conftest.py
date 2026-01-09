"""
Test configuration and fixtures
"""
import pytest
import asyncio
from typing import AsyncGenerator
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import NullPool

from app.main import app
from app.db.session import get_db
from app.models.base import Base, User
from app.core.security import get_password_hash


# Test database URL
TEST_DATABASE_URL = "postgresql+asyncpg://postgres:smartlearning123@localhost:5433/smartlearning_test"

# Create test engine
test_engine = create_async_engine(
    TEST_DATABASE_URL,
    poolclass=NullPool,
    echo=False
)

TestSessionLocal = async_sessionmaker(
    test_engine,
    class_=AsyncSession,
    expire_on_commit=False
)


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for each test case."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="function")
async def db() -> AsyncGenerator[AsyncSession, None]:
    """Create a fresh database for each test."""
    # Create all tables
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    
    # Create a new session for the test
    async with TestSessionLocal() as session:
        yield session
        await session.rollback()


@pytest.fixture(scope="function")
async def client(db: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """Create a test client."""
    async def override_get_db():
        yield db
    
    app.dependency_overrides[get_db] = override_get_db
    
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as ac:
        yield ac
    
    app.dependency_overrides.clear()


@pytest.fixture
async def test_teacher(db: AsyncSession) -> User:
    """Create a test teacher user."""
    teacher = User(
        username="test_teacher",
        full_name="测试教师",
        email="teacher@test.com",
        hashed_password=get_password_hash("test123"),
        role="teacher",
        phone="13800138000",
        is_active=True
    )
    db.add(teacher)
    await db.commit()
    await db.refresh(teacher)
    return teacher


@pytest.fixture
async def another_teacher(db: AsyncSession) -> User:
    """Create another test teacher user."""
    teacher = User(
        username="another_teacher",
        full_name="另一个教师",
        email="another@test.com",
        hashed_password=get_password_hash("test123"),
        role="teacher",
        phone="13900139000",
        is_active=True
    )
    db.add(teacher)
    await db.commit()
    await db.refresh(teacher)
    return teacher


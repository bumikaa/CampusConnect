import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from app.database import engine, Base, SessionLocal
from app.models import Parcel
from app.seed import seed_database
from app.routes import batches, parcels, recovery, analytics, settings, export, complaints, auth

Base.metadata.create_all(bind=engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    db = SessionLocal()
    try:
        count = db.query(Parcel).count()
        if count == 0:
            print("Database is empty. Initializing clean schema...")
            seed_database()
    finally:
        db.close()
    yield

app = FastAPI(
    title="CampusConnect API",
    description="Campus-focused bulk parcel identification and failed-delivery recovery platform REST API.",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(batches.router)
app.include_router(parcels.router)
app.include_router(recovery.router)
app.include_router(analytics.router)
app.include_router(settings.router)
app.include_router(export.router)
app.include_router(complaints.router)


@app.get("/", response_class=HTMLResponse)
def root_welcome():
    return """
    <!DOCTYPE html>
    <html>
    <head>
        <title>CampusConnect REST API</title>
        <style>
            body { font-family: system-ui, -apple-system, sans-serif; background-color: #0A111E; color: #ffffff; padding: 40px; text-align: center; }
            .card { background-color: #131921; border: 2px solid #F58220; border-radius: 12px; max-width: 600px; margin: 0 auto; padding: 30px; }
            h1 { color: #F58220; margin-top: 0; }
            a { color: #FEBD69; text-decoration: none; font-weight: bold; }
            a:hover { text-decoration: underline; }
            .btn { display: inline-block; background-color: #F58220; color: #0A111E; font-weight: bold; padding: 12px 24px; border-radius: 6px; margin-top: 15px; }
        </style>
    </head>
    <body>
        <div class="card">
            <h1>CampusConnect API</h1>
            <p>Smarter Campus Deliveries. Faster Parcel Resolution.</p>
            <p style="color: #9CA3AF; font-size: 14px;">FastAPI Backend REST Server is active and operational.</p>
            <a href="/docs" class="btn">Explore OpenAPI Swagger Specs (/docs)</a>
            <br/><br/>
            <p><a href="/api/health">Check API Health Endpoint (/api/health)</a></p>
        </div>
    </body>
    </html>
    """

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "app": "CampusConnect",
        "tagline": "Smarter Campus Deliveries. Faster Parcel Resolution."
    }

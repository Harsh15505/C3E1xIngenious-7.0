"""
Database Viewer Utility
View all tables and query data using Tortoise ORM

Usage:
    cd D:\\IngeniousC3E1\\backend
    python -m scripts.view_db                    # Show all tables with counts
    python -m scripts.view_db users              # Show all users
    python -m scripts.view_db alerts --limit 10  # Show 10 recent alerts
"""

import asyncio
import sys
import os
from dotenv import load_dotenv

# Load environment variables before importing app modules
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env'))

# Add parent directory to path to import app
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import init_db, close_db
from app.models import (
    City, EnvironmentData, ServiceData, TrafficData,
    Forecast, Anomaly, RiskScore, Alert, Scenario,
    DataSource, CitizenRequest, SystemAuditLog, User
)


MODELS = {
    "cities": City,
    "users": User,
    "environment": EnvironmentData,
    "traffic": TrafficData,
    "services": ServiceData,
    "forecasts": Forecast,
    "anomalies": Anomaly,
    "risk": RiskScore,
    "alerts": Alert,
    "scenarios": Scenario,
    "sources": DataSource,
    "requests": CitizenRequest,
    "audit": SystemAuditLog,
}


async def show_table_summary():
    """Show summary of all tables"""
    print("\n" + "="*60)
    print("DATABASE TABLES SUMMARY")
    print("="*60 + "\n")
    
    for name, model in MODELS.items():
        count = await model.all().count()
        print(f"{name:20} {count:>6} records")
    
    print("\n" + "="*60)
    print("Usage: python scripts/view_db.py <table_name> [--limit N]")
    print(f"Tables: {', '.join(MODELS.keys())}")
    print("="*60 + "\n")


async def show_table_data(table_name: str, limit: int = 20):
    """Show data from specific table"""
    if table_name not in MODELS:
        print(f"❌ Unknown table: {table_name}")
        print(f"Available tables: {', '.join(MODELS.keys())}")
        return
    
    model = MODELS[table_name]
    records = await model.all().limit(limit).order_by("-created_at")
    
    if not records:
        print(f"\n📭 No records found in '{table_name}' table\n")
        return
    
    print(f"\n{'='*80}")
    print(f"{table_name.upper()} - Showing {len(records)} of {await model.all().count()} records")
    print(f"{'='*80}\n")
    
    for i, record in enumerate(records, 1):
        print(f"--- Record {i} ---")
        
        # Get all fields
        fields = record._meta.db_fields
        for field_name in fields:
            value = getattr(record, field_name, None)
            
            # Format value
            if isinstance(value, str) and len(value) > 100:
                value = value[:100] + "..."
            
            print(f"  {field_name:20} : {value}")
        
        print()
    
    print(f"{'='*80}\n")


async def show_users():
    """Special formatter for users table"""
    users = await User.all().order_by("-created_at")
    
    if not users:
        print("\n📭 No users registered yet\n")
        return
    
    print(f"\n{'='*80}")
    print(f"USERS - {len(users)} registered")
    print(f"{'='*80}\n")
    print(f"{'Email':<30} {'Name':<20} {'Role':<10} {'Active':<8} {'Last Login':<20}")
    print("-" * 90)
    
    for user in users:
        last_login = user.last_login.strftime("%Y-%m-%d %H:%M") if user.last_login else "Never"
        active = "✓" if user.is_active else "✗"
        print(f"{user.email:<30} {user.full_name:<20} {user.role:<10} {active:<8} {last_login:<20}")
    
    print(f"\n{'='*80}\n")


async def show_alerts_summary():
    """Special formatter for alerts table"""
    alerts = await Alert.all().prefetch_related("city").order_by("-created_at").limit(20)
    
    if not alerts:
        print("\n📭 No alerts generated yet\n")
        return
    
    print(f"\n{'='*80}")
    print(f"ALERTS - Last 20")
    print(f"{'='*80}\n")
    print(f"{'Severity':<12} {'Type':<12} {'City':<15} {'Title':<30} {'Created':<20}")
    print("-" * 90)
    
    for alert in alerts:
        city_name = alert.city.name if hasattr(alert, 'city') else "Unknown"
        created = alert.created_at.strftime("%Y-%m-%d %H:%M")
        title = alert.title[:28] + "..." if len(alert.title) > 30 else alert.title
        print(f"{alert.severity:<12} {alert.type:<12} {city_name:<15} {title:<30} {created:<20}")
    
    print(f"\n{'='*80}\n")


async def main():
    """Main entry point"""
    await init_db()
    
    try:
        if len(sys.argv) == 1:
            # No arguments - show summary
            await show_table_summary()
        else:
            table_name = sys.argv[1].lower()
            
            # Check for --limit flag
            limit = 20
            if "--limit" in sys.argv:
                limit_idx = sys.argv.index("--limit")
                if limit_idx + 1 < len(sys.argv):
                    limit = int(sys.argv[limit_idx + 1])
            
            # Special handlers
            if table_name == "users":
                await show_users()
            elif table_name == "alerts":
                await show_alerts_summary()
            else:
                await show_table_data(table_name, limit)
    
    finally:
        await close_db()


if __name__ == "__main__":
    asyncio.run(main())

"""
Database Models using Tortoise ORM
"""

from tortoise import fields
from tortoise.models import Model


# ========================================
# CORE DATA MODELS
# ========================================

class City(Model):
    id = fields.UUIDField(pk=True)
    name = fields.CharField(max_length=100, unique=True)
    state = fields.CharField(max_length=100)
    population = fields.IntField(null=True)
    latitude = fields.FloatField(null=True)
    longitude = fields.FloatField(null=True)
    created_at = fields.DatetimeField(auto_now_add=True)

    class Meta:
        table = "cities"

    def __str__(self):
        return self.name


# ========================================
# DATA INGESTION MODELS
# ========================================

class EnvironmentData(Model):
    id = fields.UUIDField(pk=True)
    city = fields.ForeignKeyField("models.City", related_name="environment_data")
    
    # Metrics
    aqi = fields.FloatField(null=True)
    pm25 = fields.FloatField(null=True)
    temperature = fields.FloatField(null=True)
    rainfall = fields.FloatField(null=True)
    
    # Metadata
    timestamp = fields.DatetimeField()
    source = fields.CharField(max_length=200)
    is_validated = fields.BooleanField(default=False)
    is_fresh = fields.BooleanField(default=True)
    created_at = fields.DatetimeField(auto_now_add=True)

    class Meta:
        table = "environment_data"
        indexes = ["timestamp"]


class ServiceData(Model):
    id = fields.UUIDField(pk=True)
    city = fields.ForeignKeyField("models.City", related_name="service_data")
    
    # Metrics
    water_supply_stress = fields.FloatField(null=True)  # 0-1 scale
    waste_collection_eff = fields.FloatField(null=True)  # 0-1 scale
    power_outage_count = fields.IntField(null=True)
    
    # Metadata
    timestamp = fields.DatetimeField()
    source = fields.CharField(max_length=200)
    is_validated = fields.BooleanField(default=False)
    is_fresh = fields.BooleanField(default=True)
    created_at = fields.DatetimeField(auto_now_add=True)

    class Meta:
        table = "service_data"
        indexes = ["timestamp"]


class TrafficData(Model):
    id = fields.UUIDField(pk=True)
    city = fields.ForeignKeyField("models.City", related_name="traffic_data")
    
    # Metrics
    zone = fields.CharField(max_length=10)  # A, B, C
    density_percent = fields.FloatField()  # 0-100
    congestion_level = fields.CharField(max_length=20)  # low, medium, high
    heavy_vehicle_count = fields.IntField(null=True)
    
    # Metadata
    timestamp = fields.DatetimeField()
    source = fields.CharField(max_length=200)
    is_validated = fields.BooleanField(default=False)
    is_fresh = fields.BooleanField(default=True)
    created_at = fields.DatetimeField(auto_now_add=True)

    class Meta:
        table = "traffic_data"
        indexes = ["timestamp", "zone"]


# ========================================
# ANALYTICS MODELS
# ========================================

class Forecast(Model):
    id = fields.UUIDField(pk=True)
    city = fields.ForeignKeyField("models.City", related_name="forecasts")
    
    metric_type = fields.CharField(max_length=50)  # aqi, pm25, waterStress, etc.
    target_date = fields.DatetimeField()
    predicted_value = fields.FloatField()
    confidence = fields.FloatField()  # 0-1
    
    explanation = fields.TextField(null=True)
    model_version = fields.CharField(max_length=50, null=True)
    
    created_at = fields.DatetimeField(auto_now_add=True)

    class Meta:
        table = "forecasts"
        indexes = ["metric_type", "target_date"]


class Anomaly(Model):
    id = fields.UUIDField(pk=True)
    city = fields.ForeignKeyField("models.City", related_name="anomalies")
    
    metric_type = fields.CharField(max_length=50)
    detected_at = fields.DatetimeField()
    value = fields.FloatField()
    expected_value = fields.FloatField()
    deviation = fields.FloatField()  # Standard deviations
    severity = fields.CharField(max_length=20)  # low, medium, high
    
    explanation = fields.TextField(null=True)
    resolved = fields.BooleanField(default=False)
    
    created_at = fields.DatetimeField(auto_now_add=True)

    class Meta:
        table = "anomalies"
        indexes = ["detected_at", "resolved"]


class RiskScore(Model):
    id = fields.UUIDField(pk=True)
    city = fields.ForeignKeyField("models.City", related_name="risk_scores")
    
    category = fields.CharField(max_length=50)  # environment, services, overall
    score = fields.FloatField()  # 0-1
    level = fields.CharField(max_length=20)  # low, medium, high
    
    contributing_factors = fields.JSONField()  # Array of factor objects
    
    calculated_at = fields.DatetimeField(auto_now_add=True)

    class Meta:
        table = "risk_scores"
        indexes = ["category", "calculated_at"]


# ========================================
# ALERT MODELS
# ========================================

class Alert(Model):
    id = fields.UUIDField(pk=True)
    city = fields.ForeignKeyField("models.City", related_name="alerts")
    
    type = fields.CharField(max_length=50)  # forecast, anomaly, system
    severity = fields.CharField(max_length=20)  # info, warning, critical
    audience = fields.CharField(max_length=20)  # public, internal, both
    
    title = fields.CharField(max_length=200)
    message = fields.TextField()
    
    is_active = fields.BooleanField(default=True)
    resolved_at = fields.DatetimeField(null=True)
    
    metadata = fields.JSONField(null=True)  # Additional context
    
    created_at = fields.DatetimeField(auto_now_add=True)

    class Meta:
        table = "alerts"
        indexes = ["is_active", "audience"]


# ========================================
# SCENARIO ENGINE MODELS
# ========================================

class Scenario(Model):
    id = fields.UUIDField(pk=True)
    city = fields.ForeignKeyField("models.City", related_name="scenarios")
    
    name = fields.CharField(max_length=200)
    description = fields.TextField(null=True)
    
    # Inputs
    inputs = fields.JSONField()  # Full scenario configuration
    
    # Outputs
    outputs = fields.JSONField()  # Impact predictions
    
    confidence = fields.FloatField(null=True)  # Overall confidence
    explanation = fields.TextField(null=True)
    
    created_by = fields.CharField(max_length=100, null=True)  # User ID (future)
    created_at = fields.DatetimeField(auto_now_add=True)

    class Meta:
        table = "scenarios"
        indexes = ["created_at"]


# ========================================
# TRUST & GOVERNANCE MODELS
# ========================================

class DataSource(Model):
    id = fields.UUIDField(pk=True)
    name = fields.CharField(max_length=200, unique=True)
    type = fields.CharField(max_length=50)  # environment, services, traffic
    
    expected_frequency = fields.IntField()  # minutes
    last_seen_at = fields.DatetimeField(null=True)
    is_online = fields.BooleanField(default=True)
    
    failure_count = fields.IntField(default=0)
    total_ingestions = fields.IntField(default=0)
    
    metadata = fields.JSONField(null=True)
    
    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)

    class Meta:
        table = "data_sources"


class CitizenRequest(Model):
    id = fields.UUIDField(pk=True)
    
    type = fields.CharField(max_length=50)  # data-request, update-request
    city_name = fields.CharField(max_length=100)
    
    requester_name = fields.CharField(max_length=200, null=True)
    requester_email = fields.CharField(max_length=200, null=True)
    
    subject = fields.CharField(max_length=200)
    details = fields.TextField()
    
    status = fields.CharField(max_length=20, default="pending")  # pending, reviewed, resolved
    
    response = fields.TextField(null=True)
    responded_at = fields.DatetimeField(null=True)
    
    created_at = fields.DatetimeField(auto_now_add=True)

    class Meta:
        table = "citizen_requests"
        indexes = ["status", "city_name"]


class SystemAuditLog(Model):
    id = fields.UUIDField(pk=True)
    
    # Request context
    method = fields.CharField(max_length=10)
    path = fields.CharField(max_length=300)
    status_code = fields.IntField()
    latency_ms = fields.FloatField()
    client_ip = fields.CharField(max_length=100, null=True)

    # Actor context
    user_id = fields.CharField(max_length=100, null=True)
    user_email = fields.CharField(max_length=255, null=True)
    user_role = fields.CharField(max_length=50, null=True)

    # Domain context
    category = fields.CharField(max_length=50, default="http_request")  # ingestion, analytics, alert, scenario, http_request
    action = fields.CharField(max_length=200, null=True)
    city_id = fields.CharField(max_length=100, null=True)

    # Extra metadata
    details = fields.JSONField(null=True)
    success = fields.BooleanField()
    error_message = fields.TextField(null=True)
    timestamp = fields.DatetimeField(auto_now_add=True)

    class Meta:
        table = "system_audit_logs"
        indexes = ["timestamp", "status_code", "user_email", "path"]


# ========================================
# USER & AUTHENTICATION MODELS (Phase 5.5)
# ========================================

class User(Model):
    id = fields.UUIDField(pk=True)
    
    email = fields.CharField(max_length=255, unique=True)
    password_hash = fields.CharField(max_length=255)
    
    full_name = fields.CharField(max_length=200)
    role = fields.CharField(max_length=20)  # admin, citizen
    
    is_active = fields.BooleanField(default=True)
    is_verified = fields.BooleanField(default=False)
    
    last_login = fields.DatetimeField(null=True)
    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)

    class Meta:
        table = "users"
        indexes = ["email", "role"]

    def __str__(self):
        return f"{self.full_name} ({self.email})"


# ========================================
# CITIZEN PARTICIPATION MODELS
# ========================================

class DatasetRequest(Model):
    """Citizen requests for dataset access"""
    id = fields.UUIDField(pk=True)
    
    # Requester info
    citizen_name = fields.CharField(max_length=200)
    citizen_email = fields.CharField(max_length=255)
    
    # Request details
    dataset_type = fields.CharField(max_length=50)  # environment, traffic, services, all
    reason = fields.CharField(max_length=50)  # research, academic, civic_project, journalism, other
    description = fields.TextField()
    
    # Status tracking
    status = fields.CharField(max_length=20, default='pending')  # pending, approved, rejected
    admin_notes = fields.TextField(null=True)
    reviewed_by = fields.ForeignKeyField("models.User", related_name="dataset_reviews", null=True)
    reviewed_at = fields.DatetimeField(null=True)
    
    # Metadata
    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)

    class Meta:
        table = "dataset_requests"
        indexes = ["status", "created_at"]


class DataCorrectionRequest(Model):
    """Citizen requests for data corrections"""
    id = fields.UUIDField(pk=True)
    
    # Requester info
    citizen_name = fields.CharField(max_length=200)
    citizen_email = fields.CharField(max_length=255)
    
    # Issue details
    data_type = fields.CharField(max_length=50)  # environment, traffic, services
    city = fields.ForeignKeyField("models.City", related_name="correction_requests")
    issue_description = fields.TextField()
    suggested_correction = fields.JSONField(null=True)
    
    # Evidence/supporting data
    supporting_evidence = fields.TextField(null=True)
    
    # Status tracking
    status = fields.CharField(max_length=20, default='pending')  # pending, investigating, resolved, rejected
    admin_response = fields.TextField(null=True)
    reviewed_by = fields.ForeignKeyField("models.User", related_name="correction_reviews", null=True)
    reviewed_at = fields.DatetimeField(null=True)
    
    # Metadata
    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)

    class Meta:
        table = "data_correction_requests"
        indexes = ["status", "created_at", "data_type"]


# ========================================
# AI SYSTEM MODELS
# ========================================

class AIQueryLog(Model):
    """Audit log for all AI query interactions"""
    id = fields.UUIDField(pk=True)
    
    # Query details
    user = fields.ForeignKeyField("models.User", related_name="ai_queries", null=True)  # Null for anonymous queries
    city = fields.ForeignKeyField("models.City", related_name="ai_queries")
    query_text = fields.TextField()
    query_type = fields.CharField(max_length=20)  # citizen, admin
    
    # Intent classification
    detected_intent = fields.CharField(max_length=50)  # RISK, AIR, TRAFFIC, ALERT, GENERAL, INVALID
    is_valid_domain = fields.BooleanField(default=True)
    
    # Response details
    ai_response = fields.TextField()
    confidence_score = fields.FloatField()  # 0.0 - 1.0
    data_sources = fields.JSONField()  # List of data types used: ["AQI", "Traffic", "Alerts"]
    
    # Performance metrics
    response_time_ms = fields.IntField()  # Time taken to generate response
    model_used = fields.CharField(max_length=100)  # e.g., "groq:llama-3.1-70b"
    
    # Metadata
    created_at = fields.DatetimeField(auto_now_add=True)
    
    class Meta:
        table = "ai_query_logs"
        indexes = ["created_at", "query_type", "detected_intent", "is_valid_domain"]

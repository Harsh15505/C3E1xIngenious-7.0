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
    
    category = fields.CharField(max_length=50)  # ingestion, analytics, alert, scenario
    action = fields.CharField(max_length=200)
    
    city_id = fields.CharField(max_length=100, null=True)
    
    details = fields.JSONField(null=True)
    success = fields.BooleanField()
    
    error_message = fields.TextField(null=True)
    
    timestamp = fields.DatetimeField(auto_now_add=True)

    class Meta:
        table = "system_audit_logs"
        indexes = ["category", "timestamp"]

-- Evaluna ERP Enhanced Attendance System - Database Migration
-- This file contains all SQL statements to create the enhanced attendance tables
-- for the enterprise-grade attendance system

-- Create attendance_status enum
CREATE TYPE attendance_status AS ENUM (
  'present',
  'absent',
  'half_day',
  'late',
  'leave',
  'week_off',
  'holiday',
  'pending_approval',
  'rejected',
  'outside_geofence',
  'gps_error',
  'device_error',
  'selfie_missing'
);

-- Create break_type enum
CREATE TYPE break_type AS ENUM (
  'lunch',
  'tea',
  'personal',
  'meeting',
  'official_visit',
  'custom'
);

-- Create enhanced_attendance table
CREATE TABLE enhanced_attendance (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER REFERENCES employees(id),
  branch_id INTEGER REFERENCES branches(id),
  date DATE NOT NULL,
  check_in TIME,
  check_out TIME,
  check_in_gps JSONB,
  check_out_gps JSONB,
  check_in_selfie JSONB,
  check_out_selfie JSONB,
  check_in_device JSONB,
  check_out_device JSONB,
  check_in_ip VARCHAR(50),
  check_out_ip VARCHAR(50),
  check_in_network VARCHAR(50),
  check_out_network VARCHAR(50),
  working_hours DECIMAL(5, 2),
  break_hours DECIMAL(5, 2) DEFAULT 0,
  late_minutes INTEGER DEFAULT 0,
  early_exit_minutes INTEGER DEFAULT 0,
  overtime_minutes INTEGER DEFAULT 0,
  status attendance_status DEFAULT 'absent',
  risk_score INTEGER DEFAULT 0,
  risk_reasons TEXT[],
  distance_from_office DECIMAL(10, 2),
  is_approved BOOLEAN DEFAULT true,
  approved_by INTEGER REFERENCES employees(id),
  approved_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create attendance_breaks table
CREATE TABLE attendance_breaks (
  id SERIAL PRIMARY KEY,
  attendance_id INTEGER REFERENCES enhanced_attendance(id),
  type break_type NOT NULL,
  reason TEXT,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP,
  duration_minutes INTEGER,
  start_gps JSONB,
  end_gps JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create registered_devices table
CREATE TABLE registered_devices (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER REFERENCES employees(id),
  fingerprint VARCHAR(255) NOT NULL UNIQUE,
  user_agent TEXT,
  platform VARCHAR(50),
  screen_resolution VARCHAR(50),
  timezone VARCHAR(50),
  language VARCHAR(50),
  browser VARCHAR(50),
  os VARCHAR(50),
  device_type VARCHAR(50),
  is_approved BOOLEAN DEFAULT false,
  approved_by INTEGER REFERENCES employees(id),
  approved_at TIMESTAMP,
  last_used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create branch_geofences table
CREATE TABLE branch_geofences (
  id SERIAL PRIMARY KEY,
  branch_id INTEGER REFERENCES branches(id) UNIQUE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  radius INTEGER DEFAULT 100,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create attendance_settings table
CREATE TABLE attendance_settings (
  id SERIAL PRIMARY KEY,
  company_id INTEGER,
  enable_gps BOOLEAN DEFAULT true,
  enable_geofence BOOLEAN DEFAULT true,
  enable_selfie BOOLEAN DEFAULT true,
  enable_device_lock BOOLEAN DEFAULT true,
  enable_break_tracking BOOLEAN DEFAULT true,
  enable_overtime BOOLEAN DEFAULT true,
  enable_auto_checkout BOOLEAN DEFAULT true,
  enable_live_location BOOLEAN DEFAULT false,
  gps_radius INTEGER DEFAULT 100,
  min_gps_accuracy INTEGER DEFAULT 50,
  max_break_time INTEGER DEFAULT 60,
  grace_time INTEGER DEFAULT 10,
  working_hours INTEGER DEFAULT 8,
  auto_checkout_time VARCHAR(5) DEFAULT '18:00',
  photo_compression DECIMAL(3, 2) DEFAULT 0.8,
  photo_size_limit INTEGER DEFAULT 500,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance optimization
CREATE INDEX idx_enhanced_attendance_employee ON enhanced_attendance(employee_id);
CREATE INDEX idx_enhanced_attendance_branch ON enhanced_attendance(branch_id);
CREATE INDEX idx_enhanced_attendance_date ON enhanced_attendance(date);
CREATE INDEX idx_enhanced_attendance_status ON enhanced_attendance(status);

CREATE INDEX idx_attendance_breaks_attendance ON attendance_breaks(attendance_id);
CREATE INDEX idx_attendance_breaks_type ON attendance_breaks(type);

CREATE INDEX idx_registered_devices_employee ON registered_devices(employee_id);
CREATE INDEX idx_registered_devices_fingerprint ON registered_devices(fingerprint);
CREATE INDEX idx_registered_devices_approved ON registered_devices(is_approved);

CREATE INDEX idx_branch_geofences_branch ON branch_geofences(branch_id);
CREATE INDEX idx_branch_geofences_active ON branch_geofences(is_active);

CREATE INDEX idx_attendance_settings_company ON attendance_settings(company_id);

-- Create foreign key constraints
ALTER TABLE enhanced_attendance
  ADD CONSTRAINT fk_enhanced_attendance_approved_by
  FOREIGN KEY (approved_by) REFERENCES employees(id) ON DELETE SET NULL;

ALTER TABLE attendance_breaks
  ADD CONSTRAINT fk_attendance_breaks_attendance
  FOREIGN KEY (attendance_id) REFERENCES enhanced_attendance(id) ON DELETE CASCADE;

ALTER TABLE registered_devices
  ADD CONSTRAINT fk_registered_devices_approved_by
  FOREIGN KEY (approved_by) REFERENCES employees(id) ON DELETE SET NULL;

-- Create triggers for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_enhanced_attendance_timestamp
BEFORE UPDATE ON enhanced_attendance
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_attendance_breaks_timestamp
BEFORE UPDATE ON attendance_breaks
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_registered_devices_timestamp
BEFORE UPDATE ON registered_devices
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_branch_geofences_timestamp
BEFORE UPDATE ON branch_geofences
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_attendance_settings_timestamp
BEFORE UPDATE ON attendance_settings
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Create views for common queries
CREATE VIEW vw_todays_attendance AS
SELECT
  ea.*,
  e.first_name AS employee_first_name,
  e.last_name AS employee_last_name,
  b.name AS branch_name
FROM enhanced_attendance ea
JOIN employees e ON ea.employee_id = e.id
JOIN branches b ON ea.branch_id = b.id
WHERE ea.date = CURRENT_DATE;

CREATE VIEW vw_attendance_with_breaks AS
SELECT
  ea.*,
  jsonb_agg(
    jsonb_build_object(
      'id', ab.id,
      'type', ab.type,
      'reason', ab.reason,
      'startTime', ab.start_time,
      'endTime', ab.end_time,
      'durationMinutes', ab.duration_minutes
    )
  ) AS breaks
FROM enhanced_attendance ea
LEFT JOIN attendance_breaks ab ON ea.id = ab.attendance_id
GROUP BY ea.id;

-- Create functions for common operations
CREATE OR REPLACE FUNCTION calculate_working_hours(
  check_in_time TIMESTAMP,
  check_out_time TIMESTAMP,
  break_minutes INTEGER
) RETURNS DECIMAL(5, 2) AS $$
DECLARE
  total_seconds BIGINT;
  working_seconds BIGINT;
  working_hours DECIMAL(5, 2);
BEGIN
  IF check_in_time IS NULL OR check_out_time IS NULL THEN
    RETURN 0;
  END IF;

  total_seconds := EXTRACT(EPOCH FROM (check_out_time - check_in_time));
  working_seconds := total_seconds - (break_minutes * 60);
  working_hours := working_seconds / 3600.0;

  RETURN working_hours;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION haversine_distance(
  lat1 DECIMAL(10, 8),
  lon1 DECIMAL(11, 8),
  lat2 DECIMAL(10, 8),
  lon2 DECIMAL(11, 8)
) RETURNS DECIMAL(10, 2) AS $$
DECLARE
  R DECIMAL := 6371000; -- Earth radius in meters
  φ1 DECIMAL;
  φ2 DECIMAL;
  Δφ DECIMAL;
  Δλ DECIMAL;
  a DECIMAL;
  c DECIMAL;
  distance DECIMAL;
BEGIN
  φ1 := lat1 * PI() / 180;
  φ2 := lat2 * PI() / 180;
  Δφ := (lat2 - lat1) * PI() / 180;
  Δλ := (lon2 - lon1) * PI() / 180;

  a := SIN(Δφ/2) * SIN(Δφ/2) +
       COS(φ1) * COS(φ2) *
       SIN(Δλ/2) * SIN(Δλ/2);
  c := 2 * ATAN2(SQRT(a), SQRT(1-a));

  distance := R * c;
  RETURN distance;
END;
$$ LANGUAGE plpgsql;

-- Create initial data for testing
-- Insert sample branch geofences
INSERT INTO branch_geofences (branch_id, latitude, longitude, radius, is_active)
VALUES
  (1, 23.215635, 77.412615, 100, true), -- Bhopal Office
  (2, 19.076090, 72.877426, 150, true); -- Mumbai Office

-- Insert sample attendance settings
INSERT INTO attendance_settings (
  company_id,
  enable_gps,
  enable_geofence,
  enable_selfie,
  enable_device_lock,
  enable_break_tracking,
  enable_overtime,
  enable_auto_checkout,
  enable_live_location,
  gps_radius,
  min_gps_accuracy,
  max_break_time,
  grace_time,
  working_hours,
  auto_checkout_time,
  photo_compression,
  photo_size_limit
) VALUES (
  1,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  false,
  100,
  50,
  60,
  10,
  8,
  '18:00',
  0.8,
  500
);

-- Grant permissions to application user
GRANT ALL PRIVILEGES ON TABLE enhanced_attendance TO evaluna_app;
GRANT ALL PRIVILEGES ON TABLE attendance_breaks TO evaluna_app;
GRANT ALL PRIVILEGES ON TABLE registered_devices TO evaluna_app;
GRANT ALL PRIVILEGES ON TABLE branch_geofences TO evaluna_app;
GRANT ALL PRIVILEGES ON TABLE attendance_settings TO evaluna_app;

GRANT ALL PRIVILEGES ON SEQUENCE enhanced_attendance_id_seq TO evaluna_app;
GRANT ALL PRIVILEGES ON SEQUENCE attendance_breaks_id_seq TO evaluna_app;
GRANT ALL PRIVILEGES ON SEQUENCE registered_devices_id_seq TO evaluna_app;
GRANT ALL PRIVILEGES ON SEQUENCE branch_geofences_id_seq TO evaluna_app;
GRANT ALL PRIVILEGES ON SEQUENCE attendance_settings_id_seq TO evaluna_app;

GRANT USAGE ON TYPE attendance_status TO evaluna_app;
GRANT USAGE ON TYPE break_type TO evaluna_app;

GRANT EXECUTE ON FUNCTION calculate_working_hours TO evaluna_app;
GRANT EXECUTE ON FUNCTION haversine_distance TO evaluna_app;
-- CoreApps ERP - Database Monitoring Setup

-- Create read-only monitoring user
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'monitoring') THEN
    CREATE ROLE monitoring WITH LOGIN PASSWORD 'monitor_readonly_2026';
  END IF;
END
$$;

GRANT CONNECT ON DATABASE coreapps TO monitoring;
GRANT USAGE ON SCHEMA public TO monitoring;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO monitoring;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO monitoring;

-- Enable slow query logging (requires superuser)
-- ALTER SYSTEM SET log_min_duration_statement = '100';
-- ALTER SYSTEM SET log_statement = 'none';
-- ALTER SYSTEM SET log_duration = 'off';
-- SELECT pg_reload_conf();

-- Useful monitoring queries

-- Active connections per service
-- SELECT client_addr, usename, application_name, count(*)
-- FROM pg_stat_activity
-- WHERE state = 'active'
-- GROUP BY client_addr, usename, application_name;

-- Slow queries in the last hour
-- SELECT query, calls, mean_exec_time, total_exec_time
-- FROM pg_stat_statements
-- WHERE mean_exec_time > 100
-- ORDER BY mean_exec_time DESC
-- LIMIT 20;

-- Table sizes
-- SELECT relname, pg_size_pretty(pg_total_relation_size(relid))
-- FROM pg_catalog.pg_statio_user_tables
-- ORDER BY pg_total_relation_size(relid) DESC;

-- Index usage
-- SELECT schemaname, relname, indexrelname, idx_scan, idx_tup_read, idx_tup_fetch
-- FROM pg_stat_user_indexes
-- ORDER BY idx_scan DESC;

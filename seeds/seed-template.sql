-- ============================================
-- Seed template (no personal data, parametrizable)
-- Usage:
-- 1) Replace variables below or pass them via a pre-processing step.
-- 2) Ensure the two users exist (landlord/tenant) by registering in the app or
--    insert them here with generic emails you control.
-- 3) Run:  mysql -u root -p <database_name> < seeds/seed-template.sql
-- Notes:
-- - Designed to work with UTF-8 (accents). 
-- - Avoids committing personal emails/IDs into the repository.
-- ============================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- Variables (customize)
SET @LANDLORD_EMAIL = 'landlord@example.com';
SET @TENANT_EMAIL   = 'tenant@example.com';

-- Resolve users by email (must exist)
SET @LANDLORD_ID = (SELECT id FROM users WHERE email = @LANDLORD_EMAIL LIMIT 1);
SET @TENANT_ID   = (SELECT id FROM users WHERE email = @TENANT_EMAIL LIMIT 1);

-- Stop if users do not exist
SELECT 
  IF(@LANDLORD_ID IS NULL, 'ERROR: LANDLORD user not found', 'OK') AS landlord_status,
  IF(@TENANT_ID IS NULL, 'ERROR: TENANT user not found', 'OK')     AS tenant_status;

-- ============================================
-- 1. Roles (idempotent)
-- ============================================
INSERT INTO roles (id, name, description, createdAt, updatedAt) VALUES
('00000000-0000-0000-0000-000000000001', 'admin', 'Administrador del sistema', NOW(), NOW()),
('00000000-0000-0000-0000-000000000002', 'landlord', 'Arrendador de propiedades', NOW(), NOW()),
('00000000-0000-0000-0000-000000000003', 'tenant', 'Inquilino/Estudiante', NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- ============================================
-- 2. Landlord profile (only if user exists)
-- ============================================
INSERT INTO landlords (id, user_id, phone, dni, address, propertyCount, createdAt, updatedAt)
SELECT 
  UUID(), @LANDLORD_ID, '987654321', '12345678', 
  'Av. Cascanueces 2221, Santa Anita, Lima', '2', NOW(), NOW()
WHERE @LANDLORD_ID IS NOT NULL
ON DUPLICATE KEY UPDATE phone = VALUES(phone);

-- ============================================
-- 3. Tenant profile (only if user exists)
-- ============================================
INSERT INTO tenants (id, user_id, phone, code, carrer, cicle, monthly_budget, origin_department, createdAt, updatedAt)
SELECT 
  UUID(), @TENANT_ID, '912345678', 'T2024001', 
  'Ingenieria de Software', '5', 800.00, 'Lima', NOW(), NOW()
WHERE @TENANT_ID IS NOT NULL
ON DUPLICATE KEY UPDATE phone = VALUES(phone);

-- ============================================
-- 4. Properties (owned by landlord)
-- ============================================
INSERT INTO properties (id, title, description, propertyType, address, city, country, latitude, longitude, monthlyPrice, currency, size, bathroomType, bedrooms, bathrooms, includedServices, houseRules, status, viewsCount, tours360Count, tour360Url, landlord_id, createdAt, updatedAt)
SELECT
  '70000000-0000-0000-0000-000000000001',
  'Habitacion moderna cerca de TECSUP',
  'Habitacion amplia y moderna, perfecta para estudiantes.',
  'room', 'Av. Cascanueces 2221, Santa Anita, Lima', 'Lima', 'Peru', -12.0464, -77.0428, 750.00, 'PEN', 25, 'private', 1, 1,
  '["Internet WiFi", "Agua caliente", "Lavadora", "Cocina compartida"]',
  'No mascotas, no fumar, respetar horarios de descanso', 'available', 45, 12,
  'https://example.com/tour360/habitacion-1', @LANDLORD_ID, NOW(), NOW()
WHERE @LANDLORD_ID IS NOT NULL
ON DUPLICATE KEY UPDATE title = VALUES(title);

INSERT INTO properties (id, title, description, propertyType, address, city, country, latitude, longitude, monthlyPrice, currency, size, bathroomType, bedrooms, bathrooms, includedServices, houseRules, status, viewsCount, tours360Count, tour360Url, landlord_id, createdAt, updatedAt)
SELECT
  '70000000-0000-0000-0000-000000000002',
  'Departamento compartido - Zona TECSUP',
  'Departamento compartido con 2 habitaciones.',
  'apartment', 'Jr. Las Begonias 475, San Isidro, Lima', 'Lima', 'Peru', -12.0983, -77.0301, 600.00, 'PEN', 80, 'shared', 2, 2,
  '["Internet WiFi", "Cocina", "Refrigerador", "Lavadora", "TV por cable"]',
  'No visitas despues de las 10pm, mantener limpieza', 'available', 32, 8,
  'https://example.com/tour360/departamento-1', @LANDLORD_ID, NOW(), NOW()
WHERE @LANDLORD_ID IS NOT NULL
ON DUPLICATE KEY UPDATE title = VALUES(title);

-- ============================================
-- 5. Requests (tenant -> landlord properties)
-- ============================================
INSERT INTO requests (id, message, status, property_id, tenant_id, createdAt, updatedAt)
SELECT
  '80000000-0000-0000-0000-000000000001',
  'Hola, estoy interesada en esta propiedad. Esta disponible para visita?', 'pending',
  '70000000-0000-0000-0000-000000000001', 
  (SELECT id FROM tenants WHERE user_id = @TENANT_ID LIMIT 1),
  DATE_SUB(NOW(), INTERVAL 2 DAY), NOW()
WHERE @TENANT_ID IS NOT NULL
ON DUPLICATE KEY UPDATE message = VALUES(message);

INSERT INTO requests (id, message, status, property_id, tenant_id, createdAt, updatedAt)
SELECT
  '80000000-0000-0000-0000-000000000002',
  'Me gustaria conocer mas detalles sobre el alquiler y los servicios incluidos', 'pending',
  '70000000-0000-0000-0000-000000000002', 
  (SELECT id FROM tenants WHERE user_id = @TENANT_ID LIMIT 1),
  DATE_SUB(NOW(), INTERVAL 1 DAY), NOW()
WHERE @TENANT_ID IS NOT NULL
ON DUPLICATE KEY UPDATE message = VALUES(message);

-- ============================================
-- 6. Conversation + participants
-- ============================================
INSERT INTO conversations (id, createdAt, updatedAt)
VALUES ('90000000-0000-0000-0000-000000000001', DATE_SUB(NOW(), INTERVAL 3 DAY), NOW())
ON DUPLICATE KEY UPDATE id = VALUES(id);

INSERT INTO conversation_participants (id, conversationId, userId, lastReadAt, joinedAt)
SELECT 'a0000000-0000-0000-0000-000000000001', '90000000-0000-0000-0000-000000000001', @LANDLORD_ID, NOW(), DATE_SUB(NOW(), INTERVAL 3 DAY)
WHERE @LANDLORD_ID IS NOT NULL
ON DUPLICATE KEY UPDATE conversationId = VALUES(conversationId);

INSERT INTO conversation_participants (id, conversationId, userId, lastReadAt, joinedAt)
SELECT 'a0000000-0000-0000-0000-000000000002', '90000000-0000-0000-0000-000000000001', @TENANT_ID, DATE_SUB(NOW(), INTERVAL 1 HOUR), DATE_SUB(NOW(), INTERVAL 3 DAY)
WHERE @TENANT_ID IS NOT NULL
ON DUPLICATE KEY UPDATE conversationId = VALUES(conversationId);

-- ============================================
-- 7. Messages (alternating sender)
-- ============================================
INSERT INTO messages (id, content, conversationId, senderId, createdAt)
SELECT 'b0000000-0000-0000-0000-000000000001', 'Hola, estoy interesada en la habitacion cerca de TECSUP', '90000000-0000-0000-000000000001', @TENANT_ID, DATE_SUB(NOW(), INTERVAL 3 DAY)
WHERE @TENANT_ID IS NOT NULL
ON DUPLICATE KEY UPDATE content = VALUES(content);

INSERT INTO messages (id, content, conversationId, senderId, createdAt)
SELECT 'b0000000-0000-0000-0000-000000000002', 'Hola! Si, esta disponible. Te gustaria agendar una visita?', '90000000-0000-0000-000000000001', @LANDLORD_ID, DATE_SUB(NOW(), INTERVAL 2 DAY)
WHERE @LANDLORD_ID IS NOT NULL
ON DUPLICATE KEY UPDATE content = VALUES(content);

INSERT INTO messages (id, content, conversationId, senderId, createdAt)
SELECT 'b0000000-0000-0000-0000-000000000003', 'Perfecto, que dias tienes disponible?', '90000000-0000-0000-000000000001', @TENANT_ID, DATE_SUB(NOW(), INTERVAL 1 DAY)
WHERE @TENANT_ID IS NOT NULL
ON DUPLICATE KEY UPDATE content = VALUES(content);

INSERT INTO messages (id, content, conversationId, senderId, createdAt)
SELECT 'b0000000-0000-0000-0000-000000000004', 'Puedo cualquier dia de lunes a viernes despues de las 3pm', '90000000-0000-0000-000000000001', @LANDLORD_ID, DATE_SUB(NOW(), INTERVAL 12 HOUR)
WHERE @LANDLORD_ID IS NOT NULL
ON DUPLICATE KEY UPDATE content = VALUES(content);

-- ============================================
-- 8. Media folders/files (optional)
-- ============================================
INSERT INTO media_folders (id, name, description, path, owner_user_id, createdAt, updatedAt)
SELECT 'c0000000-0000-0000-0000-000000000001', 'Habitacion Principal', 'Fotos de la habitacion principal',
       'properties/70000000-0000-0000-000000000001/images/habitacion-principal', @LANDLORD_ID, NOW(), NOW()
WHERE @LANDLORD_ID IS NOT NULL
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO media_files (id, filename, url, s3Key, type, contentType, property_id, owner_user_id, folder_id, `order`, createdAt, updatedAt)
SELECT 'd0000000-0000-0000-0000-000000000001', 'habitacion-principal-1.jpg', 'https://images.unsplash.com/photo-1611234688667-76b6d8fadd75',
       'properties/70000000-0000-0000-0000-000000000001/images/habitacion-principal-1.jpg', 'image', 'image/jpeg',
       '70000000-0000-0000-0000-000000000001', @LANDLORD_ID, 'c0000000-0000-0000-0000-000000000001', 1, NOW(), NOW()
WHERE @LANDLORD_ID IS NOT NULL
ON DUPLICATE KEY UPDATE filename = VALUES(filename);

-- ============================================
-- 9. Activity logs (generic)
-- ============================================
INSERT INTO activity_logs (id, user_id, entityType, entity_id, action, description, metadata, createdAt)
SELECT UUID(), @TENANT_ID, 'property', '70000000-0000-0000-000000000001', 'view',
       'Usuario visualizo la propiedad', '{"propertyTitle": "Habitacion moderna cerca de TECSUP"}', DATE_SUB(NOW(), INTERVAL 2 DAY)
WHERE @TENANT_ID IS NOT NULL
ON DUPLICATE KEY UPDATE id = id;

SELECT 'Template executed (check warnings if any user variables were NULL)' AS mensaje;



-- ============================================
-- Template de datos de prueba (NO PERSONAL)
-- Instrucciones (leer antes de ejecutar):
-- SECCIÓN REQUERIDA: Los ROLES deben existir ANTES del primer login/registro.
--    Este script inserta (upsert) 'admin', 'landlord' y 'tenant'. EJECÚTALO al menos una vez.
-- 1) Este archivo es un TEMPLATE. NO incluye correos/personas reales.
-- 2) Para usarlo, define los correos de prueba al inicio (variables).
-- 3) Primero registra usuarios con esos correos en la app (login/registro).
-- 4) Ejecuta este script: mysql -u root -p tecsup_rooms < seed-template.sql
-- 5) Si los usuarios no existen, el script no insertará datos dependientes.
-- 6) Evita tildes/caracteres raros si tu consola no tiene UTF-8.
--    Puedes forzar UTF-8 con:
--    SET NAMES utf8mb4; SET CHARACTER SET utf8mb4; SET collation_connection = 'utf8mb4_general_ci';
-- ============================================

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;
SET collation_connection = 'utf8mb4_general_ci';

-- Variables: AJUSTAR a tus correos de prueba
SET @LANDLORD_EMAIL := 'landlord@test.com';
SET @TENANT_EMAIL   := 'tenant@test.com';

-- Buscar IDs de usuarios (deben existir en tabla users)
SET @LANDLORD_ID := (SELECT id FROM users WHERE email = @LANDLORD_EMAIL LIMIT 1);
SET @TENANT_ID   := (SELECT id FROM users WHERE email = @TENANT_EMAIL LIMIT 1);

-- ============================================
-- SECCIÓN REQUERIDA: ROLES MÍNIMOS (ejecutar SIEMPRE al menos una vez)
-- Esto evita errores como: "Rol 'landlord' no encontrado"
-- ============================================
INSERT INTO roles (id, name, description, createdAt, updatedAt) VALUES
('00000000-0000-0000-0000-000000000001', 'admin', 'Administrador', NOW(), NOW()),
('00000000-0000-0000-0000-000000000002', 'landlord', 'Arrendador', NOW(), NOW()),
('00000000-0000-0000-0000-000000000003', 'tenant', 'Inquilino', NOW(), NOW())
ON DUPLICATE KEY UPDATE name=name;

-- Landlord profile (solo si existe el usuario)
INSERT INTO landlords (id, user_id, phone, dni, address, propertyCount, createdAt, updatedAt)
SELECT '40000000-0000-0000-0000-0000000000AA', @LANDLORD_ID, '999999999', '12345678', 'Dirección de prueba', 0, NOW(), NOW()
WHERE @LANDLORD_ID IS NOT NULL
ON DUPLICATE KEY UPDATE phone=phone;

-- Tenant profile (solo si existe el usuario)
INSERT INTO tenants (id, user_id, phone, code, carrer, cicle, monthly_budget, origin_department, createdAt, updatedAt)
SELECT '50000000-0000-0000-0000-0000000000AA', @TENANT_ID, '988888888', 'T2024001', 'Carrera', '5', 800.00, 'Lima', NOW(), NOW()
WHERE @TENANT_ID IS NOT NULL
ON DUPLICATE KEY UPDATE phone=phone;

-- Propiedades (asociadas al landlord)
INSERT INTO properties (id, title, description, propertyType, address, city, country, latitude, longitude, monthlyPrice, currency, size, bathroomType, bedrooms, bathrooms, includedServices, houseRules, status, viewsCount, tours360Count, tour360Url, landlord_id, createdAt, updatedAt)
SELECT
  '70000000-0000-0000-0000-0000000000AA',
  'Habitación de prueba',
  'Descripción de prueba',
  'room',
  'Calle Falsa 123',
  'Lima',
  'Perú',
  -12.0464, -77.0428,
  750.00, 'PEN', 25, 'private', 1, 1,
  '[]', 'Reglas de prueba', 'available', 0, 0, NULL,
  @LANDLORD_ID, NOW(), NOW()
WHERE @LANDLORD_ID IS NOT NULL
ON DUPLICATE KEY UPDATE title=title;

-- Requests del tenant a la propiedad del landlord
INSERT INTO requests (id, message, status, property_id, tenant_id, createdAt, updatedAt)
SELECT
  '80000000-0000-0000-0000-0000000000AA',
  'Hola, estoy interesad@ en esta propiedad.',
  'pending',
  '70000000-0000-0000-0000-0000000000AA',
  (SELECT id FROM tenants WHERE user_id = @TENANT_ID LIMIT 1),
  NOW(), NOW()
WHERE @LANDLORD_ID IS NOT NULL AND @TENANT_ID IS NOT NULL
ON DUPLICATE KEY UPDATE message=message;

-- Conversación base (1-1)
INSERT INTO conversations (id, createdAt, updatedAt) VALUES
('90000000-0000-0000-0000-0000000000AA', DATE_SUB(NOW(), INTERVAL 1 DAY), NOW())
ON DUPLICATE KEY UPDATE id=id;

-- Participantes
INSERT INTO conversation_participants (id, conversationId, userId, lastReadAt, joinedAt) VALUES
('a0000000-0000-0000-0000-0000000000AA', '90000000-0000-0000-0000-0000000000AA', @LANDLORD_ID, NOW(), DATE_SUB(NOW(), INTERVAL 1 DAY)),
('a0000000-0000-0000-0000-0000000000BB', '90000000-0000-0000-0000-0000000000AA', @TENANT_ID, DATE_SUB(NOW(), INTERVAL 1 HOUR), DATE_SUB(NOW(), INTERVAL 1 DAY))
ON DUPLICATE KEY UPDATE conversationId=conversationId;

-- Mensajes de ejemplo
INSERT INTO messages (id, content, conversationId, senderId, createdAt) VALUES
('b0000000-0000-0000-0000-0000000000AA', 'Hola, me interesa la habitación.', '90000000-0000-0000-0000-0000000000AA', @TENANT_ID, DATE_SUB(NOW(), INTERVAL 1 DAY)),
('b0000000-0000-0000-0000-0000000000BB', 'Perfecto, podemos coordinar visita.', '90000000-0000-0000-0000-0000000000AA', @LANDLORD_ID, DATE_SUB(NOW(), INTERVAL 12 HOUR))
ON DUPLICATE KEY UPDATE content=content;

-- Mensaje final
SELECT 'Template ejecutado. Si no ves datos, verifica que los correos configurados existan en la tabla users.' AS mensaje;



# 🏠 TECSUP Rooms - Backend para Arrendadores

Backend API REST para la plataforma de alquiler de habitaciones dirigida a estudiantes de TECSUP.

## 📌 Información del Proyecto

**Institución:** TECSUP - Instituto Superior Tecnológico  
**Proyecto:** Aplicación web y móvil para visitas virtuales 360° a departamentos de alquiler  
**Equipo de Desarrollo:**
- Rodriguez Ordoñez Juan Daniel
- Sifuentes Carranza Sonaly Vania

**Asesor:** Gomez Marín Jaime  

## 🎯 Descripción del Proyecto

Sistema backend desarrollado con NestJS para gestionar propiedades en alquiler por parte de arrendadores. Permite el registro, autenticación y administración completa de propiedades con características como tours virtuales 360°, geolocalización y gestión de servicios incluidos.

## 🚀 Características Principales

- ✅ **Autenticación con Google OAuth2** (sin contraseñas)
- ✅ **Gestión completa de arrendadores** con validación de DNI y teléfono
- ✅ **CRUD de propiedades** con soporte para tours 360°
- ✅ **Geolocalización** de propiedades
- ✅ **Subida y gestión de archivos** e imágenes
- ✅ **API documentada** automáticamente con Swagger
- ✅ **Base de datos MySQL** con TypeORM
- ✅ **Validaciones robustas** en todos los endpoints

## 📋 Requisitos

- Node.js (v18 o superior)
- MySQL (v8.0 o superior)
- npm o yarn

## ⚡ Inicio Rápido

### **1. Clonar el repositorio**
```bash
git clone https://github.com/Vania-0731/C24_5_2025-2_G03_TECSUP_ROOMS_ARRENDADOR_BACK_END.git
cd C24_5_2025-2_G03_TECSUP_ROOMS_ARRENDADOR_BACK_END
```

### **2. Instalar dependencias**
```bash
npm install
```

### **3. Configurar MySQL**
```sql
-- Crear base de datos
CREATE DATABASE tecsup_rooms;
```

### **4. Configurar variables de entorno**
```bash
cp env.example .env
```

Editar el archivo `.env` con tus configuraciones **OBLIGATORIAS**:
```env
# 🗄️ Database (MySQL) - OBLIGATORIO
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=tu_password_mysql
DB_NAME=tecsup_rooms

# 🔐 JWT - OBLIGATORIO
JWT_SECRET=tu-jwt-secret-muy-seguro-y-largo
JWT_EXPIRES_IN=7d

# 🔑 Google OAuth2 - OBLIGATORIO
GOOGLE_CLIENT_ID=tu-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu-google-client-secret

# 🔗 URLs de Login (elige según tu caso)
# Para testing sin frontend (desarrollo):
GOOGLE_CALLBACK_URL=http://localhost:3000/auth-test/google/callback
# Para producción con frontend:
# GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

# 🌐 App - OBLIGATORIO
APP_PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:3001
```

**Resumen:**
1. Ir a [Google Cloud Console](https://console.cloud.google.com/projectcreate)
2. Crear proyecto: `TECSUP-Rooms-Platform`
3. Habilitar Google+ API
4. Crear credenciales OAuth 2.0
5. Agregar URLs de redirección:
   ```
   http://localhost:3000/auth-test/google/callback
   http://localhost:3000/auth/google/callback
   ```

### **6. Ejecutar la aplicación**
```bash
# Desarrollo (recomendado)
npm run start:dev

# Producción
npm run build
npm run start:prod
```

### **7. Verificar que funcione**
```bash
# Servidor corriendo:
🚀 Aplicación ejecutándose en: http://localhost:3000
📚 Documentación API: http://localhost:3000/api/docs

# Probar login:
http://localhost:3000/auth-test/google
```

## 📚 Documentación de la API

Una vez que la aplicación esté ejecutándose, puedes acceder a la documentación de Swagger en:
- **URL**: http://localhost:3000/api/docs

## 🏗️ Estructura del Proyecto

El proyecto sigue una arquitectura modular con carpetas organizadas por funcionalidad:

```
src/
├── modules/                           # 🎯 Módulos principales de la aplicación
│   ├── auth/                         # 🔐 Módulo de Autenticación
│   │   ├── controllers/              # 📋 Controladores de autenticación
│   │   ├── services/                 # ⚙️ Servicios de autenticación
│   │   ├── strategies/               # 🛡️ Estrategias de autenticación
│   │   ├── guards/                   # 🚧 Guards de autenticación
│   │   ├── dto/                      # 📝 DTOs de autenticación
│   │   └── auth.module.ts            # Módulo de autenticación
│   ├── users/                        # 👥 Módulo de Usuarios
│   │   ├── controllers/              # 📋 Controladores de usuarios
│   │   ├── services/                 # ⚙️ Servicios de usuarios
│   │   ├── entities/                 # 🗃️ Entidades de base de datos
│   │   ├── dto/                      # 📝 DTOs de usuarios
│   │   ├── interfaces/               # 🔌 Interfaces de usuarios
│   │   └── users.module.ts           # Módulo de usuarios
│   ├── properties/                   # 🏠 Módulo de Propiedades
│   │   ├── controllers/              # 📋 Controladores de propiedades
│   │   ├── services/                 # ⚙️ Servicios de propiedades
│   │   ├── entities/                 # 🗃️ Entidades de propiedades
│   │   ├── dto/                      # 📝 DTOs de propiedades
│   │   ├── interfaces/               # 🔌 Interfaces de propiedades
│   │   └── properties.module.ts      # Módulo de propiedades
├── database/                         # 🗄️ Configuración de Base de Datos
│   └── database.module.ts            # Módulo de configuración de DB
├── config/                           # ⚙️ Configuraciones
│   ├── app.config.ts                 # Configuración de la aplicación
│   ├── database.config.ts            # Configuración de base de datos
│   └── auth.config.ts                # Configuración de autenticación
├── common/                           # 🔧 Utilidades Comunes
│   ├── decorators/                   # 🏷️ Decoradores personalizados
│   ├── filters/                      # 🔍 Filtros de excepciones
│   ├── guards/                       # 🚧 Guards globales
│   ├── interceptors/                 # 🎯 Interceptores
│   ├── pipes/                        # 🔧 Pipes personalizados
│   └── utils/                        # 🛠️ Utilidades generales
├── app.module.ts                     # 🚀 Módulo principal de la aplicación
└── main.ts                           # 🎯 Punto de entrada de la aplicación
```

### 📋 **Explicación de Carpetas:**

- **📋 controllers/**: Manejan peticiones HTTP y definen endpoints
- **⚙️ services/**: Contienen la lógica de negocio
- **🗃️ entities/**: Definen la estructura de la base de datos
- **📝 dto/**: Validan y estructuran datos de entrada/salida
- **🔌 interfaces/**: Definen contratos y tipos TypeScript
- **🛡️ strategies/**: Implementan estrategias de autenticación
- **🚧 guards/**: Protegen rutas y controlan acceso

## 🔐 Endpoints Principales

### **🔑 Autenticación**
```bash
# Testing (sin frontend)
GET /auth-test/google                    # Login con Google (testing)
GET /auth-test/google/callback           # Callback testing

# Producción (con frontend)
GET /auth/google                         # Login con Google
GET /auth/google/callback                # Callback producción

# Gestión de sesión
POST /auth/complete-registration         # Completar registro
GET /auth/me                             # Obtener usuario actual
POST /auth/logout                        # Cerrar sesión
```

### **👤 Usuarios (Arrendadores)**
```bash
GET  /users/me                           # Obtener perfil completo
PUT  /users/me                           # Actualizar perfil
GET  /users/me/settings                  # Obtener configuración
GET  /users/me/registration-status       # Estado del registro
```

### **🏠 Propiedades**
```bash
POST   /properties                       # Crear nueva propiedad
GET    /properties                       # Listar mis propiedades
GET    /properties/stats                 # Estadísticas de propiedades
GET    /properties/:id                   # Obtener propiedad por ID
PATCH  /properties/:id                   # Actualizar propiedad
DELETE /properties/:id                   # Eliminar propiedad
```

### **📁 Archivos**
```bash
GET    /files                            # Listar archivos
POST   /files/upload                     # Subir archivo
DELETE /files/:id                        # Eliminar archivo
```

## 🧪 Testing

```bash
# Ejecutar tests unitarios
npm run test

# Ejecutar tests con coverage
npm run test:cov

# Ejecutar tests e2e
npm run test:e2e
```

## 📦 Scripts Disponibles

- `npm run build` - Compilar la aplicación
- `npm run start` - Ejecutar la aplicación
- `npm run start:dev` - Ejecutar en modo desarrollo
- `npm run start:debug` - Ejecutar en modo debug
- `npm run lint` - Ejecutar linter
- `npm run format` - Formatear código

## 🔧 Tecnologías Utilizadas

- **NestJS v10** - Framework backend de Node.js
- **TypeORM v0.3** - ORM para TypeScript y MySQL
- **MySQL v8** - Base de datos relacional
- **JWT** - Autenticación basada en tokens
- **Passport** - Middleware de autenticación (Google OAuth2)
- **Swagger** - Documentación automática de API
- **class-validator** - Validación de datos
- **TypeScript v5** - Tipado estático


## 🚨 Notas Importantes

### **⚠️ Antes de Subir a Producción:**
1. **Cambiar** `NODE_ENV=production`
2. **Cambiar** `GOOGLE_CALLBACK_URL` a la URL de producción
3. **Desactivar** `synchronize` en TypeORM (seguridad)
4. **Usar** variables de entorno seguras
5. **Configurar** SSL/HTTPS

### **🔒 Seguridad:**
- ✅ Nunca subir el archivo `.env` a Git
- ✅ Nunca compartir credenciales de Google OAuth2
- ✅ Usar JWT_SECRET largo y aleatorio
- ✅ Validar todos los inputs del usuario
- ✅ Implementar rate limiting en producción


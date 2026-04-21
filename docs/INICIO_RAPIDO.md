# 🚀 Guía Rápida de Inicio - Sistema de Autenticación Guaicaramo

## ⚡ 5 Minutos para Empezar

### Paso 1: Configurar Airtable (2 minutos)

1. Ve a https://airtable.com/api
2. Crea un **Personal Access Token**:
   - Click en "Create token"
   - Dale un nombre: "Guaicaramo Auth"
   - Selecciona scopes: `data.records:read` + `data.records:write`
   - Copia el token generado

3. Crea la tabla de usuarios:
   - Crea una nueva base o usa una existente
   - Crea una tabla llamada: `Users`
   - Campos:
     - **Email** (Text, único)
     - **Password** (Text)
     - **Name** (Text)
     - **Status** (Single select: `active`, `inactive`)
     - **CreatedAt** (Date)

### Paso 2: Configurar Variables (1 minuto)

```bash
# En la raíz del proyecto:
cp .env.example .env.local
```

Edita `.env.local`:
```env
NEXT_PUBLIC_AIRTABLE_API_KEY=pat_xxxxxxxxxxxxx
NEXT_PUBLIC_AIRTABLE_BASE_ID=appXxxxxxxxxxxxxx
NEXT_PUBLIC_AIRTABLE_TABLE_NAME=Users
```

**Cómo obtener el Base ID**:
- Abre tu base en Airtable
- Mira la URL: `https://airtable.com/app**[AQUI_VA_TU_BASE_ID]**/`

### Paso 3: Instalar y Ejecutar (2 minutos)

```bash
# Instalar dependencias
npm install

# Ejecutar servidor de desarrollo
npm run dev
```

## 🎮 Probar la Autenticación

1. **Abre**: http://localhost:3000/auth
2. **Ve a Airtable** y agrega un usuario en la tabla `Users`:
   ```
   Email: test@example.com
   Password: TestPassword123!
   Name: Test User
   Status: active
   ```

3. **Inicia sesión** con esas credenciales
4. **Verás** el dashboard en `/dashboard`

## 📁 Estructura de Carpetas

```
src/
├── app/
│   ├── auth/              ← 📍 ACCESO A /auth
│   ├── dashboard/         ← 📍 ACCESO A /dashboard (protegido)
│   ├── layout.tsx         ← Layout principal
│   └── globals.css        ← Estilos con colores
├── components/auth/       ← Componentes de autenticación
│   ├── LoginForm.tsx
│   ├── RegisterForm.tsx
│   ├── AuthContainer.tsx
│   └── ProtectedRoute.tsx
└── lib/
    ├── airtable.ts        ← Integración Airtable
    ├── validation.ts      ← Validaciones
    └── useAuth.ts         ← Hook de autenticación
```

## 🎨 Rutas Disponibles

| Ruta | Descripción |
|------|------------|
| `/` | Página de inicio (sin cambios) |
| `/auth` | 🔓 Acceso público - Login/Registro |
| `/dashboard` | 🔐 Protegido - Dashboard del usuario |

## 🔑 Credenciales de Prueba

```
Email: test@example.com
Password: TestPassword123!
```

**Requisitos de contraseña**:
- 8+ caracteres
- Una mayúscula
- Una minúscula
- Un número
- Un carácter especial (!@#$%^&*)

## 🎨 Colores Disponibles

```css
--primary: #2563eb      (Azul)
--secondary: #7c3aed    (Púrpura)
--success: #10b981      (Verde)
--error: #ef4444        (Rojo)
--warning: #f59e0b      (Ámbar)
--info: #06b6d4         (Cian)
```

## ⚙️ Personalización Rápida

### Cambiar Nombre de la Aplicación

1. **Archivo**: `src/components/auth/AuthContainer.tsx`
2. **Busca**: `<h1 className="text-2xl font-bold...">Guaicaramo</h1>`
3. **Reemplaza**: "Guaicaramo" por tu nombre

### Cambiar Color Principal

1. **Archivo**: `src/app/globals.css`
2. **Busca**: `--primary: #2563eb;`
3. **Reemplaza**: Con tu color hex favorito

### Cambiar Tabla de Airtable

1. **Archivo**: `.env.local`
2. **Edita**: `NEXT_PUBLIC_AIRTABLE_TABLE_NAME=MiTabla`

## 🆘 Si Algo Falla

### Error: "NEXT_PUBLIC_AIRTABLE_API_KEY no está configurada"
```bash
# Reinicia el servidor
npm run dev
```

### Error: "El email ya está registrado" pero no existe
```bash
# Verifica en Airtable que el campo Email sea único
# Base de datos > Tabla Users > Fields > Email > Unique
```

### La autenticación no funciona
1. Verifica que el usuario existe en Airtable
2. Verifica que Status = "active"
3. Revisa que la contraseña sea exacta
4. Abre DevTools (F12) para ver errores en la consola

## 📖 Documentación Completa

- **`AUTENTICACION.md`** - Guía técnica detallada
- **`IMPLEMENTACION_RESUMEN.md`** - Lista de archivos creados
- **Este archivo** - Guía rápida

## 🚨 Importante para Producción

Antes de desplegar:

1. ✅ Implementar **bcrypt** para hash de contraseñas
   ```bash
   npm install bcrypt
   ```

2. ✅ Usar **jsonwebtoken** real
   ```bash
   npm install jsonwebtoken
   ```

3. ✅ Mover API Key a variables de backend
4. ✅ Activar HTTPS
5. ✅ Implementar rate limiting
6. ✅ Usar cookies httpOnly

## 💡 Consejos

- **Desarrollo rápido**: Usa `npm run dev` para hot-reload
- **Depuración**: Abre DevTools (F12) para ver errores
- **Airtable**: Crea tablas de prueba primero
- **Seguridad**: Lee las recomendaciones en AUTENTICACION.md

---

**¿Necesitas ayuda?** Consulta `AUTENTICACION.md` para la documentación completa.

**¿Todo funciona?** 🎉 ¡A disfrutar tu sistema de autenticación!

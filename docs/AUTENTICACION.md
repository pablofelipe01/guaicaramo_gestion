# 🔐 Sistema de Autenticación Guaicaramo

## Descripción General

Sistema de login/registro profesional integrado con Airtable para gestionar usuarios. Incluye validaciones de seguridad, interfaz intuitiva y protección de rutas.

## 🚀 Características

- ✅ Login y Registro con validación robusta
- ✅ Integración con Airtable via API
- ✅ Validación de contraseñas (8+ caracteres, mayúsculas, números, caracteres especiales)
- ✅ Protección contra XSS
- ✅ Tokens JWT con expiración
- ✅ Rutas protegidas
- ✅ Diseño responsivo y profesional
- ✅ Indicadores visuales de requisitos
- ✅ Mensajes de error/éxito claros
- ✅ Loader de estado de carga

## 📋 Requisitos Previos

### 1. Configurar Airtable

#### Paso 1: Crear API Key
1. Ve a [airtable.com/api](https://airtable.com/api)
2. Selecciona tu workspace
3. En la sección "Authentication", crea un Personal Access Token:
   - Haz clic en "Create token"
   - Dale un nombre descriptivo
   - Selecciona los scopes necesarios:
     - `data.records:read`
     - `data.records:write`
   - Copia el token generado

#### Paso 2: Crear Base de Datos
1. Ve a [airtable.com](https://airtable.com)
2. Crea una nueva base de datos o usa una existente
3. Crea una tabla llamada `Users` con los siguientes campos:
   - **Email** (Text) - Campo único
   - **Password** (Text) - Para almacenar contraseñas hasheadas
   - **Name** (Text)
   - **Status** (Single select) - Valores: `active`, `inactive`
   - **CreatedAt** (Date)

#### Paso 3: Obtener IDs
- **Base ID**: Abre tu base en Airtable y busca en la URL: `https://airtable.com/app**[BASE_ID]**/`
- **API Key**: La que generaste en el Paso 1

### 2. Configurar Variables de Entorno

1. Copia el archivo `.env.example` a `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Completa las variables:
   ```env
   NEXT_PUBLIC_AIRTABLE_API_KEY=pat_xxxxxxxxxxxxx
   NEXT_PUBLIC_AIRTABLE_BASE_ID=appXxxxxxxxxxxxxx
   NEXT_PUBLIC_AIRTABLE_TABLE_NAME=Users
   ```

⚠️ **Nota**: Las variables `NEXT_PUBLIC_*` son visibles en el cliente (usar solo para claves públicas)

## 📁 Estructura de Archivos

```
src/
├── app/
│   ├── auth/
│   │   └── page.tsx              # Página de autenticación
│   ├── layout.tsx                # Layout principal
│   └── globals.css               # Estilos globales
├── components/
│   └── auth/
│       ├── AuthContainer.tsx     # Contenedor principal
│       ├── LoginForm.tsx         # Formulario de login
│       ├── RegisterForm.tsx      # Formulario de registro
│       └── ProtectedRoute.tsx    # Componente protector de rutas
└── lib/
    ├── airtable.ts              # Servicio de Airtable
    ├── validation.ts            # Validaciones
    └── useAuth.ts               # Hook de autenticación
```

## 🔒 Seguridad

### Implementado:
- ✅ Validación de contraseñas fuerte
- ✅ Sanitización de inputs (prevención XSS)
- ✅ Tokens JWT con expiración
- ✅ Mensajes de error genéricos (prevención de enumeración de usuarios)
- ✅ CORS en solicitudes a Airtable

### Recomendaciones para Producción:

1. **Hash de Contraseñas**: Implementar `bcrypt`
   ```bash
   npm install bcrypt
   npm install -D @types/bcrypt
   ```
   
   En `src/lib/airtable.ts`, reemplazar:
   ```typescript
   import bcrypt from 'bcrypt';
   
   // Al registrar:
   const hashedPassword = await bcrypt.hash(password, 10);
   
   // Al autenticar:
   const passwordMatch = await bcrypt.compare(password, user.fields.Password);
   ```

2. **JWT Real**: Usar la librería `jsonwebtoken`
   ```bash
   npm install jsonwebtoken
   npm install -D @types/jsonwebtoken
   ```

3. **Rate Limiting**: Implementar límite de intentos de login
4. **HTTPS**: Solo permitir conexiones seguras en producción
5. **API Key en Backend**: Mover la API key de Airtable a variables de entorno del servidor

## 🎨 Paleta de Colores

```
Primario: #2563eb (Azul)
Secundario: #7c3aed (Púrpura)
Éxito: #10b981 (Verde)
Error: #ef4444 (Rojo)
Warning: #f59e0b (Ámbar)
Info: #06b6d4 (Cian)
```

## 📱 Uso

### Página de Login
```
Ruta: /auth
- Permite iniciar sesión con email y contraseña
- Switch a registro con un botón
- Validación en tiempo real
```

### Proteger una Ruta
```tsx
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <div>Tu contenido protegido</div>
    </ProtectedRoute>
  );
}
```

### Usar el Hook de Autenticación
```tsx
'use client';

import { useAuth } from '@/lib/useAuth';

export default function Component() {
  const { user, isAuthenticated, logout } = useAuth();

  if (isAuthenticated) {
    return <div>Hola {user?.name}!</div>;
  }

  return <div>Por favor inicia sesión</div>;
}
```

## 🧪 Testing

### Crear usuario de prueba en Airtable
1. Email: `test@example.com`
2. Password: `TestPassword123!`
3. Name: `Test User`
4. Status: `active`

## 🐛 Troubleshooting

### Error: "NEXT_PUBLIC_AIRTABLE_API_KEY no está configurada"
- Verifica que el archivo `.env.local` existe
- Reinicia el servidor: `npm run dev`
- Verifica las variables están sin espacios

### Error: "El email ya está registrado"
- Verifica que no exista un usuario con ese email en Airtable
- Comprueba que el campo Email sea único en Airtable

### La autenticación no funciona después de registrar
- Verifica que la contraseña tenga todos los requisitos
- Asegúrate que el campo Password en Airtable es de tipo Text
- Verifica el Status del usuario sea "active"

## 📞 Soporte

Para reportar problemas o solicitar mejoras, contacta al equipo de desarrollo.

## 📝 Notas Importantes

- **Contraseñas en Texto Plano**: Este código almacena contraseñas en texto plano por demostración. En producción, usa bcrypt.
- **Tokens en LocalStorage**: Los tokens se guardan en localStorage. Para máxima seguridad, usa cookies httpOnly en el backend.
- **API Key Pública**: La API key está en variables `NEXT_PUBLIC_*`, visible para el cliente. Para producción, mejor manejarla desde el backend.

---

**Última actualización**: Abril 2026
**Versión**: 1.0.0

@echo off
REM Script de Configuración Rápida para Guaicaramo Auth
REM Este script configura el sistema de autenticación

echo.
echo 🔐 Configurando Sistema de Autenticacion Guaicaramo...
echo.

REM Verificar si .env.local existe
if not exist .env.local (
    echo 📝 Creando archivo .env.local...
    copy .env.example .env.local
    echo ✅ Archivo .env.local creado. Por favor, editalo con tus credenciales de Airtable
) else (
    echo ✅ Archivo .env.local ya existe
)

echo.
echo 📦 Instalando dependencias...
call npm install

echo.
echo ✅ Configuracion completada!
echo.
echo 📋 Proximos pasos:
echo 1. Edita .env.local con tus credenciales de Airtable
echo 2. Ejecuta: npm run dev
echo 3. Abre: http://localhost:3000/auth
echo 4. Consulta AUTENTICACION.md para mas detalles
echo.
echo 💡 Para mejorar la seguridad en produccion, instala:
echo    npm install bcrypt jsonwebtoken
echo    npm install -D @types/bcrypt @types/jsonwebtoken
echo.
pause

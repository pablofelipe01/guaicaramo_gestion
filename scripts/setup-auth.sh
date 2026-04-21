#!/bin/bash

# Script de Configuración Rápida para Guaicaramo Auth
# Este script configura el sistema de autenticación

echo "🔐 Configurando Sistema de Autenticación Guaicaramo..."
echo ""

# Verificar si .env.local existe
if [ ! -f .env.local ]; then
    echo "📝 Creando archivo .env.local..."
    cp .env.example .env.local
    echo "✅ Archivo .env.local creado. Por favor, edítalo con tus credenciales de Airtable"
else
    echo "✅ Archivo .env.local ya existe"
fi

echo ""
echo "📦 Instalando dependencias..."
npm install

echo ""
echo "✅ Configuración completada!"
echo ""
echo "📋 Próximos pasos:"
echo "1. Edita .env.local con tus credenciales de Airtable"
echo "2. Ejecuta: npm run dev"
echo "3. Abre: http://localhost:3000/auth"
echo "4. Consulta AUTENTICACION.md para más detalles"
echo ""
echo "💡 Para mejorar la seguridad en producción, instala:"
echo "   npm install bcrypt jsonwebtoken"
echo "   npm install -D @types/bcrypt @types/jsonwebtoken"

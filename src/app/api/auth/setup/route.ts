import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcrypt'
import { listRecords, createRecords, updateRecord } from '@/lib/airtable-client'

interface UserFields {
  Email: string
  'Password Hash': string
  'Nombre Completo'?: string
  Estado?: string
  Rol?: string[]
  'Fecha Creacion'?: string
}

// Solo disponible en desarrollo. En producción eliminar o proteger con una variable de entorno.
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ message: 'No disponible en producción' }, { status: 403 })
  }

  try {
    const { email, password, name } = await request.json()
    if (!email || !password || !name) {
      return NextResponse.json({ message: 'email, password y name son requeridos' }, { status: 400 })
    }

    const table = process.env.AIRTABLE_TABLE_USERS ?? 'USUARIOS'
    const { records: existing } = await listRecords<UserFields>(table, {
      filterByFormula: `{Email}="${email}"`,
      maxRecords: 1,
    })

    const hash = await bcrypt.hash(password, 10)

    if (existing.length > 0) {
      // Actualiza solo el hash y el nombre, sin tocar Estado (tiene opciones fijas en Airtable)
      const updated = await updateRecord<UserFields>(table, existing[0].id, {
        'Password Hash': hash,
        'Nombre Completo': name,
      })
      return NextResponse.json({
        message: 'Usuario actualizado con nueva contraseña',
        user: { id: updated.id, email: updated.fields.Email, name: updated.fields['Nombre Completo'] },
      })
    }

    // Crea el usuario nuevo
    const [newUser] = await createRecords<UserFields>(table, [{
      fields: {
        Email: email,
        'Password Hash': hash,
        'Nombre Completo': name,
        Estado: 'activo',
        'Fecha Creacion': new Date().toISOString().split('T')[0],
      },
    }])

    return NextResponse.json({
      message: 'Usuario creado exitosamente',
      user: { id: newUser.id, email: newUser.fields.Email, name: newUser.fields['Nombre Completo'] },
    }, { status: 201 })

  } catch (error) {
    console.error('Error en setup:', error)
    return NextResponse.json({ message: 'Error al crear usuario', error: String(error) }, { status: 500 })
  }
}

// GET para verificar qué usuarios hay en Airtable (solo dev)
export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ message: 'No disponible en producción' }, { status: 403 })
  }

  try {
    const table = process.env.AIRTABLE_TABLE_USERS ?? 'USUARIOS'
    const { records } = await listRecords<UserFields>(table, { maxRecords: 20 })
    return NextResponse.json({
      total: records.length,
      users: records.map(r => ({
        id: r.id,
        email: r.fields.Email,
        name: r.fields['Nombre Completo'],
        estado: r.fields.Estado,
        tieneHash: !!r.fields['Password Hash'],
      })),
    })
  } catch (error) {
    return NextResponse.json({ message: 'Error', error: String(error) }, { status: 500 })
  }
}

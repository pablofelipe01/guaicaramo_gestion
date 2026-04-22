import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcrypt'
import { listRecords, createRecords } from '@/lib/airtable-client'
import { signToken } from '@/lib/auth'

interface UserFields {
  Email: string
  'Password Hash': string
  'Nombre Completo'?: string
  Estado?: string
  'Fecha Creacion'?: string
}

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json()

    if (!email || !password || !name) {
      return NextResponse.json(
        { success: false, message: 'Todos los campos son requeridos' },
        { status: 400 }
      )
    }

    const table = process.env.AIRTABLE_TABLE_USERS ?? 'USUARIOS'

    const { records: existing } = await listRecords<UserFields>(table, {
      filterByFormula: `{Email}="${email}"`,
      maxRecords: 1,
    })

    if (existing.length > 0) {
      return NextResponse.json(
        { success: false, message: 'El email ya está registrado' },
        { status: 409 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const [newUser] = await createRecords<UserFields>(table, [
      {
        fields: {
          Email: email,
          'Password Hash': hashedPassword,
          'Nombre Completo': name,
          Estado: 'activo',
          'Fecha Creacion': new Date().toISOString().split('T')[0],
        },
      },
    ])

    const token = await signToken({
      id: newUser.id,
      email: newUser.fields.Email,
      name: newUser.fields['Nombre Completo'] ?? name,
      role: 'coordinador_sst',
    })

    return NextResponse.json(
      {
        success: true,
        message: 'Usuario registrado exitosamente',
        token,
        user: {
          id: newUser.id,
          email: newUser.fields.Email,
          name: newUser.fields['Nombre Completo'],
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error en registro:', error)
    return NextResponse.json(
      { success: false, message: 'Error al registrar usuario' },
      { status: 500 }
    )
  }
}

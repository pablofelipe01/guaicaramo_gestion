import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcrypt'
import { listRecords } from '@/lib/airtable-client'
import { signToken } from '@/lib/auth'

interface UserFields {
  Email: string
  'Password Hash': string
  Name?: string
  Status?: string
  Role?: string
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email y contraseña son requeridos' },
        { status: 400 }
      )
    }

    const table = process.env.AIRTABLE_TABLE_USERS ?? 'Usuarios'
    const { records } = await listRecords<UserFields>(table, {
      filterByFormula: `Email="${email}"`,
      maxRecords: 1,
    })

    if (records.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Email o contraseña inválidos' },
        { status: 401 }
      )
    }

    const user = records[0]
    const storedHash = user.fields['Password Hash']

    if (!storedHash) {
      return NextResponse.json(
        { success: false, message: 'Configuración de cuenta inválida' },
        { status: 401 }
      )
    }

    const passwordMatch = await bcrypt.compare(password, storedHash)
    if (!passwordMatch) {
      return NextResponse.json(
        { success: false, message: 'Email o contraseña inválidos' },
        { status: 401 }
      )
    }

    if (user.fields.Status === 'inactive') {
      return NextResponse.json(
        { success: false, message: 'La cuenta está desactivada' },
        { status: 403 }
      )
    }

    const token = await signToken({
      id: user.id,
      email: user.fields.Email,
      name: user.fields.Name ?? 'Usuario',
      role: user.fields.Role ?? 'trabajador',
    })

    return NextResponse.json({
      success: true,
      message: 'Autenticación exitosa',
      token,
      user: {
        id: user.id,
        email: user.fields.Email,
        name: user.fields.Name,
        role: user.fields.Role,
      },
    })
  } catch (error) {
    console.error('Error en login:', error)
    return NextResponse.json(
      { success: false, message: 'Error en el servidor' },
      { status: 500 }
    )
  }
}

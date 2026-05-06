import 'server-only'
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ALGO   = 'aes-256-gcm'
const PREFIX = 'aes256gcm'

function getKey(): Buffer {
  const hex = process.env.FIRMA_ENCRYPTION_KEY
  if (!hex) throw new Error('FIRMA_ENCRYPTION_KEY no está configurada')
  const buf = Buffer.from(hex, 'hex')
  if (buf.length !== 32) throw new Error('FIRMA_ENCRYPTION_KEY debe ser 64 caracteres hex (32 bytes)')
  return buf
}

/**
 * Encripta un data URL de firma con AES-256-GCM.
 *
 * Formato de salida: `aes256gcm.{iv_b64}.{tag_b64}.{cipher_b64}`
 * - IV  : 12 bytes (96-bit), recomendado para GCM
 * - Tag : 16 bytes de autenticación (previene alteraciones)
 * - Cipher: datos cifrados en base64
 *
 * El IV es único por cada llamada (randomBytes), por lo que dos cifrados del
 * mismo dato producen resultados distintos.
 */
export function encriptarFirma(dataUrl: string): string {
  const key    = getKey()
  const iv     = randomBytes(12)
  const cipher = createCipheriv(ALGO, key, iv)

  const cifrado = Buffer.concat([
    cipher.update(dataUrl, 'utf8'),
    cipher.final(),
  ])
  const tag = cipher.getAuthTag()

  return [
    PREFIX,
    iv.toString('base64'),
    tag.toString('base64'),
    cifrado.toString('base64'),
  ].join('.')
}

/**
 * Desencripta y verifica la integridad de una firma almacenada.
 * Retorna el data URL original, o `null` si el token es inválido o fue alterado.
 */
export function desencriptarFirma(encriptado: string): string | null {
  try {
    const partes = encriptado.split('.')
    if (partes.length !== 4 || partes[0] !== PREFIX) return null

    const key      = getKey()
    const iv       = Buffer.from(partes[1], 'base64')
    const tag      = Buffer.from(partes[2], 'base64')
    const cifrado  = Buffer.from(partes[3], 'base64')

    const decipher = createDecipheriv(ALGO, key, iv)
    decipher.setAuthTag(tag)

    const descifrado = Buffer.concat([decipher.update(cifrado), decipher.final()])
    return descifrado.toString('utf8')
  } catch {
    return null
  }
}

/**
 * Indica si una cadena tiene el formato de firma encriptada de este módulo.
 */
export function esFirmaEncriptada(valor: string): boolean {
  return valor.startsWith(`${PREFIX}.`) && valor.split('.').length === 4
}

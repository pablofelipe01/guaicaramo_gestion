import 'server-only'

export interface AirtableRecord<T = Record<string, unknown>> {
  id: string
  fields: T
  createdTime: string
}

export interface ListParams {
  filterByFormula?: string
  sort?: { field: string; direction?: 'asc' | 'desc' }[]
  fields?: string[]
  maxRecords?: number
  offset?: string
  view?: string
}

export interface ListResponse<T> {
  records: AirtableRecord<T>[]
  offset?: string
}

export class AirtableError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message)
    this.name = 'AirtableError'
  }
}

function getConfig() {
  const apiKey = process.env.AIRTABLE_API_KEY
  const baseId = process.env.AIRTABLE_BASE_ID
  if (!apiKey) throw new Error('AIRTABLE_API_KEY no está configurada')
  if (!baseId) throw new Error('AIRTABLE_BASE_ID no está configurada')
  return {
    baseUrl: `https://api.airtable.com/v0/${baseId}`,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    } as HeadersInit,
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.text()
    throw new AirtableError(
      response.status,
      `Airtable ${response.status}: ${body}`
    )
  }
  return response.json() as Promise<T>
}

export async function listRecords<T = Record<string, unknown>>(
  table: string,
  params?: ListParams
): Promise<ListResponse<T>> {
  const { baseUrl, headers } = getConfig()
  const url = new URL(`${baseUrl}/${encodeURIComponent(table)}`)

  if (params?.filterByFormula)
    url.searchParams.set('filterByFormula', params.filterByFormula)
  if (params?.maxRecords)
    url.searchParams.set('maxRecords', String(params.maxRecords))
  if (params?.offset) url.searchParams.set('offset', params.offset)
  if (params?.view) url.searchParams.set('view', params.view)
  if (params?.fields)
    params.fields.forEach((f) => url.searchParams.append('fields[]', f))
  if (params?.sort) {
    params.sort.forEach((s, i) => {
      url.searchParams.set(`sort[${i}][field]`, s.field)
      if (s.direction)
        url.searchParams.set(`sort[${i}][direction]`, s.direction)
    })
  }

  const res = await fetch(url.toString(), { method: 'GET', headers })
  return handleResponse<ListResponse<T>>(res)
}

export async function getRecord<T = Record<string, unknown>>(
  table: string,
  id: string
): Promise<AirtableRecord<T>> {
  const { baseUrl, headers } = getConfig()
  const res = await fetch(
    `${baseUrl}/${encodeURIComponent(table)}/${id}`,
    { method: 'GET', headers }
  )
  return handleResponse<AirtableRecord<T>>(res)
}

export async function createRecords<T = Record<string, unknown>>(
  table: string,
  records: { fields: Partial<T> }[]
): Promise<AirtableRecord<T>[]> {
  const { baseUrl, headers } = getConfig()
  const res = await fetch(`${baseUrl}/${encodeURIComponent(table)}`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ records }),
  })
  const data = await handleResponse<{ records: AirtableRecord<T>[] }>(res)
  return data.records
}

export async function updateRecord<T = Record<string, unknown>>(
  table: string,
  id: string,
  fields: Partial<T>
): Promise<AirtableRecord<T>> {
  const { baseUrl, headers } = getConfig()
  const res = await fetch(
    `${baseUrl}/${encodeURIComponent(table)}/${id}`,
    {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ fields }),
    }
  )
  return handleResponse<AirtableRecord<T>>(res)
}

export async function deleteRecord(table: string, id: string): Promise<void> {
  const { baseUrl, headers } = getConfig()
  const res = await fetch(
    `${baseUrl}/${encodeURIComponent(table)}/${id}`,
    { method: 'DELETE', headers }
  )
  await handleResponse<unknown>(res)
}

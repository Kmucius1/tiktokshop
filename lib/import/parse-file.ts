// Parses CSV or XLSX files into row arrays.
// Returns { headers, rows } where rows is array of header→value objects.

export interface ParsedFile {
  headers: string[]
  rows: Record<string, string>[]
  error?: string
}

export async function parseFile(file: File): Promise<ParsedFile> {
  const name = file.name.toLowerCase()

  if (name.endsWith('.csv') || name.endsWith('.txt')) {
    return parseCSV(await file.text())
  }

  if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
    return parseXLSX(await file.arrayBuffer())
  }

  return { headers: [], rows: [], error: `Unsupported file type: ${file.name}` }
}

function parseCSV(text: string): ParsedFile {
  const lines = text.split(/\r?\n/).filter(l => l.trim())
  if (lines.length < 2) return { headers: [], rows: [], error: 'File is empty or has no data rows' }

  const headers = splitCSVLine(lines[0])
  const rows: Record<string, string>[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = splitCSVLine(lines[i])
    if (values.every(v => !v.trim())) continue
    const row: Record<string, string> = {}
    headers.forEach((h, idx) => {
      row[h] = values[idx]?.trim() ?? ''
    })
    rows.push(row)
  }

  return { headers, rows }
}

function splitCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current)
  return result.map(s => s.trim())
}

async function parseXLSX(buffer: ArrayBuffer): Promise<ParsedFile> {
  // Dynamic import so xlsx only loads when needed
  const XLSX = await import('xlsx')
  const wb = XLSX.read(buffer, { type: 'array' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const data = XLSX.utils.sheet_to_json(ws, {
    header: 1,
    defval: '',
    blankrows: false,
  }) as unknown[][]

  if (!data || data.length < 2) {
    return { headers: [], rows: [], error: 'File is empty or has no data rows' }
  }

  const headers = (data[0] as unknown[]).map(h => String(h ?? '').trim())
  const rows: Record<string, string>[] = []

  for (let i = 1; i < data.length; i++) {
    const values = data[i] as unknown[]
    if (!values || values.every(v => !String(v ?? '').trim())) continue
    const row: Record<string, string> = {}
    headers.forEach((h, idx) => {
      row[h] = String(values[idx] ?? '').trim()
    })
    rows.push(row)
  }

  return { headers, rows }
}

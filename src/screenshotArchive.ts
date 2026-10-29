export function screenshotArchive(images: string[]): Blob {
  const parts: BlobPart[] = []
  const directory: Uint8Array<ArrayBuffer>[] = []
  let offset = 0
  images.forEach((image, index) => {
    const name = new TextEncoder().encode(`forum-${index + 1}.png`)
    const bytes = Uint8Array.from(atob(image.slice(image.indexOf(',') + 1)), c => c.charCodeAt(0))
    let crc = 0xffffffff
    for (const byte of bytes) {
      crc ^= byte
      for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0)
    }
    crc = (crc ^ 0xffffffff) >>> 0
    const local = new Uint8Array(30 + name.length)
    const view = new DataView(local.buffer)
    view.setUint32(0, 0x04034b50, true)
    view.setUint16(4, 20, true)
    view.setUint16(12, 33, true)
    view.setUint32(14, crc, true)
    view.setUint32(18, bytes.length, true)
    view.setUint32(22, bytes.length, true)
    view.setUint16(26, name.length, true)
    local.set(name, 30)
    parts.push(local, bytes)
    const entry = new Uint8Array(46 + name.length)
    const central = new DataView(entry.buffer)
    central.setUint32(0, 0x02014b50, true)
    central.setUint16(4, 20, true)
    central.setUint16(6, 20, true)
    central.setUint16(14, 33, true)
    central.setUint32(16, crc, true)
    central.setUint32(20, bytes.length, true)
    central.setUint32(24, bytes.length, true)
    central.setUint16(28, name.length, true)
    central.setUint32(42, offset, true)
    entry.set(name, 46)
    directory.push(entry)
    offset += local.length + bytes.length
  })
  const end = new Uint8Array(22)
  const view = new DataView(end.buffer)
  view.setUint32(0, 0x06054b50, true)
  view.setUint16(8, images.length, true)
  view.setUint16(10, images.length, true)
  view.setUint32(12, directory.reduce((sum, entry) => sum + entry.length, 0), true)
  view.setUint32(16, offset, true)
  return new Blob([...parts, ...directory, end], { type: 'application/zip' })
}

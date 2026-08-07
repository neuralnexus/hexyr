export type BinaryFormat = 'png' | 'jpeg' | 'gif' | 'zip' | 'elf' | 'pe' | 'pdf' | 'unknown';

export type BinaryRegionKind =
  | 'signature'
  | 'header'
  | 'metadata'
  | 'payload'
  | 'index'
  | 'trailer';

export interface BinaryRegion {
  id: string;
  offset: number;
  length: number;
  label: string;
  detail: string;
  kind: BinaryRegionKind;
}

export interface BinaryStructure {
  format: BinaryFormat;
  label: string;
  summary: string;
  metadata: Record<string, string | number>;
  regions: BinaryRegion[];
  warnings: string[];
  truncated: boolean;
}

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const MAX_REGIONS = 512;

function matches(bytes: Uint8Array, signature: number[], offset = 0): boolean {
  return signature.every((value, index) => bytes[offset + index] === value);
}

function ascii(bytes: Uint8Array, offset: number, length: number): string {
  return Array.from(bytes.slice(offset, offset + length), (value) =>
    value >= 0x20 && value <= 0x7e ? String.fromCharCode(value) : '.',
  ).join('');
}

function uint16(bytes: Uint8Array, offset: number, littleEndian: boolean): number | null {
  if (offset < 0 || offset + 2 > bytes.length) return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset + offset, 2);
  return view.getUint16(0, littleEndian);
}

function uint32(bytes: Uint8Array, offset: number, littleEndian: boolean): number | null {
  if (offset < 0 || offset + 4 > bytes.length) return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset + offset, 4);
  return view.getUint32(0, littleEndian);
}

function safeInteger(
  bytes: Uint8Array,
  offset: number,
  byteLength: 4 | 8,
  littleEndian: boolean,
): number | null {
  if (byteLength === 4) return uint32(bytes, offset, littleEndian);
  if (offset < 0 || offset + 8 > bytes.length) return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset + offset, 8);
  const value = view.getBigUint64(0, littleEndian);
  return value <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(value) : null;
}

function boundedLength(bytes: Uint8Array, offset: number, requested: number): number {
  if (!Number.isFinite(requested) || requested <= 0 || offset >= bytes.length) return 0;
  return Math.min(requested, bytes.length - offset);
}

function addRegion(
  regions: BinaryRegion[],
  region: Omit<BinaryRegion, 'id'>,
  maxRegions = MAX_REGIONS,
): boolean {
  if (regions.length >= maxRegions || region.length <= 0) return false;
  regions.push({
    ...region,
    id: `${region.kind}-${region.offset}-${regions.length}`,
    length: Math.max(0, region.length),
  });
  return true;
}

function unknownStructure(bytes: Uint8Array): BinaryStructure {
  return {
    format: 'unknown',
    label: 'Unknown binary',
    summary:
      bytes.length === 0 ? 'No bytes to inspect.' : 'No supported container signature found.',
    metadata: { bytes: bytes.length },
    regions: [],
    warnings: [],
    truncated: false,
  };
}

function inspectPng(bytes: Uint8Array): BinaryStructure {
  const regions: BinaryRegion[] = [];
  const warnings: string[] = [];
  const metadata: Record<string, string | number> = {};
  addRegion(regions, {
    offset: 0,
    length: 8,
    label: 'PNG signature',
    detail: '8-byte PNG file signature',
    kind: 'signature',
  });

  let offset = 8;
  let chunkCount = 0;
  let reachedEnd = false;
  while (offset + 12 <= bytes.length && regions.length < MAX_REGIONS) {
    const dataLength = uint32(bytes, offset, false);
    if (dataLength === null) break;
    const type = ascii(bytes, offset + 4, 4);
    const totalLength = dataLength + 12;
    if (!/^[A-Za-z]{4}$/.test(type)) {
      warnings.push(`Invalid PNG chunk type at 0x${offset.toString(16)}.`);
      break;
    }
    if (totalLength > bytes.length - offset) {
      warnings.push(`${type} declares ${dataLength} data bytes beyond the end of the file.`);
      addRegion(regions, {
        offset,
        length: bytes.length - offset,
        label: `${type} chunk (truncated)`,
        detail: `Declared ${dataLength} data bytes`,
        kind: 'payload',
      });
      break;
    }

    let detail = `${dataLength.toLocaleString()} data bytes + length/type/CRC`;
    if (type === 'IHDR' && dataLength >= 13) {
      const width = uint32(bytes, offset + 8, false);
      const height = uint32(bytes, offset + 12, false);
      const bitDepth = bytes[offset + 16];
      const colorType = bytes[offset + 17];
      if (width !== null && height !== null) {
        metadata.width = width;
        metadata.height = height;
        metadata.bitDepth = bitDepth;
        metadata.colorType = colorType;
        detail = `${width} × ${height}, ${bitDepth}-bit, color type ${colorType}`;
      }
    }

    addRegion(regions, {
      offset,
      length: totalLength,
      label: `${type} chunk`,
      detail,
      kind: type === 'IHDR' ? 'header' : type === 'IEND' ? 'trailer' : 'payload',
    });
    chunkCount += 1;
    offset += totalLength;
    if (type === 'IEND') {
      reachedEnd = true;
      if (offset < bytes.length) {
        warnings.push(`${(bytes.length - offset).toLocaleString()} trailing bytes follow IEND.`);
      }
      break;
    }
  }

  if (!reachedEnd && offset < bytes.length && !regions.some((region) => region.offset === offset)) {
    warnings.push(`PNG chunk at 0x${offset.toString(16)} is truncated beyond the end of the file.`);
    addRegion(regions, {
      offset,
      length: bytes.length - offset,
      label: 'Truncated PNG data',
      detail: `${bytes.length - offset} remaining bytes`,
      kind: 'payload',
    });
  }
  if (!reachedEnd) warnings.push('PNG does not contain a complete IEND chunk.');
  metadata.chunks = chunkCount;
  return {
    format: 'png',
    label: 'PNG image',
    summary:
      typeof metadata.width === 'number'
        ? `${metadata.width} × ${metadata.height} image with ${chunkCount} parsed chunks.`
        : `${chunkCount} PNG chunks parsed.`,
    metadata,
    regions,
    warnings,
    truncated: regions.length >= MAX_REGIONS,
  };
}

function inspectJpeg(bytes: Uint8Array): BinaryStructure {
  const regions: BinaryRegion[] = [];
  const warnings: string[] = [];
  const metadata: Record<string, string | number> = {};
  addRegion(regions, {
    offset: 0,
    length: 2,
    label: 'SOI marker',
    detail: 'Start of image',
    kind: 'signature',
  });

  let offset = 2;
  let markerCount = 1;
  let foundEnd = false;
  while (offset + 1 < bytes.length && regions.length < MAX_REGIONS) {
    if (bytes[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const markerOffset = offset;
    while (offset < bytes.length && bytes[offset] === 0xff) offset += 1;
    if (offset >= bytes.length) break;
    const marker = bytes[offset];
    offset += 1;

    if (marker === 0x00) continue;
    if (marker === 0xd9) {
      addRegion(regions, {
        offset: markerOffset,
        length: offset - markerOffset,
        label: 'EOI marker',
        detail: 'End of image',
        kind: 'trailer',
      });
      markerCount += 1;
      foundEnd = true;
      if (offset < bytes.length) {
        warnings.push(`${(bytes.length - offset).toLocaleString()} trailing bytes follow EOI.`);
      }
      break;
    }
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      addRegion(regions, {
        offset: markerOffset,
        length: offset - markerOffset,
        label: `Marker FF${marker.toString(16).padStart(2, '0').toUpperCase()}`,
        detail: 'Standalone JPEG marker',
        kind: 'metadata',
      });
      markerCount += 1;
      continue;
    }

    const declaredLength = uint16(bytes, offset, false);
    if (declaredLength === null || declaredLength < 2) {
      warnings.push(`Invalid JPEG segment length at 0x${markerOffset.toString(16)}.`);
      break;
    }
    const totalLength = offset - markerOffset + declaredLength;
    if (markerOffset + totalLength > bytes.length) {
      warnings.push(`JPEG segment at 0x${markerOffset.toString(16)} extends past the file.`);
      addRegion(regions, {
        offset: markerOffset,
        length: bytes.length - markerOffset,
        label: 'Truncated JPEG segment',
        detail: `Marker FF${marker.toString(16).padStart(2, '0')}`,
        kind: 'payload',
      });
      break;
    }

    const isStartOfFrame =
      (marker >= 0xc0 && marker <= 0xc3) ||
      (marker >= 0xc5 && marker <= 0xc7) ||
      (marker >= 0xc9 && marker <= 0xcb) ||
      (marker >= 0xcd && marker <= 0xcf);
    let detail = `${declaredLength - 2} data bytes`;
    if (isStartOfFrame && declaredLength >= 8) {
      const height = uint16(bytes, offset + 3, false);
      const width = uint16(bytes, offset + 5, false);
      if (width !== null && height !== null) {
        metadata.width = width;
        metadata.height = height;
        metadata.precision = bytes[offset + 2];
        metadata.components = bytes[offset + 7];
        detail = `${width} × ${height}, ${bytes[offset + 2]}-bit, ${bytes[offset + 7]} components`;
      }
    }

    const markerName =
      marker === 0xda
        ? 'SOS scan header'
        : marker === 0xe0
          ? 'APP0 segment'
          : marker === 0xe1
            ? 'APP1 segment'
            : isStartOfFrame
              ? 'SOF frame header'
              : `Marker FF${marker.toString(16).padStart(2, '0').toUpperCase()}`;
    addRegion(regions, {
      offset: markerOffset,
      length: totalLength,
      label: markerName,
      detail,
      kind: isStartOfFrame ? 'header' : 'metadata',
    });
    markerCount += 1;
    offset = markerOffset + totalLength;

    if (marker === 0xda) {
      let scanEnd = bytes.length;
      for (let cursor = offset; cursor + 1 < bytes.length; cursor += 1) {
        if (bytes[cursor] === 0xff && bytes[cursor + 1] === 0xd9) {
          scanEnd = cursor;
          break;
        }
      }
      addRegion(regions, {
        offset,
        length: scanEnd - offset,
        label: 'Compressed scan data',
        detail: `${(scanEnd - offset).toLocaleString()} entropy-coded bytes`,
        kind: 'payload',
      });
      offset = scanEnd;
    }
  }

  if (!foundEnd) warnings.push('JPEG end-of-image marker was not found.');
  metadata.markers = markerCount;
  return {
    format: 'jpeg',
    label: 'JPEG image',
    summary:
      typeof metadata.width === 'number'
        ? `${metadata.width} × ${metadata.height} image with ${markerCount} parsed markers.`
        : `${markerCount} JPEG markers parsed.`,
    metadata,
    regions,
    warnings,
    truncated: regions.length >= MAX_REGIONS,
  };
}

function readGifSubBlocks(bytes: Uint8Array, offset: number): number {
  let cursor = offset;
  while (cursor < bytes.length) {
    const length = bytes[cursor];
    cursor += 1;
    if (length === 0) return cursor;
    cursor += length;
    if (cursor > bytes.length) return bytes.length;
  }
  return bytes.length;
}

function inspectGif(bytes: Uint8Array): BinaryStructure {
  const regions: BinaryRegion[] = [];
  const warnings: string[] = [];
  const metadata: Record<string, string | number> = {
    version: ascii(bytes, 3, 3),
  };
  addRegion(regions, {
    offset: 0,
    length: 6,
    label: `GIF${metadata.version} signature`,
    detail: 'GIF header and version',
    kind: 'signature',
  });

  if (bytes.length < 13) {
    warnings.push('GIF logical screen descriptor is truncated.');
    return {
      format: 'gif',
      label: 'GIF image',
      summary: 'Truncated GIF header.',
      metadata,
      regions,
      warnings,
      truncated: false,
    };
  }

  const width = uint16(bytes, 6, true) ?? 0;
  const height = uint16(bytes, 8, true) ?? 0;
  metadata.width = width;
  metadata.height = height;
  addRegion(regions, {
    offset: 6,
    length: 7,
    label: 'Logical screen descriptor',
    detail: `${width} × ${height} canvas`,
    kind: 'header',
  });

  let offset = 13;
  const packed = bytes[10];
  if ((packed & 0x80) !== 0) {
    const colorTableLength = 3 * 2 ** ((packed & 0x07) + 1);
    addRegion(regions, {
      offset,
      length: boundedLength(bytes, offset, colorTableLength),
      label: 'Global color table',
      detail: `${colorTableLength / 3} colors`,
      kind: 'metadata',
    });
    offset += colorTableLength;
  }

  let frames = 0;
  let extensions = 0;
  let foundTrailer = false;
  while (offset < bytes.length && regions.length < MAX_REGIONS) {
    const blockOffset = offset;
    const introducer = bytes[offset];
    if (introducer === 0x3b) {
      addRegion(regions, {
        offset,
        length: 1,
        label: 'GIF trailer',
        detail: 'End of GIF data stream',
        kind: 'trailer',
      });
      foundTrailer = true;
      offset += 1;
      break;
    }
    if (introducer === 0x21 && offset + 2 < bytes.length) {
      const label = bytes[offset + 1];
      offset += 2;
      if (label === 0xf9 && offset < bytes.length) {
        const size = bytes[offset];
        offset = Math.min(bytes.length, offset + size + 2);
      } else {
        offset = readGifSubBlocks(bytes, offset);
      }
      addRegion(regions, {
        offset: blockOffset,
        length: offset - blockOffset,
        label: `Extension 0x${label.toString(16).padStart(2, '0')}`,
        detail: `${offset - blockOffset} bytes`,
        kind: 'metadata',
      });
      extensions += 1;
      continue;
    }
    if (introducer === 0x2c && offset + 10 <= bytes.length) {
      const imagePacked = bytes[offset + 9];
      offset += 10;
      if ((imagePacked & 0x80) !== 0) {
        offset += 3 * 2 ** ((imagePacked & 0x07) + 1);
      }
      if (offset < bytes.length) offset += 1;
      offset = readGifSubBlocks(bytes, offset);
      addRegion(regions, {
        offset: blockOffset,
        length: offset - blockOffset,
        label: `Image frame ${frames + 1}`,
        detail: `${offset - blockOffset} bytes including image data`,
        kind: 'payload',
      });
      frames += 1;
      continue;
    }
    warnings.push(`Unknown GIF block 0x${introducer.toString(16)} at 0x${offset.toString(16)}.`);
    break;
  }

  if (!foundTrailer) warnings.push('GIF trailer was not found.');
  if (offset < bytes.length && foundTrailer) {
    warnings.push(`${bytes.length - offset} trailing bytes follow the GIF trailer.`);
  }
  metadata.frames = frames;
  metadata.extensions = extensions;
  return {
    format: 'gif',
    label: 'GIF image',
    summary: `${width} × ${height} GIF with ${frames} frame${frames === 1 ? '' : 's'}.`,
    metadata,
    regions,
    warnings,
    truncated: regions.length >= MAX_REGIONS,
  };
}

function zipSignatureAt(bytes: Uint8Array, offset: number): number | null {
  const signature = uint32(bytes, offset, true);
  return signature === 0x04034b50 ||
    signature === 0x02014b50 ||
    signature === 0x06054b50 ||
    signature === 0x08074b50
    ? signature
    : null;
}

function findNextZipSignature(bytes: Uint8Array, start: number): number {
  for (let offset = start; offset + 4 <= bytes.length; offset += 1) {
    if (zipSignatureAt(bytes, offset) !== null) return offset;
  }
  return bytes.length;
}

function inspectZip(bytes: Uint8Array): BinaryStructure {
  const regions: BinaryRegion[] = [];
  const warnings: string[] = [];
  const metadata: Record<string, string | number> = {};
  let offset = 0;
  let localEntries = 0;
  let centralEntries = 0;

  while (offset + 4 <= bytes.length && regions.length < MAX_REGIONS) {
    const signature = zipSignatureAt(bytes, offset);
    if (signature === null) {
      const next = findNextZipSignature(bytes, offset + 1);
      if (next === bytes.length) break;
      warnings.push(`${next - offset} unparsed bytes before ZIP record at 0x${next.toString(16)}.`);
      offset = next;
      continue;
    }

    let nextOffset = bytes.length;
    let label = 'ZIP record';
    let detail = '';
    let kind: BinaryRegionKind = 'metadata';
    if (signature === 0x04034b50) {
      const nameLength = uint16(bytes, offset + 26, true) ?? 0;
      const extraLength = uint16(bytes, offset + 28, true) ?? 0;
      const compressedSize = uint32(bytes, offset + 18, true) ?? 0;
      const flags = uint16(bytes, offset + 6, true) ?? 0;
      const name = ascii(bytes, offset + 30, Math.min(nameLength, 200));
      const dataStart = offset + 30 + nameLength + extraLength;
      nextOffset =
        (flags & 0x08) === 0 && dataStart + compressedSize <= bytes.length
          ? dataStart + compressedSize
          : findNextZipSignature(bytes, Math.min(bytes.length, dataStart));
      label = name ? `File: ${name}` : `Local file ${localEntries + 1}`;
      detail = `${compressedSize.toLocaleString()} compressed bytes`;
      kind = 'payload';
      localEntries += 1;
    } else if (signature === 0x02014b50) {
      const nameLength = uint16(bytes, offset + 28, true) ?? 0;
      const extraLength = uint16(bytes, offset + 30, true) ?? 0;
      const commentLength = uint16(bytes, offset + 32, true) ?? 0;
      const name = ascii(bytes, offset + 46, Math.min(nameLength, 200));
      nextOffset = Math.min(bytes.length, offset + 46 + nameLength + extraLength + commentLength);
      label = name ? `Central entry: ${name}` : `Central entry ${centralEntries + 1}`;
      detail = 'Central directory metadata';
      kind = 'index';
      centralEntries += 1;
    } else if (signature === 0x06054b50) {
      const commentLength = uint16(bytes, offset + 20, true) ?? 0;
      nextOffset = Math.min(bytes.length, offset + 22 + commentLength);
      label = 'End of central directory';
      detail = `${uint16(bytes, offset + 10, true) ?? centralEntries} entries`;
      kind = 'trailer';
    } else {
      nextOffset = Math.min(bytes.length, offset + 16);
      label = 'Data descriptor';
      detail = 'CRC and compressed/uncompressed sizes';
    }

    if (nextOffset <= offset) nextOffset = findNextZipSignature(bytes, offset + 4);
    addRegion(regions, {
      offset,
      length: Math.max(4, nextOffset - offset),
      label,
      detail,
      kind: regions.length === 0 ? 'signature' : kind,
    });
    offset = nextOffset;
  }

  metadata.files = localEntries;
  metadata.centralEntries = centralEntries;
  if (localEntries === 0) warnings.push('No local ZIP file headers were parsed.');
  return {
    format: 'zip',
    label: 'ZIP archive',
    summary: `${localEntries} local file entr${localEntries === 1 ? 'y' : 'ies'} and ${centralEntries} central directory entr${centralEntries === 1 ? 'y' : 'ies'}.`,
    metadata,
    regions,
    warnings,
    truncated: regions.length >= MAX_REGIONS,
  };
}

function inspectElf(bytes: Uint8Array): BinaryStructure {
  const regions: BinaryRegion[] = [];
  const warnings: string[] = [];
  const is64Bit = bytes[4] === 2;
  const littleEndian = bytes[5] !== 2;
  const headerLength = is64Bit ? 64 : 52;
  const metadata: Record<string, string | number> = {
    class: is64Bit ? 'ELF64' : 'ELF32',
    byteOrder: littleEndian ? 'little-endian' : 'big-endian',
    abi: bytes[7] ?? 0,
  };

  addRegion(regions, {
    offset: 0,
    length: boundedLength(bytes, 0, 16),
    label: 'ELF identification',
    detail: `${metadata.class}, ${metadata.byteOrder}`,
    kind: 'signature',
  });
  addRegion(regions, {
    offset: 16,
    length: boundedLength(bytes, 16, headerLength - 16),
    label: 'ELF header',
    detail: `Machine 0x${(uint16(bytes, 18, littleEndian) ?? 0).toString(16)}`,
    kind: 'header',
  });

  if (bytes.length < headerLength) warnings.push('ELF header is truncated.');
  const wordLength = is64Bit ? 8 : 4;
  const programOffset = safeInteger(bytes, is64Bit ? 32 : 28, wordLength, littleEndian);
  const sectionOffset = safeInteger(bytes, is64Bit ? 40 : 32, wordLength, littleEndian);
  const programEntrySize = uint16(bytes, is64Bit ? 54 : 42, littleEndian) ?? 0;
  const programCount = uint16(bytes, is64Bit ? 56 : 44, littleEndian) ?? 0;
  const sectionEntrySize = uint16(bytes, is64Bit ? 58 : 46, littleEndian) ?? 0;
  const sectionCount = uint16(bytes, is64Bit ? 60 : 48, littleEndian) ?? 0;

  metadata.programHeaders = programCount;
  metadata.sectionHeaders = sectionCount;
  if (programOffset !== null && programEntrySize > 0 && programCount > 0) {
    const declared = programEntrySize * programCount;
    addRegion(regions, {
      offset: programOffset,
      length: boundedLength(bytes, programOffset, declared),
      label: 'Program header table',
      detail: `${programCount} × ${programEntrySize}-byte entries`,
      kind: 'index',
    });
    if (programOffset + declared > bytes.length)
      warnings.push('Program header table is truncated.');
  }
  if (sectionOffset !== null && sectionEntrySize > 0 && sectionCount > 0) {
    const declared = sectionEntrySize * sectionCount;
    addRegion(regions, {
      offset: sectionOffset,
      length: boundedLength(bytes, sectionOffset, declared),
      label: 'Section header table',
      detail: `${sectionCount} × ${sectionEntrySize}-byte entries`,
      kind: 'index',
    });
    if (sectionOffset + declared > bytes.length)
      warnings.push('Section header table is truncated.');
  }

  return {
    format: 'elf',
    label: 'ELF executable',
    summary: `${metadata.class} ${metadata.byteOrder} binary with ${programCount} program and ${sectionCount} section headers.`,
    metadata,
    regions,
    warnings,
    truncated: false,
  };
}

function inspectPe(bytes: Uint8Array): BinaryStructure {
  const regions: BinaryRegion[] = [];
  const warnings: string[] = [];
  const metadata: Record<string, string | number> = {};
  const peOffset = uint32(bytes, 0x3c, true);

  addRegion(regions, {
    offset: 0,
    length: boundedLength(bytes, 0, 64),
    label: 'DOS header',
    detail: 'MZ executable header',
    kind: 'signature',
  });
  if (
    peOffset === null ||
    peOffset + 24 > bytes.length ||
    !matches(bytes, [0x50, 0x45, 0, 0], peOffset)
  ) {
    warnings.push('PE signature referenced by the DOS header is missing or truncated.');
    return {
      format: 'pe',
      label: 'Windows executable',
      summary: 'MZ header found, but the PE header could not be parsed.',
      metadata,
      regions,
      warnings,
      truncated: false,
    };
  }

  if (peOffset > 64) {
    addRegion(regions, {
      offset: 64,
      length: peOffset - 64,
      label: 'DOS stub',
      detail: `${peOffset - 64} bytes before the PE signature`,
      kind: 'payload',
    });
  }
  const sectionCount = uint16(bytes, peOffset + 6, true) ?? 0;
  const optionalHeaderLength = uint16(bytes, peOffset + 20, true) ?? 0;
  const machine = uint16(bytes, peOffset + 4, true) ?? 0;
  metadata.machine = `0x${machine.toString(16).padStart(4, '0')}`;
  metadata.sections = sectionCount;
  addRegion(regions, {
    offset: peOffset,
    length: 24,
    label: 'PE + COFF header',
    detail: `${sectionCount} sections, machine ${metadata.machine}`,
    kind: 'header',
  });

  const optionalOffset = peOffset + 24;
  addRegion(regions, {
    offset: optionalOffset,
    length: boundedLength(bytes, optionalOffset, optionalHeaderLength),
    label: 'Optional header',
    detail: `${optionalHeaderLength} bytes`,
    kind: 'metadata',
  });

  const tableOffset = optionalOffset + optionalHeaderLength;
  const tableLength = sectionCount * 40;
  addRegion(regions, {
    offset: tableOffset,
    length: boundedLength(bytes, tableOffset, tableLength),
    label: 'Section table',
    detail: `${sectionCount} × 40-byte entries`,
    kind: 'index',
  });
  if (tableOffset + tableLength > bytes.length) warnings.push('PE section table is truncated.');

  for (let index = 0; index < sectionCount && regions.length < MAX_REGIONS; index += 1) {
    const entryOffset = tableOffset + index * 40;
    if (entryOffset + 40 > bytes.length) break;
    const name = ascii(bytes, entryOffset, 8).replace(/\.+$/, '') || `section-${index + 1}`;
    const rawSize = uint32(bytes, entryOffset + 16, true) ?? 0;
    const rawOffset = uint32(bytes, entryOffset + 20, true) ?? 0;
    if (rawSize > 0 && rawOffset < bytes.length) {
      addRegion(regions, {
        offset: rawOffset,
        length: boundedLength(bytes, rawOffset, rawSize),
        label: `Section ${name}`,
        detail: `${rawSize.toLocaleString()} raw bytes`,
        kind: 'payload',
      });
      if (rawOffset + rawSize > bytes.length) warnings.push(`Section ${name} is truncated.`);
    }
  }

  return {
    format: 'pe',
    label: 'Windows PE executable',
    summary: `PE machine ${metadata.machine} with ${sectionCount} section${sectionCount === 1 ? '' : 's'}.`,
    metadata,
    regions,
    warnings,
    truncated: regions.length >= MAX_REGIONS,
  };
}

function findAscii(bytes: Uint8Array, needle: string, from = 0): number {
  const values = Array.from(needle, (character) => character.charCodeAt(0));
  outer: for (let offset = Math.max(0, from); offset <= bytes.length - values.length; offset += 1) {
    for (let index = 0; index < values.length; index += 1) {
      if (bytes[offset + index] !== values[index]) continue outer;
    }
    return offset;
  }
  return -1;
}

function inspectPdf(bytes: Uint8Array): BinaryStructure {
  const regions: BinaryRegion[] = [];
  const warnings: string[] = [];
  const versionEnd = Math.max(5, findAscii(bytes, '\n', 0));
  const startXref = findAscii(bytes, 'startxref', Math.max(0, bytes.length - 131_072));
  const eof = findAscii(bytes, '%%EOF', Math.max(0, bytes.length - 131_072));
  const version = ascii(bytes, 5, Math.max(0, Math.min(8, versionEnd - 5))).trim();
  const metadata: Record<string, string | number> = { version: version || 'unknown' };

  addRegion(regions, {
    offset: 0,
    length: boundedLength(bytes, 0, versionEnd + 1),
    label: `PDF ${metadata.version} header`,
    detail: 'PDF version declaration',
    kind: 'signature',
  });
  const bodyEnd = startXref >= 0 ? startXref : eof >= 0 ? eof : bytes.length;
  addRegion(regions, {
    offset: versionEnd + 1,
    length: Math.max(0, bodyEnd - versionEnd - 1),
    label: 'PDF objects and streams',
    detail: `${Math.max(0, bodyEnd - versionEnd - 1).toLocaleString()} bytes`,
    kind: 'payload',
  });
  if (startXref >= 0) {
    addRegion(regions, {
      offset: startXref,
      length: (eof >= startXref ? eof + 5 : bytes.length) - startXref,
      label: 'Cross-reference trailer',
      detail: 'startxref pointer and end-of-file marker',
      kind: 'trailer',
    });
  } else if (eof >= 0) {
    addRegion(regions, {
      offset: eof,
      length: 5,
      label: 'End-of-file marker',
      detail: '%%EOF',
      kind: 'trailer',
    });
    warnings.push('startxref was not found near the end of the PDF.');
  } else {
    warnings.push('PDF end-of-file marker was not found.');
  }

  return {
    format: 'pdf',
    label: 'PDF document',
    summary: `PDF ${metadata.version} with ${bytes.length.toLocaleString()} bytes.`,
    metadata,
    regions,
    warnings,
    truncated: false,
  };
}

export function inspectBinaryStructure(bytes: Uint8Array): BinaryStructure {
  if (matches(bytes, PNG_SIGNATURE)) return inspectPng(bytes);
  if (matches(bytes, [0xff, 0xd8, 0xff])) return inspectJpeg(bytes);
  if (ascii(bytes, 0, 4) === 'GIF8') return inspectGif(bytes);
  if (matches(bytes, [0x50, 0x4b, 0x03, 0x04])) return inspectZip(bytes);
  if (matches(bytes, [0x7f, 0x45, 0x4c, 0x46])) return inspectElf(bytes);
  if (matches(bytes, [0x4d, 0x5a])) return inspectPe(bytes);
  if (ascii(bytes, 0, 5) === '%PDF-') return inspectPdf(bytes);
  return unknownStructure(bytes);
}

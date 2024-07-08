interface BlockOffset {
  start: number;
  end: number;
}

// bytes
const HEADER_DATA_SIZE = {
  HEADER_LENGTH: 8,
  NUMBER_OF_BLOCKS: 2,
  BLOCK_HASH_LENGTH: 2,
  BLOCK_NUMBER_LENGTH: 8,
  BLOCK_START_POSITION_LENGTH: 8,
  BLOCK_END_POSITION_LENGTH: 8,
};

export const HEADER_START_LENGTH = HEADER_DATA_SIZE.HEADER_LENGTH + HEADER_DATA_SIZE.NUMBER_OF_BLOCKS + HEADER_DATA_SIZE.BLOCK_HASH_LENGTH;

export const readFileHeader = (buffer: Buffer): Map<string, BlockOffset> => {
  // Read the header length (first 8 bytes), number of blocks (next 2 bytes) and block hash length (next 2 bytes)
  const headerBuffer = buffer.subarray(0, HEADER_START_LENGTH);

  const numberOfBlocks = headerBuffer.readUInt16LE(8);
  const blockHashLength = headerBuffer.readUInt16LE(10);

  // Read the block positions length
  const blockPositionLength =
    HEADER_DATA_SIZE.BLOCK_NUMBER_LENGTH +
    blockHashLength +
    HEADER_DATA_SIZE.BLOCK_START_POSITION_LENGTH +
    HEADER_DATA_SIZE.BLOCK_END_POSITION_LENGTH;

  // Read the block positions buffer
  const blockPositionsBuffer = buffer.subarray(HEADER_START_LENGTH, HEADER_START_LENGTH + numberOfBlocks * blockPositionLength);

  const blockPositions = new Map<string, any>();

  // Read each block position
  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < numberOfBlocks; i++) {
    const blockOffset = i * blockPositionLength;

    // Read the block number, hash, start and end positions
    const blockNumber = Number(blockPositionsBuffer.readBigUInt64LE(blockOffset));
    const blockHash = blockPositionsBuffer
      .subarray(
        blockOffset + HEADER_DATA_SIZE.BLOCK_NUMBER_LENGTH,
        blockOffset + HEADER_DATA_SIZE.BLOCK_NUMBER_LENGTH + blockHashLength,
      )
      .toString();
    const blockStartOffset = Number(
      blockPositionsBuffer.readBigUInt64LE(
        blockOffset + HEADER_DATA_SIZE.BLOCK_NUMBER_LENGTH + blockHashLength,
      ),
    );
    const blockEndOffset = Number(
      blockPositionsBuffer.readBigUInt64LE(
        blockOffset +
        HEADER_DATA_SIZE.BLOCK_NUMBER_LENGTH +
        blockHashLength +
        HEADER_DATA_SIZE.BLOCK_START_POSITION_LENGTH,
      ),
    );

    // Store the block position in the map
    blockPositions.set(`${blockNumber}-${blockHash}`, { start: blockStartOffset, end: blockEndOffset });
  }

  return blockPositions;
};

export const getFileHeaderLength = (buffer: Buffer): number => {
  const headerBuffer = buffer.subarray(0, HEADER_START_LENGTH);

  const numberOfBlocks = headerBuffer.readUInt16LE(8);
  const blockHashLength = headerBuffer.readUInt16LE(10);

  // Read the block positions length
  const blockPositionLength =
    HEADER_DATA_SIZE.BLOCK_NUMBER_LENGTH +
    blockHashLength +
    HEADER_DATA_SIZE.BLOCK_START_POSITION_LENGTH +
    HEADER_DATA_SIZE.BLOCK_END_POSITION_LENGTH;

  return HEADER_START_LENGTH + numberOfBlocks * blockPositionLength;
};

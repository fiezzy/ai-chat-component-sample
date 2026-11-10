import { type Block } from '../types'

export const getBlocksLength = (blocks: Block[]) =>
  blocks.reduce(
    (total, block) => total + (block.kind === 'text' ? block.text.length : 1),
    0,
  )

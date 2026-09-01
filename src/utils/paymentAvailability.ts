export const getPayableAmount = (cost: number | null | undefined): number | null =>
  typeof cost === 'number' && Number.isFinite(cost) && cost > 0 ? cost : null;

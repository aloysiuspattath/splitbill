/**
 * Deterministic rounding using the Largest Remainder Method (Hare-Niemeyer method).
 * Guarantees that the sum of allocated integer units (paise) EXACTLY equals the target total.
 *
 * @param totalPaise The total amount in paise to distribute
 * @param weights Relative weights or fractional expectations for each recipient (must sum to > 0)
 * @param keys Unique identifiers for each recipient to break ties deterministically
 * @returns Array of integer paise allocated to each recipient
 */
export function distributeIntegerPaise(
  totalPaise: number,
  weights: number[],
  keys: string[]
): number[] {
  if (weights.length === 0) return [];
  if (weights.length === 1) return [totalPaise];
  if (totalPaise === 0) return new Array(weights.length).fill(0);

  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  if (totalWeight <= 0) {
    // If all weights are 0, distribute equally
    const equalWeight = 1 / weights.length;
    return distributeIntegerPaise(totalPaise, new Array(weights.length).fill(equalWeight), keys);
  }

  // Step 1: Calculate raw exact shares and integer floors
  const rawShares = weights.map(w => (w / totalWeight) * totalPaise);
  const floorShares = rawShares.map(s => Math.floor(s));
  const remainders = rawShares.map((s, idx) => ({
    index: idx,
    key: keys[idx],
    remainder: s - floorShares[idx],
  }));

  // Step 2: Calculate difference between sum of floors and total target
  const sumFloors = floorShares.reduce((sum, s) => sum + s, 0);
  let leftoverPaise = totalPaise - sumFloors;

  // Step 3: Sort remainders descending. Break ties deterministically by key.
  remainders.sort((a, b) => {
    if (Math.abs(b.remainder - a.remainder) > 1e-9) {
      return b.remainder - a.remainder;
    }
    return a.key.localeCompare(b.key);
  });

  // Step 4: Distribute leftover 1 paisa units to highest remainders
  const finalShares = [...floorShares];
  for (let i = 0; i < leftoverPaise; i++) {
    const recipientIndex = remainders[i % remainders.length].index;
    finalShares[recipientIndex] += 1;
  }

  return finalShares;
}

export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * @function range
 * @description Count from 0 -> N, just like python!
 * @param count
 * @returns
 */
export function range(count: number): Array<number> {
  return Array.from(Array(count).keys())
}
/**
 * Math Utilities module (Demo task for J.A.R.V.I.S. Agent)
 */

export function factorial(n) {
  if (n < 0) throw new Error("Negative numbers not supported");
  if (n === 0) return 1;

  let result = 1;
  for (let i = 1; i <= n; i++) {
    result *= i;
  }
  return result;
}

export function calculateAverage(numbers) {
  if (!Array.isArray(numbers) || numbers.length === 0) return 0;

  const sum = numbers.reduce((acc, val) => acc + val, 0);
  return sum / numbers.length;
}

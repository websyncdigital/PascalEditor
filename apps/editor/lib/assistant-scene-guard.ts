export function canApplyRemoteScene(
  currentSignature: string,
  savedSignature: string,
  savesInFlight: number,
): boolean {
  return savesInFlight === 0 && currentSignature === savedSignature
}

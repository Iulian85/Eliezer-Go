// Local storage, a wallet address, and client-side biometrics are not server authorization.
export async function initAdminSession(): Promise<string> { return ''; }
export function isBiometricSupported() { return false; }
export async function verifyBiometricFingerprint() { return false; }
export function isWalletAdminAuthorized(_wallet?: string) { return false; }
export function setAuthorizedAdminWallet(_wallet: string) { return false; }
export function getIsAdminModeVisible(_wallet?: string) { return false; }
export function revokeAdminMode() {
  for (const key of ['elzr_admin_authorized', 'elzr_admin_wallet_address', 'elzr_admin_unlocked', 'elzr_admin_biometric_id', 'elzr_biometric_hash']) localStorage.removeItem(key);
}

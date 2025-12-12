/**
 * Biometric Authentication Utility
 * Provides biometric authentication for saved payment methods
 */

/**
 * Check if biometric authentication is available
 */
export function isBiometricAvailable(): boolean {
  // Check for Web Authentication API
  if (window.PublicKeyCredential) {
    return true;
  }

  // Check for older Touch ID/Face ID APIs (iOS)
  if ('credentials' in navigator) {
    return true;
  }

  return false;
}

/**
 * Request biometric authentication
 */
export async function requestBiometricAuth(
  challenge: string = 'payment-authentication'
): Promise<boolean> {
  try {
    // Check if available
    if (!isBiometricAvailable()) {
      console.warn('Biometric authentication not available');
      return false;
    }

    // Use Web Authentication API
    if (window.PublicKeyCredential) {
      const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
        challenge: new TextEncoder().encode(challenge),
        timeout: 60000,
        userVerification: 'required',
        allowCredentials: [],
      };

      try {
        const credential = await navigator.credentials.get({
          publicKey: publicKeyCredentialRequestOptions,
        });

        return credential !== null;
      } catch (error) {
        console.error('Biometric authentication failed:', error);
        return false;
      }
    }

    return false;
  } catch (error) {
    console.error('Biometric authentication error:', error);
    return false;
  }
}

/**
 * Register biometric credential for future use
 */
export async function registerBiometricCredential(
  userId: string,
  userName: string
): Promise<boolean> {
  try {
    if (!window.PublicKeyCredential) {
      return false;
    }

    const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
      challenge: new TextEncoder().encode('registration-challenge'),
      rp: {
        name: 'Vagabond AI Navigator',
        id: window.location.hostname,
      },
      user: {
        id: new TextEncoder().encode(userId),
        name: userName,
        displayName: userName,
      },
      pubKeyCredParams: [
        {
          type: 'public-key',
          alg: -7, // ES256
        },
        {
          type: 'public-key',
          alg: -257, // RS256
        },
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
      },
      timeout: 60000,
      attestation: 'none',
    };

    const credential = await navigator.credentials.create({
      publicKey: publicKeyCredentialCreationOptions,
    });

    return credential !== null;
  } catch (error) {
    console.error('Biometric registration failed:', error);
    return false;
  }
}

/**
 * Check if device supports Touch ID (iOS)
 */
export function isTouchIDAvailable(): boolean {
  const userAgent = navigator.userAgent.toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(userAgent);
  
  return isIOS && isBiometricAvailable();
}

/**
 * Check if device supports Face ID (iOS)
 */
export function isFaceIDAvailable(): boolean {
  const userAgent = navigator.userAgent.toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(userAgent);
  
  // Face ID is available on iPhone X and later
  // This is a simplified check
  return isIOS && isBiometricAvailable();
}

/**
 * Check if device supports fingerprint (Android)
 */
export function isFingerprintAvailable(): boolean {
  const userAgent = navigator.userAgent.toLowerCase();
  const isAndroid = /android/.test(userAgent);
  
  return isAndroid && isBiometricAvailable();
}

/**
 * Get biometric type name for display
 */
export function getBiometricTypeName(): string {
  if (isTouchIDAvailable()) {
    return 'Touch ID';
  }
  if (isFaceIDAvailable()) {
    return 'Face ID';
  }
  if (isFingerprintAvailable()) {
    return 'Fingerprint';
  }
  return 'Biometric';
}

/**
 * Simple biometric prompt for saved cards
 */
export async function authenticateForSavedCard(): Promise<boolean> {
  if (!isBiometricAvailable()) {
    // Fallback to password or PIN
    return true; // For now, allow without biometric
  }

  try {
    const authenticated = await requestBiometricAuth('saved-card-payment');
    return authenticated;
  } catch (error) {
    console.error('Biometric authentication failed:', error);
    return false;
  }
}

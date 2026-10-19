/**
 * FinTrack Hardware Biometrics & WebAuthn Controller
 * Enables platform biometric authentication (Touch ID, Face ID, Windows Hello,
 * Android Fingerprint) using the W3C Web Authentication API.
 */

export function isWebAuthnAvailable() {
  if (typeof window === 'undefined') return false;
  return !!(
    window.PublicKeyCredential &&
    navigator.credentials &&
    navigator.credentials.create &&
    navigator.credentials.get
  );
}

/**
 * Registers a platform biometric credential for the user
 */
export async function registerBiometricCredential(userId = 'fintrack_user', userName = 'FinTrack User') {
  if (!isWebAuthnAvailable()) {
    throw new Error('Biometric hardware authentication is not supported on this browser/device.');
  }

  const challenge = new Uint8Array(32);
  window.crypto.getRandomValues(challenge);

  const encoder = new TextEncoder();
  const userIdBuffer = encoder.encode(String(userId));

  const createOptions = {
    publicKey: {
      challenge,
      rp: {
        name: 'FinTrack Secure Vault',
        id: window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname,
      },
      user: {
        id: userIdBuffer,
        name: userName,
        displayName: userName,
      },
      pubKeyCredParams: [
        { alg: -7, type: 'public-key' },   // ES256
        { alg: -257, type: 'public-key' }, // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
        requireResidentKey: false,
      },
      timeout: 60000,
      attestation: 'none',
    },
  };

  const credential = await navigator.credentials.create(createOptions);
  if (!credential) {
    throw new Error('Biometric enrollment cancelled.');
  }

  // Convert credential id to base64 string for local verification reference
  const rawId = Array.from(new Uint8Array(credential.rawId))
    .map(b => String.fromCharCode(b))
    .join('');
  const credIdBase64 = btoa(rawId);

  localStorage.setItem('fintrack_biometric_id', credIdBase64);
  localStorage.setItem('fintrack_biometric_enabled', 'true');

  return { success: true, credentialId: credIdBase64 };
}

/**
 * Verifies the user's platform biometric identity (Fingerprint / FaceID)
 */
export async function verifyBiometricCredential() {
  if (!isWebAuthnAvailable()) {
    throw new Error('Biometric authentication is not supported on this device.');
  }

  const savedId = localStorage.getItem('fintrack_biometric_id');
  const challenge = new Uint8Array(32);
  window.crypto.getRandomValues(challenge);

  const getOptions = {
    publicKey: {
      challenge,
      timeout: 60000,
      userVerification: 'required',
      rpId: window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname,
    },
  };

  if (savedId) {
    try {
      const rawIdStr = atob(savedId);
      const rawId = new Uint8Array(rawIdStr.length);
      for (let i = 0; i < rawIdStr.length; i++) {
        rawId[i] = rawIdStr.charCodeAt(i);
      }
      getOptions.publicKey.allowCredentials = [
        {
          id: rawId,
          type: 'public-key',
          transports: ['internal'],
        },
      ];
    } catch {
      // allow fallback to any registered platform credential
    }
  }

  const assertion = await navigator.credentials.get(getOptions);
  if (!assertion) {
    throw new Error('Biometric verification cancelled.');
  }

  return true;
}

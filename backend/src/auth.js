import { createRemoteJWKSet, jwtVerify } from 'jose';

// Firebase ID tokens are RS256 JWTs signed by Google's securetoken service.
const JWKS = createRemoteJWKSet(new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'));

/** Verify the caller's Firebase ID token. Returns { uid, email, emailVerified } or throws. */
export async function verifyFirebaseToken(request, projectId) {
  const header = request.headers.get('Authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw Object.assign(new Error('Missing token'), { status: 401, code: 'unauthenticated' });
  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
      algorithms: ['RS256'],
    });
    if (!payload.sub || typeof payload.sub !== 'string') throw new Error('No subject');
    if (payload.auth_time && payload.auth_time * 1000 > Date.now() + 60000) throw new Error('auth_time in future');
    return { uid: payload.sub, email: payload.email || null, emailVerified: payload.email_verified === true };
  } catch {
    throw Object.assign(new Error('Invalid or expired session. Please sign in again.'), { status: 401, code: 'unauthenticated' });
  }
}

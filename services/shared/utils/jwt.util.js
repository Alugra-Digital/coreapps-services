import { SignJWT, jwtVerify } from 'jose';

const accessSecret = new TextEncoder().encode(process.env.JWT_SECRET);
const refreshSecret = new TextEncoder().encode(process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);

const ACCESS_EXPIRY = process.env.JWT_EXPIRES_IN || '8h';
const REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

export const signToken = async (payload) => {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(ACCESS_EXPIRY)
    .sign(accessSecret);
};

export const verifyToken = async (token) => {
  try {
    const { payload } = await jwtVerify(token, accessSecret);
    return payload;
  } catch {
    return null;
  }
};

export const signRefreshToken = async (payload) => {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(REFRESH_EXPIRY)
    .sign(refreshSecret);
};

export const verifyRefreshToken = async (token) => {
  try {
    const { payload } = await jwtVerify(token, refreshSecret);
    return payload;
  } catch {
    return null;
  }
};

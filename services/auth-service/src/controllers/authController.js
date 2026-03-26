import { db } from '../../../shared/db/index.js';
import { users, refreshTokens } from '../../../shared/db/schema.js';
import { eq, and } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { signToken, signRefreshToken, verifyRefreshToken } from '../../../shared/utils/jwt.util.js';

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function refreshExpiresAt() {
  // Default 7 days; adjust if JWT_REFRESH_EXPIRES_IN changes from the default
  return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
}

export const register = async (req, res) => {
  try {
    const { username, password, role = 'SUPER_ADMIN' } = req.body;

    const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.username, username));
    if (existing) return res.status(409).json({ message: 'User already exists', code: 'CONFLICT' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const [newUser] = await db.insert(users).values({ username, password: hashedPassword, role }).returning();

    const accessToken = await signToken({ id: newUser.id, username: newUser.username, role: newUser.role });
    const refreshToken = await signRefreshToken({ id: newUser.id });

    await db.insert(refreshTokens).values({
      userId: newUser.id,
      tokenHash: hashToken(refreshToken),
      expiresAt: refreshExpiresAt(),
    });

    res.status(201).json({
      message: 'User created successfully',
      token: accessToken,
      refreshToken,
      user: { id: newUser.id, username: newUser.username, role: newUser.role },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal Server Error', code: 'INTERNAL_ERROR' });
  }
};

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    const [user] = await db.select({
      id: users.id,
      username: users.username,
      password: users.password,
      role: users.role,
    }).from(users).where(eq(users.username, username));

    if (!user) return res.status(401).json({ message: 'Invalid credentials', code: 'INVALID_CREDENTIALS' });

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(401).json({ message: 'Invalid credentials', code: 'INVALID_CREDENTIALS' });

    const accessToken = await signToken({ id: user.id, username: user.username, role: user.role });
    const refreshToken = await signRefreshToken({ id: user.id });

    await db.insert(refreshTokens).values({
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      expiresAt: refreshExpiresAt(),
    });

    res.json({
      token: accessToken,
      refreshToken,
      expiresIn: process.env.JWT_EXPIRES_IN || '8h',
      user: { id: user.id, username: user.username, role: user.role },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal Server Error', code: 'INTERNAL_ERROR' });
  }
};

export const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ message: 'Refresh token required', code: 'UNAUTHORIZED' });

    const payload = await verifyRefreshToken(refreshToken);
    if (!payload) return res.status(401).json({ message: 'Invalid or expired refresh token', code: 'UNAUTHORIZED' });

    const tokenHash = hashToken(refreshToken);
    const [stored] = await db.select()
      .from(refreshTokens)
      .where(and(
        eq(refreshTokens.userId, payload.id),
        eq(refreshTokens.tokenHash, tokenHash),
        eq(refreshTokens.isRevoked, false),
      ));

    if (!stored) return res.status(401).json({ message: 'Token revoked or not found', code: 'UNAUTHORIZED' });

    const [user] = await db.select({
      id: users.id, username: users.username, role: users.role,
    }).from(users).where(eq(users.id, payload.id));

    if (!user) return res.status(401).json({ message: 'User not found', code: 'UNAUTHORIZED' });

    const newAccessToken = await signToken({ id: user.id, username: user.username, role: user.role });

    res.json({
      token: newAccessToken,
      expiresIn: process.env.JWT_EXPIRES_IN || '8h',
    });
  } catch (error) {
    console.error('Refresh error:', error);
    res.status(500).json({ message: 'Internal Server Error', code: 'INTERNAL_ERROR' });
  }
};

export const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await db.update(refreshTokens)
        .set({ isRevoked: true })
        .where(eq(refreshTokens.tokenHash, hashToken(refreshToken)));
    }
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Internal Server Error', code: 'INTERNAL_ERROR' });
  }
};

export const changePassword = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized', code: 'UNAUTHORIZED' });

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'currentPassword and newPassword are required', code: 'VALIDATION_ERROR' });
    }

    const [user] = await db.select({ id: users.id, password: users.password }).from(users).where(eq(users.id, userId));
    if (!user) return res.status(404).json({ message: 'User not found', code: 'NOT_FOUND' });

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) return res.status(400).json({ message: 'Current password is incorrect', code: 'INVALID_PASSWORD' });

    const hashed = await bcrypt.hash(newPassword, 10);
    await db.update(users).set({ password: hashed }).where(eq(users.id, userId));

    // Revoke all refresh tokens for this user on password change
    await db.update(refreshTokens).set({ isRevoked: true }).where(eq(refreshTokens.userId, userId));

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Internal Server Error', code: 'INTERNAL_ERROR' });
  }
};

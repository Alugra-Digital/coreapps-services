import { db } from '../../../shared/db/index.js';
import { users } from '../../../shared/db/schema.js';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { signToken } from '../../../shared/utils/jwt.util.js';

export const register = async (req, res) => {
  try {
    const { username, password, role = 'SUPER_ADMIN' } = req.body;

    // Check existing (select only columns that exist in base schema)
    const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.username, username));
    if (existing) return res.status(409).json({ message: 'User already exists', code: 'CONFLICT' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const [newUser] = await db.insert(users).values({
      username,
      password: hashedPassword,
      role
    }).returning();

    const token = await signToken({ id: newUser.id, username: newUser.username, role: newUser.role });

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: { id: newUser.id, username: newUser.username, role: newUser.role }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal Server Error', code: 'INTERNAL_ERROR' });
  }
};

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log('Login attempt for username:', username);

    const [user] = await db.select({
      id: users.id,
      username: users.username,
      password: users.password,
      role: users.role
    }).from(users).where(eq(users.username, username));
    console.log('User found:', user ? 'YES' : 'NO', user);

    if (!user) {
      console.log('User not found in database');
      return res.status(401).json({ message: 'Invalid credentials', code: 'INVALID_CREDENTIALS' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    console.log('Password valid:', isValid);

    if (!isValid) {
      console.log('Password comparison failed');
      return res.status(401).json({ message: 'Invalid credentials', code: 'INVALID_CREDENTIALS' });
    }

    const token = await signToken({ id: user.id, username: user.username, role: user.role });

    res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal Server Error', code: 'INTERNAL_ERROR' });
  }
};

export const logout = (req, res) => {
  res.json({ message: 'Logged out successfully' });
};

import { verifyToken } from '../../../shared/utils/jwt.util.js';

export const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized: No token provided', code: 'UNAUTHORIZED' });
  }

  const token = authHeader.split(' ')[1];
  const payload = await verifyToken(token);

  if (!payload) {
    return res.status(401).json({ message: 'Unauthorized: Invalid token', code: 'UNAUTHORIZED' });
  }

  req.user = payload;
  next();
};

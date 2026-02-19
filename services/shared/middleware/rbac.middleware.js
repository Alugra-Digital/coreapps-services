export const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized', code: 'UNAUTHORIZED' });
    }

    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: Insufficient permissions', code: 'FORBIDDEN' });
    }

    next();
  };
};

export const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized', code: 'UNAUTHORIZED' });
    }
    
    // Allow SUPER_ADMIN to bypass permission checks
    if (req.user.role === 'SUPER_ADMIN') {
        return next();
    }

    if (!req.user.permissions || !req.user.permissions.includes(permission)) {
      return res.status(403).json({ message: `Forbidden: Missing permission ${permission}`, code: 'FORBIDDEN' });
    }

    next();
  };
};

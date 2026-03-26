import express from 'express';
import { authenticate } from '../../../shared/middleware/auth.middleware.js';
import { login, logout, register, changePassword, refresh } from '../controllers/authController.js';
import { getMe, patchMe } from '../controllers/meController.js';
import {
  getRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
} from '../controllers/roleController.js';
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} from '../controllers/userController.js';
import { getSettings, updateSettings } from '../controllers/settingsController.js';

const router = express.Router();

router.post('/login', login);
router.post('/register', register);
router.post('/logout', logout);
router.post('/refresh', refresh);

router.get('/me', authenticate, getMe);
router.patch('/me', authenticate, patchMe);

router.get('/settings', authenticate, getSettings);
router.put('/settings', authenticate, updateSettings);

router.get('/roles', authenticate, getRoles);
router.get('/roles/:id', authenticate, getRoleById);
router.post('/roles', authenticate, createRole);
router.put('/roles/:id', authenticate, updateRole);
router.delete('/roles/:id', authenticate, deleteRole);

router.get('/users', authenticate, getUsers);
router.get('/users/:id', authenticate, getUserById);
router.post('/users', authenticate, createUser);
router.put('/users/:id', authenticate, updateUser);
router.delete('/users/:id', authenticate, deleteUser);

export default router;

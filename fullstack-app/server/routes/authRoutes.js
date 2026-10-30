import express from 'express';
import {
  register,
  login,
  activate,
  resendActivation,
  forgotPassword,
  resetPassword,
  refresh,
  logout
} from '../controllers/authController.js';

export function createAuthRouter(db) {
  const router = express.Router();

  router.post('/register', register(db));
  router.post('/login', login(db));
  router.post('/activate', activate(db));
  router.post('/resend-activation', resendActivation(db));
  router.post('/forgot-password', forgotPassword(db));
  router.post('/reset-password', resetPassword(db));
  router.get('/refresh', refresh(db));
  router.post('/logout', logout);

  return router;
}

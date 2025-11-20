import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import * as userController from '../controllers/user.controller.js';
import * as tripController from '../controllers/trip.controller.js';
import * as expenseController from '../controllers/expense.controller.js';
import * as adminController from '../controllers/admin.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
const router = Router();
// Auth routes (public)
router.post('/auth/signup', authController.signup);
router.post('/auth/login', authController.login);
router.get('/auth/verify/:token', authController.verifyEmail);
router.post('/auth/resend-verification', authController.resendVerification);
router.get('/auth/me', authMiddleware, authController.getCurrentUser);
router.put('/auth/profile', authMiddleware, authController.updateProfile);
// Admin routes (for development/testing)
router.post('/admin/verify-user', adminController.manualVerify);
// User routes
router.get('/users/by-customer-id/:customerId', authMiddleware, userController.getUserByCustomerId);
// Protected routes (require authentication)
// Trips
router.post('/trips', authMiddleware, tripController.createTrip);
router.get('/trips', authMiddleware, tripController.getTrips);
router.get('/trips/:id', authMiddleware, tripController.getTrip);
router.post('/trips/:id/participants', authMiddleware, tripController.addParticipant);
// Expenses
router.post('/expenses', authMiddleware, expenseController.createExpense);
router.get('/expenses', authMiddleware, expenseController.getExpenses);
export default router;
//# sourceMappingURL=index.js.map
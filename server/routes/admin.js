const express = require("express");
const verifyJWT = require("../middleware/verifyJWT");
const { adminLoginLimiter, adminInviteLimiter, forgotPasswordLimiter } = require("../middleware/rateLimiter");
const { validate } = require("../middleware/validate");
const { createProductSchema, updateProductSchema } = require("../schemas/productSchema");
const {
  login,
  forgotPassword,
  resetPassword,
  inviteAdmin,
  validateInviteToken,
  completeOnboard,
  getCloudinarySignature,
  getAdminProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  toggleProductStatus,
  getAdmins,
  getAdminInvites,
  revokeInvite,
} = require("../controllers/adminController");

const router = express.Router();

router.post("/login", adminLoginLimiter, login);
router.post("/forgot-password", forgotPasswordLimiter, forgotPassword);
router.post("/reset-password", forgotPasswordLimiter, resetPassword);
// public onboarding and invite validation endpoints
router.post('/onboard', adminInviteLimiter, completeOnboard);
router.get('/invite/validate', adminInviteLimiter, validateInviteToken);

router.use(verifyJWT);

router.get("/cloudinary-signature", getCloudinarySignature);
router.post('/invite', adminInviteLimiter, inviteAdmin);
router.get('/admins', getAdmins);
router.get('/invites', getAdminInvites);
router.delete('/invites/:id', revokeInvite);
router.get("/products", getAdminProducts);
router.post("/products", validate(createProductSchema), addProduct);
router.put("/products/:id", validate(updateProductSchema), updateProduct);
router.delete("/products/:id", deleteProduct);
router.patch("/products/:id/status", toggleProductStatus);

module.exports = router;

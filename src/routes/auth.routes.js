const router = require('express').Router();

const { signinRequired } = require('../middlewares/auth');
const { validateSignupReq, validateSigninReq, validateResetPasswordReq, isValidate } = require('../middlewares/validate');
const upload = require('../middlewares/upload');
const authController = require('../controllers/auth.controller');

router.get('/', signinRequired, authController.verifyUser);
router.post('/signup', validateSignupReq, isValidate, upload, authController.signup);
router.post('/signin', validateSigninReq, isValidate, authController.signin);
router.post('/reset-password', validateResetPasswordReq, isValidate, authController.sendResetPasswordEmail);

module.exports = router;
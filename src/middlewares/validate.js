const { check, validationResult } = require('express-validator');

const namePattern = /^[A-Za-z\u0600-\u06FF\s]+$/;
const usernamePattern = /^[A-Za-z][A-Za-z0-9]*$/;
const emailPattern = /^\S+@\S+.\S+$/;

exports.validateSignupReq = [
    check('name')
        .notEmpty().withMessage('نام خود را وارد کنید')
        .matches(namePattern).withMessage('لطفا نام خود را به صورت صحیح وارد کنید'),
    check('email')
        .notEmpty().withMessage('ایمیل خود را وارد کنید')
        .matches(emailPattern).withMessage('لطفا یک ایمیل معتبر وارد کنید'),
    check('username')
        .notEmpty().withMessage('نام‌کاربری خود را وارد کنید')
        .matches(usernamePattern).withMessage('نام‌کاربری می‌تواند شامل حروف لاتین و اعداد باشد'),
    check('password')
        .notEmpty().withMessage('رمزعبور خود را وارد کنید')
        .isLength({ min: 8 }).withMessage('رمزعبور باید حداقل شامل 8 کاراکتر باشد')
];

exports.validateSigninReq = [
    check('username')
        .notEmpty().withMessage('نام‌کاربری خود را وارد کنید')
        .matches(usernamePattern).withMessage('نام‌کاربری یا رمزعبور نامعتبر است'),
    check('password')
        .notEmpty().withMessage('رمزعبور خود را وارد کنید')
        .isLength({ min: 8 }).withMessage('نام‌کاربری یا رمزعبور نامعتبر است')
];

exports.validateResetPasswordReq = [
    check('email')
        .notEmpty().withMessage('ایمیل خود را وارد کنید')
        .matches(emailPattern).withMessage('لطفا یک ایمیل معتبر وارد کنید')
];

exports.isValidate = (req, res, next) => {
    const errors = validationResult(req);
    if(errors.array().length) return res.status(400).json({ success: false, message: errors.array()[0].msg });
    else next();
};
const express = require('express');
const router = express.Router();
const userCont = require('../controllers/user-controller');
const {SID} = require('../config/constants')

router.get(`/register-${SID}`, userCont.registerForm);
router.post(`/register-${SID}`, userCont.register);

router.get(`/login-${SID}`, userCont.loginForm);
router.post(`/login-${SID}`, userCont.login);

router.get(`/logout-${SID}`, userCont.logout);

module.exports = router;

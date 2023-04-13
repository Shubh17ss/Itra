const Router = require('express');
const router=Router();
const {isUserAuthenticated}=require('../controller/authController');
const controller=require('../controller/sendMailController');

router.post('/sendMail/OrderConfirmed',isUserAuthenticated,controller.orderConfirmed);

module.exports=router;
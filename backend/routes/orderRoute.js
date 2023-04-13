const {Router} = require('express');
const router = Router();
const controller=require('../controller/orderController');
const { isUserAuthenticated, authorizedRoles } = require('../controller/authController');


router.post('/orders/create',controller.createOrder);
router.get('/orders/getorder/:id',isUserAuthenticated,controller.getSingleOrder);
router.get('/orders/myorders',isUserAuthenticated,controller.getMyOrders);

//Admin Specific Routes

router.get('/orders/admin/allorders',isUserAuthenticated,authorizedRoles('admin'),controller.getAllOrders);
router.put('/orders/admin/updateorder/:id',isUserAuthenticated,authorizedRoles('admin'),controller.updateOrderStatus);
router.delete('/orders/admin/delete/:id',isUserAuthenticated, authorizedRoles('admin'),controller.deleteOrder);

module.exports=router;

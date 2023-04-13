const {Router}=require('express');
const { isUserAuthenticated, authorizedRoles } = require('../controller/authController');
const router=Router();
const controller=require('../controller/userController');

//This is also an admin specific routes.
router.get('/allUsers',isUserAuthenticated,authorizedRoles('admin'),controller.getAllUsers);

router.post('/createUser',controller.createUser);
router.post('/loginUser',controller.loginUser);
router.get('/logoutUser',controller.logOutUser);
router.post('/forgotPassword',controller.forgotPassword);
router.put('/password/reset/token=:token',controller.resetPassword);

//Personal User Routes
router.get('/profile',isUserAuthenticated,controller.getUserProfile);
router.put('/profile/changepassword',isUserAuthenticated,controller.changePassword);
router.put('/profile/updateProfile',isUserAuthenticated,controller.updateProfile);
router.post('/profile/delete',isUserAuthenticated,controller.deleteUserProfile);
router.get('/profile/getallshippingaddress',isUserAuthenticated,controller.getAlladdress);
router.post('/profile/addshippingaddress',isUserAuthenticated,controller.addShippingAddress);
router.delete('/profile/deleteaddress/:id',isUserAuthenticated,controller.deleteShippingAddress);


//Admin specific routes
router.get('/admin/userprofile/:id',isUserAuthenticated,authorizedRoles('admin'),controller.getSingleUserProfile)
router.put('/admin/updateuser/:id',isUserAuthenticated,authorizedRoles('admin'),controller.updateSingleUserProfile);
router.delete('/admin/deleteuser/:id',isUserAuthenticated,authorizedRoles('admin'),controller.deleteUser);

module.exports=router;
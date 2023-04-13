const {Router}=require('express');
const { isUserAuthenticated } = require('../controller/authController');
const {authorizedRoles}=require('../controller/authController');
const router=Router();
const controller=require('../controller/productController');


router.get("/products",controller.getAllproducts);
router.get("/products/page=:page",controller.getAllproducts);
router.get("/products/:id",controller.getSingleProduct);
router.post("/products/specificproducts",controller.getSpecificProducts);
router.get("/products/search/:key",controller.handleSearch);
router.get("/products/filter/price/min=:min&max=:max",controller.handlePriceFilter);
router.get("/products/price/by=:value",controller.getPriceAscending);
router.get("/products/sort/rating",controller.getByRating);

//Product Reviews Routes
router.post("/products/reviews/addreview",isUserAuthenticated,controller.addReview);
router.get("/products/reviews/getallreviews/:id",controller.getAllReviews);
router.delete("/products/reviews/deletereview",isUserAuthenticated,controller.deleteReview);
router.put('/products/reviews/update/:id',controller.updateReviews);

//Product Reviews Routes

router.post("/products/add",isUserAuthenticated,authorizedRoles("admin"),controller.addProduct);
router.put('/products/update',isUserAuthenticated,controller.updateProduct);
router.put('/products/update/addImage',isUserAuthenticated,controller.addProductImage);
router.delete('/products/delete/:id',isUserAuthenticated,controller.deleteProduct);

//Admin specific Routes
router.get("/products/admin/getAll",isUserAuthenticated,authorizedRoles('admin'),controller.getAllProductsAdmin);


module.exports=router;

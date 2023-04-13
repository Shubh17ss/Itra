const pool = require('../database/connect');
const client = require('../database/elephantPg');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config({ path: './config/config.env' });




// add a new Product -- specific to admin
const addProduct = (req, res) => {
    const { token } = req.cookies;
    const userId = jwt.decode(token, process.env.JWT_SECRET).id;
    const { name, description, price, category, stock } = req.body;
    let ratings=0;
    let reviews=0;
    const createdAt = new Date();

    client.query("INSERT INTO Products(name,description,price,category,stock,createdAt,userid,ratings,reviews) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) returning id", [name, description, price, category, stock, createdAt, userId, ratings, reviews], (error, results) => {
        if (error) {
            res.status(401).send(error.message);
        }
        else {
            res.status(200).json({
                success: true,
                message: 'Product Created Successfully',
                results
            });
        }
    })
}

// update Product
const updateProduct = (req, res) => {
    const { id, name, description, price, category, stock } = req.body;
    client.query('UPDATE products set name=$2, description=$3, price=$4, category=$5, stock=$6 where id=$1', [id, name, description, price, category, stock], (error, results) => {
        if (error) {
            res.send('Internal Sever Error');
        }
        else {
            res.status(200).send(req.body);
        }
    })
}

//Add product image
const addProductImage = (req, res) => {
    const url = req.body.url;
    const id = req.body.id;
    client.query('UPDATE products set image_url=$1 where id=$2', [url, id], (error, results) => {
        if (error)
            res.status(400).send(error.message);
        else
            res.status(200).send('Product Image added');
    })
}

// get All Products

const getAllproducts = (req, res) => {
    const currentPage = req.params.page;
    const productsPerPage = 12;
    const skip = currentPage >= 1 ? productsPerPage * (currentPage - 1) : 0;

    client.query("SELECT * FROM Products ORDER BY id ASC LIMIT $1 OFFSET $2", [productsPerPage, skip], (error, results) => {
        if (error) {
            res.status(401).send(error.message);
        }
        else {
            if (results.rows.length !== 0) {
                res.status(200).json(results.rows);
            }
            else {
                res.status(404).send("No Products found");
            }
        }
    })
}

const getAllProductsAdmin = (req, res) => {
    client.query('SELECT * FROM PRODUCTS ORDER BY ID', (error, results) => {
        if (error) {
            res.status(400).send(error.message);
        }
        else {
            res.status(200).json(results.rows);
        }
    })
}

//get Single Product by id

const getSingleProduct = (req, res) => {
    const id = req.params.id;
    client.query("SELECT * from products where id=$1", [id], (error, results) => {
        if (error) {
            res.send('Internal Server Error');
        }
        else {
            if (results.rows.length === 0)
                res.status(404).send('Product Not Found');
            else
                res.status(200).json(results.rows);
        }
    })
}

//get Specific products

const getSpecificProducts = (req, res) => {
    const values = req.body.values;
    console.log(values);
    client.query('SELECT * FROM products where id = ANY($1::int[]) ORDER BY id', [values], (error, results) => {
        if (error)
            res.status(400).send(error.message);
        else
            res.status(200).json(results.rows);
    })
}

//delete Product

const deleteProduct = (req, res) => {
    const id = req.params.id;
    client.query('DELETE FROM products where id=$1', [id], (error, results) => {
        if (error) {
            res.status(401).send('Internal server Error');
        }
        else {
            res.status(200).send('Product deleted Successfully');
        }
    })
}

// Search for Product

const handleSearch = (req, res) => {
    const key = req.params.key;
    client.query('SELECT * from products where lower(name) ~ lower($1) OR lower(category) ~ lower($1) OR lower(description) ~ lower($1)', [key], (error, results) => {
        if (error) {
            res.status(401).send(error.message);
        }
        else {
            if (results.rows.length != 0)
                res.status(200).json(results.rows);
            else
                res.status(404).send('Product not found');
        }
    })
}

const handlePriceFilter = (req, res) => {
    const min = req.params.min;
    const max = req.params.max;

    client.query('SElECT * FROM products where price >= $1 AND price <= $2', [min, max], (error, results) => {
        if (error) {
            res.status(401).send(error.message);
        }
        else {
            if (results.rows.length != 0) {
                res.status(200).json(results.rows);
            }
            else {
                res.status(404).send('Product not found');
            }
        }
    })

}

//Sort Products

const getPriceAscending = (req, res) => {

    const value = req.params.value;
    if (value === "ASC") {
        client.query('SELECT * from products ORDER BY price ASC', (error, results) => {
            if (error)
                res.status(400).send(error.message);
            else
                res.status(200).json(results.rows);
        })
    }
    else {
        client.query('SELECT * from products ORDER BY price DESC', (error, results) => {
            if (error)
                res.status(400).send(error.message);
            else
                res.status(200).json(results.rows);
        })
    }

}

const getByRating = (req, res) => {
    client.query('SELECT * from products ORDER BY rating DESC', (error, results) => {
        if (error)
            res.status(400).send(error.message);
        else
            res.status(200).json(results.rows);
    })
}



//Product review Section
const addReview = (req, res) => {
    const { product_id, comment, rating } = req.body;
    const { token } = req.cookies;
    const user_id = jwt.decode(token, process.env.JWT_SECRET).id;
    client.query('SELECT * from reviews where product_id=$1 AND user_id=$2', [product_id, user_id], (error, results) => {
        if (error)
            res.status(400).send(error.message);
        else {
            let reviews = results.rows;
            client.query('SELECT name from users where id=$1', [user_id], (error, results) => {
                if (error)
                    res.status(400).send(error.message);
                else {
                    let username = results.rows[0].name;
                    if (reviews.length == 0) { // Add a new review
                        client.query('INSERT INTO reviews(product_id, username, comment, rating, user_id) VALUES($1,$2,$3,$4,$5)', [product_id, username, comment, rating, user_id], (error, results) => {
                            if (error)
                                res.status(400).send(error.message);
                            else
                                res.status(200).json({
                                    success: true,
                                    message: 'Review added successfully'
                                })
                        })
                    }
                    else {// Update the existing review for a particular product from a specific user

                        const review_id = reviews[0].rev_id;
                        client.query('UPDATE reviews SET comment=$1, rating=$2 where rev_id=$3', [comment, rating, review_id], (error, results) => {
                            if (error)
                                res.status(400).send(error.message);
                            else
                                res.status(200).json({
                                    success: true,
                                    message: 'Review Updated Successfully'
                                })
                        })

                    }
                }
            })
        }
    })
}

const getAllReviews = (req, res) => {
    const product_id = req.params.id;
    client.query('SELECT * FROM REVIEWS WHERE product_id=$1', [product_id], (error, results) => {
        if (error)
            res.status(400).send(error.message);
        else {
            if (results.rows.length == 0)
                res.status(404).send('No reviews for this products');
            else
                res.status(200).json(results.rows);
        }
    })

}

const updateReviews = (req, res) => {
    const id = req.params.id;
    client.query('UPDATE products SET reviews=(SELECT count(*) from reviews where product_id=$1), rating=(SELECT sum(rating) from reviews where product_id=$1) where id=$1', [id], (error, results) => {
        if (error)
            res.status(400).send(error.message);
        else
            res.status(200).send("Reivews and ratings updated successfully");
    })
}

const deleteReview = (req, res) => {
    const { token } = req.cookies;
    const user_id = jwt.decode(token, process.env.JWT_SECRET).id;
    const review_id = req.body.review_id;
    client.query('SELECT * FROM reviews where rev_id=$1 AND user_id=$2', [review_id, user_id], (error, results) => {
        if (error)
            res.status(400).send(error.message);
        else {
            if (results.rows.length == 0)
                res.status(404).send('You cannot delete this review as you have not posted it.');
            else {
                client.query('DELETE FROM reviews where rev_id=$1 AND user_id=$2', [review_id, user_id], (error, results) => {
                    if (error)
                        res.status(400).send(error.message);
                    else
                        res.status(200).send('Review Deleted Successfully');
                })
            }
        }
    })

}




module.exports = {
    addProduct,
    updateProduct,
    getAllproducts,
    getSingleProduct,
    deleteProduct,
    handleSearch,
    handlePriceFilter,
    addReview,
    getAllReviews,
    deleteReview,
    updateReviews,
    getPriceAscending,
    getByRating,
    getSpecificProducts,
    getAllProductsAdmin,
    addProductImage,
}
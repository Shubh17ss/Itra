const pool = require('../database/connect');
const client = require('../database/elephantPg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const crypto = require('crypto');
const nodeMailer = require('nodemailer');
const { error } = require('console');

dotenv.config({ path: './config/config.env' });

const cookie_options = {
    expires: new Date(Date.now() + process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
    httpOnly: true,
}

const getAllUsers = (req, res) => {

    client.query('select * from users order by id', (error, results) => {
        if (error)
            res.status(400).send(error.message);
        else
            res.status(200).json(results.rows);
    })
}

const createUser = async (req, res) => {
    const { name, email, password, role } = req.body;
    const bPassword = await bcrypt.hash(password, 3);
    client.query('INSERT INTO USERS(name, email, password, role) VALUES($1,$2,$3,$4) returning id', [name, email, bPassword, role],async (error, results) => {
        if (error)
            res.status(400).send(error.message);
        else
        {
            const token=await getAuthToken(results.rows[0].id);
            res.status(200).cookie("token", token, cookie_options).json({
                success: true,
                results,
                token,
            })
        }
            
    })
}

const loginUser = (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        res.status(400).send('Invalid Request...Please Provide a valid Email or Password');
    }
    else {
        client.query('SELECT * FROM USERS WHERE EMAIL=$1', [email], async (error, results) => {
            if (error) {
                res.status(401).send(error.message);
            }
            else {
                if (results.rows.length <= 0) {
                    res.status(404).send('No Such User found');
                }
                else {
                    const receivedPass = results.rows[0].password;
                    if (await bcrypt.compare(password, receivedPass)) {
                        const token = await getAuthToken(results.rows[0].id);
                        res.status(200).cookie("token", token, cookie_options).json({
                            success: true,
                            results,
                            token,
                        })
                    }
                    else
                        res.status(400).send('Invalid Email or Password');
                }
            }
        })
    }
}

const logOutUser = (req, res) => {

    res.cookie("token", null, {
        expires: new Date(Date.now()),
        httpOnly: true,
    }).status(200).json({
        success: true,
        message: 'Logged Out'
    })


}

const forgotPassword = async (req, res) => {

    const email = req.body.email;
    client.query('SELECT email from users where email=$1', [email], async (error, results) => {
        if (error)
            res.status(400).send(error.message);
        else {
            if (results.rows.length <= 0)
                res.status(404).send('No User with this email exists');
            else {
                const resetToken = await getResetPasswordToken(email);
                console.log('Reset Token returned is ', resetToken);
                const resetPasswordUrl = `${req.protocol}://${req.get("host")}/api/v2/password/reset/token=${resetToken}`
                const message = `Your password reset token is \n\n${resetPasswordUrl}\n\nIf you have not requested a password reset, please ignore it.`
                try {
                    await sendMail({
                        email: email,
                        subject: 'Itra.com Password Recovery',
                        message,
                    })

                    res.status(200).send('Mail Sent');

                } catch (error) {
                    client.query('UPDATE users SET resetpasswordtoken=$1,resetpasswordexpire=$2 where email=$3', [undefined, undefined, email], (error, results) => {
                        if (error)
                            res.status(400).send(error.message);
                    })
                    res.status(401).send('Something went wrong...please try again.');
                }
            }
        }
    })

}

const resetPassword = async (req, res) => {
    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword;
    const resetToken = req.params.token;
    const resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    client.query('SELECT email, resetpasswordexpire from users where resetpasswordtoken=$1', [resetPasswordToken], async (error, results) => {
        if (error)
            res.status(400).send(error.message);
        else {
            if (results.rows.length <= 0) {
                res.status(404).send('Invalid Reset Token');
            }
            else {
                const email = results.rows[0].email;
                const expireTime = Number(results.rows[0].resetpasswordexpire);
                if (Date.now() > expireTime) {
                    res.status(400).send("Reset Token Expired");
                }
                else {
                    if (password !== confirmPassword) {
                        res.status(400).send("Passwords do not match");
                    }
                    else {
                        const bPassword = await bcrypt.hash(password, 3);
                        client.query('UPDATE users SET password=$1, resetpasswordtoken=$2, resetpasswordexpire=$3 where email=$4', [bPassword, undefined, undefined, email], (error, results) => {
                            if (error) {
                                res.status(400).send(error.message);
                            }
                            else {
                                res.status(200).json({
                                    success: true,
                                    message: 'Password has been reset'
                                })
                            }
                        })
                    }
                }
            }
        }
    })

}


//Personal User Functions

const getUserProfile = (req, res) => {
    const { token } = req.cookies;
    const id = jwt.verify(token, process.env.JWT_SECRET).id;
    client.query('SELECT * FROM users where id=$1', [id], (error, results) => {
        if (error)
            res.status(400).send(error.message);
        else
            res.status(200).json(results.rows);
    })

}

const changePassword = async (req, res) => {
    const oldPassword = req.body.oldPassword;
    const newPassword = await bcrypt.hash(req.body.newPassword, 3);
    console.log(oldPassword, newPassword);
    const { token } = req.cookies;
    const id = jwt.verify(token, process.env.JWT_SECRET).id;
    client.query('select password from users where id=$1', [id], async (error, results) => {
        if (error)
            res.status(400).send(error.message);
        else {
            if (await bcrypt.compare(oldPassword, results.rows[0].password)) {

                client.query('UPDATE users SET password=$1', [newPassword], (error, results) => {
                    if (error)
                        res.status(501).send(error.message);
                    else {
                        res.status(200).json({
                            success: true,
                            message: 'Password changed successfully.'
                        })
                    }
                })
            }
            else {
                res.status(400).send('Old Password does not match the original Password');
            }
        }
    })
}

const updateProfile = async (req, res) => {
    const { token } = req.cookies;
    const id = jwt.verify(token, process.env.JWT_SECRET).id;
    const { name, email } = req.body;
    console.log(name, email);
    client.query('UPDATE users SET name = $1, email = $2 where id=$3', [name, email, id], (error, results) => {
        if (error) {
            res.status(400).send(error.message);
        }
        else {
            res.status(200).json({
                success: true,
                message: 'Profile updated successfully'
            })
        }
    })
}

const deleteUserProfile = (req, res) => {
    const { token } = req.cookies;
    const id = jwt.verify(token, process.env.JWT_SECRET).id;
    const { password } = req.body;
    client.query('SELECT password from users where id=$1', [id], async (error, results) => {
        if (error) {
            res.status(400).send(error.message);
        }
        else {
            if (await bcrypt.compare(password, results.rows[0].password)) {
                client.query('DELETE FROM USERS where id=$1', [id], (error, results) => {
                    if (error)
                        res.status(400).send(error.message);
                    else
                        res.status(200).send('Profile deleted successfully');
                })
            }
            else
                res.status(400).send('Wrong password entered.');
        }
    })
}


//To make the below functions client specific and remove pool query.

const getAlladdress = (req, res) => {
    const { token } = req.cookies;
    const id = jwt.verify(token, process.env.JWT_SECRET).id;
    client.query('SELECT * FROM address where user_id=$1', [id], (error, results) => {
        if (error)
            res.status(400).send(error.message);
        else
            res.status(200).json(results.rows);
    })
}

const addShippingAddress = (req, res) => {
    const { token } = req.cookies;
    const id = jwt.verify(token, process.env.JWT_SECRET).id;
    const { name, street, city, pincode, state, country } = req.body;

    client.query('INSERT INTO address(name, street, city, postal_code, state, country, user_id) VALUES($1,$2,$3,$4,$5,$6,$7)', [name, street, city, pincode, state, country, id], (error, results) => {
        if (error)
            res.status(400).send(error.message);
        else
            res.status(200).json({
                success: true,
                message: 'Address added successfully'
            })
    })

}

const deleteShippingAddress = (req, res) => {
    const id = req.params.id;
    client.query('DELETE FROM address where id=$1', [id], (error, results) => {
        if (error)
            res.status(400).send(error.message);
        else
            res.status(200).send('Address deleted');
    })
}


//Admin Specific functions
const getSingleUserProfile = (req, res) => {
    const id = req.params.id;
    client.query('SELECT * from users where id=$1', [id], (error, results) => {
        if (error)
            res.status(400).send(error.message);
        else {
            if (results.rows.length == 0)
                res.status(404).json({
                    success: false,
                    message: "No such user found"
                })
            else
                res.status(200).json(results.rows);
        }
    })
}

const updateSingleUserProfile = (req, res) => {
    const { name, email, role } = req.body;
    client.query('UPDATE users SET name=$1, email=$2, role=$3 where id=$4', [name, email, role, req.params.id], (error, results) => {
        if (error)
            res.status(201).send(error.message);
        else
            res.status(200).json({
                success: true,
                message: 'Profile updated successfully'
            })
    })
}

const deleteUser = (req, res) => {
    const id = req.params.id;
    client.query('DELETE FROM users where id=$1', [id], (error, results) => {
        if (error)
            res.status(400).send(error.message);
        else {
            res.status(200).json({
                success: true,
                message: 'User deleted successfully'
            })
        }
    })
}



//Token generating functions

const getAuthToken = (id) => {
    return jwt.sign({ id: id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE,
    })
}


const getResetPasswordToken = (email) => {
    const resetToken = crypto.randomBytes(20).toString("hex");
    const resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    const resetPasswordExpire = Date.now() + 15 * 60 * 1000;
    client.query('UPDATE users SET resetpasswordtoken = $1,  resetpasswordexpire = $2 where email=$3', [resetPasswordToken, resetPasswordExpire, email], (error, results) => {
        if (error)
            console.log(error.message);
    })

    return resetToken;
}



//Sending Email 

const sendMail = (mailBody) => {
    let authData = nodeMailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
            user: 'kalsultant@gmail.com',
            pass: 'oqcceuuyffbczxcj'
        }
    })
    authData.sendMail({
        from: 'info@itra.com',
        to: mailBody.email,
        subject: mailBody.subject,
        text: mailBody.message
    })
}


module.exports = {
    getAllUsers,
    createUser,
    loginUser,
    logOutUser,
    forgotPassword,
    resetPassword,
    getUserProfile,
    changePassword,
    updateProfile,
    getSingleUserProfile,
    updateSingleUserProfile,
    getAlladdress,
    addShippingAddress,
    deleteShippingAddress,
    deleteUser,
    deleteUserProfile
}
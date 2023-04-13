const jwt=require('jsonwebtoken');
const pool=require('../database/connect');
const client=require('../database/elephantPg');

const isUserAuthenticated=async (req,res,next)=>{
    const {token}=req.cookies;
    if(!token){
        res.status(401).send('Token not found...Please Login to access');
    }
    else
    {
        const decodedToken=jwt.verify(token,process.env.JWT_SECRET);
        client.query('SELECT * FROM USERS WHERE id=$1',[decodedToken.id],(error,results)=>{
            if(error){
                res.status(400).send(error.message);
            }
            else
            {
                if(results.rows.length>0){
                    next();
                }
                else{
                    res.status(404).send('Not a valid token');
                }
            }
        })
    }
}

const authorizedRoles=(...roles)=>{
    
    return (req,res,next)=>{
        const {token}=req.cookies;
        const decodedToken=jwt.decode(token,process.env.JWT_SECRET);
        client.query('SELECT role from users where id=$1',[decodedToken.id],(error,results)=>{
            if(error){
                res.status(400).send(error.message);
            }
            else{
                if(roles.includes(results.rows[0].role)){
                    next();
                }
                else{
                    res.status(403).send('Access to this resource is restricted');
                }
            }
        })

    }
}

module.exports={
    isUserAuthenticated,
    authorizedRoles,
}
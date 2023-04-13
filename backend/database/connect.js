const dotenv=require('dotenv');
const Pool=require('pg').Pool;
const pg=require('pg');
dotenv.config({path:'./config/config.env'})

    
const pool=new Pool({
        user:"postgres",
        host:"localhost",
        database:"ecommerce",
        password:"Shubh",
        port:process.env.PORT_DB,
    });



module.exports=pool;
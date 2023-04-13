const express=require('express');
const app=express();
const cors=require('cors');
const dotenv=require('dotenv');
const productRoutes=require('./routes/productRoute')
const userRoutes=require('./routes/usersRoute');
const orderRoutes=require('./routes/orderRoute');
const sendMailRoutes=require('./routes/sendMail');
const path=require('path');

const cookieParser = require('cookie-parser');



process.on('uncaughtException',(err)=>{
    console.log('Error:',err.message);
    console.log('Shutting down server due to uncaught Exception');
    process.exit(1);
})


if(process.env.NODE_ENV!=="PRODUCTION")
dotenv.config({path:'./config/config.env'})

app.use(cors());
app.use(express.json());
app.use(cookieParser());


app.use('/api/v1',productRoutes);
app.use('/api/v2',userRoutes);
app.use('/api/v3',orderRoutes);
app.use('/api/v4',sendMailRoutes);

app.use(express.static(path.join(__dirname,"../frontend/build")));


app.get("*",(req,res)=>{
    res.sendFile(path.resolve(__dirname,"../frontend/build/index.html"));
})


const server=app.listen(process.env.PORT,()=>{
    console.log(`app listening on port ${process.env.PORT}`);
})


//unhandled promise rejection

process.on("unhandledRejection",(err)=>{
    console.log('Error : ',err.message);
    console.log('Shutting down the server due to unhandled promise rejection');
    server.close(()=>{
        process.exit(1);
    })
})
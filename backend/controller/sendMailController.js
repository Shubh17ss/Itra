const nodeMailer = require('nodemailer');


const orderConfirmed=(req,res)=>{
    const text=req.body.text;
    const subject=req.body.subject;
    const email=req.body.email

    let authData=nodeMailer.createTransport({
        host:'smtp.gmail.com',
        port:465,
        secure:true,
        auth:{
            user:'kalsultant@gmail.com',
            pass:'oqcceuuyffbczxcj'
        }
    })

    authData.sendMail({
        from:'itra@gmail.com',
        to:email,
        subject:subject,
        text:text
    }).then((response)=>{
        res.status(200).send('Mail Sent');
    }).catch((error)=>{
        res.status(400).send('Error sending mail');
    })

}

module.exports={
    orderConfirmed,
}
express= require('express');
const authMiddleware = require('./middleware/authMiddleware')
const jwt =require("jsonwebtoken")
const app = express();
app.use(express.json());  
const User = require('./models/user');
const Admin =require('./models/admin');
const{sequelize}= require('./config/database');
const Wallet = require('./models/wallet');
const Transaction = require('./models/transactions');
const { where } = require('sequelize');
const axios = require("axios");       
const cors = require("cors");
const dotenv = require('dotenv')
const crypto = require("crypto");
const transporter= require ("./config/nodemailer")

const nodemailer = require("nodemailer");

dotenv.config()

// 1) CORS FIRST (above any routes)
const allowed = ["http://localhost:3000", "http://127.0.0.1:3000"];
app.use(cors({
  origin(origin, cb) {
    if (!origin || allowed.includes(origin)) return cb(null, true);
    return cb(new Error("Not allowed by CORS"));
  },
  methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization"],
  credentials: false, // set true only if using cookies/sessions
}));
// Handle preflight for all routes
app.options("", cors());




































sequelize.sync()
.then(()=>{
    console.log('Database & tables created!');
});




app.post('/check-server',(req,res)=>{
 res.send("Server is running fine");
});



//signup API

app.post("/register", async(req,res)=>{
 email=req.body.email;
 password=req.body.password;
 name=req.body.name;

 const register= await User.create({name:name,email:email,password:password});

 if (register){

  const wallet = await Wallet.create({uid:register.id,balance:0.0});

  if(wallet){
    res.status(200).json({message:"User Registered Successfully",register,wallet});
    } else{
        res.status(500).json({message:"error In Creating wallet"}); 

  }
 } else{
         res.status(501).json({message:"error In Registering User"});

 }

})

//log In API

app.post("/login", async (req,res)=>{
    email=req.body.email;
    password=req.body.password;

    const 

    login= await User.findOne({where:{email:email,password:password}});
    if (login){

    const   token =jwt.sign ({id:login.id},process.env.JWT_SECRET,{expiresIn:"20m"})
        res.status(200).json({message:"User LOgged In Successfully",token});
    }else{
        res.status(401).json({message:"Invalid Credentials"});  
    }

})

// check balance API//

app.post("/check-balance",async(req,res)=>{
 uid=req.body.uid;

   balance = await Wallet.findOne({where:{uid:uid}});
 
   if (balance ){
    res.status(200).json({message:`Balance fetched successfully`,balance});
   }
   else{
    res.status(501).json({message:"something went wrong please try again later"});
   }

}); 

 //deposit API//
 app.post("/deposit",async(req,res)=>{
   const uid=req.body.uid;
  const amount=req.body.amount;

  wallet = await Wallet.findOne({where:{uid:uid}});
 
 if (wallet){
     balance= parseInt( wallet.balance); 

     total=balance + parseInt(amount);
  const update= await Wallet.update({balance:total},{where:{uid:uid}
 });

 if (update)
    type="Deposit"
{
 const trans= await Transaction.create({uid,amount,type});
 if (trans){
   res.status(200).json({message:"Deposit Successful",total,})
 }
 else{
    res.status(401).json({message:" Something went Wrong"})
 }

 }
 }});


//withdrawal API
 app.post('/withdrawal',async(req,res)=>{
    uid=req.body.uid;
  amount=req.body.amount;

  const wallet= await Wallet.findOne({where:{uid:uid}});

  if (wallet ){
  balance= wallet.balance;
 withdraw = "-" + balance  - amount;

   const update= Wallet.update({balance:withdraw},{where:{uid:uid}});

 if (update){
    type="Withdrawal"
 const  trans= Transaction.create({type,amount,uid})
  if (trans){
    res.status(200).json({message:`You have Successfully Withdrawed ${amount}`})


  }else{
    res.status(401).json({message:" Something Went wrong"})
 }}}});



//fetch all users//

app.get("/users", async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ["id", "name", "email", "createdAt"], // hide password
     
    });
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

//transaction history//
app.get("/transactions", async (req, res) => {
  try {
    const Transactions= await Transaction.findAll({
      attributes: ["id","uid", "amount","type"], // hide password
     
    });
    res.json(Transactions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch Transaction" });
  }
});



//jwt test//
app.get("/profile",  authMiddleware ,async (req,res)=>{

  try{
    return res.status(200).json({message:"User Profile",userID:userInfo.userID});

  }catch(err){
    
    return res.status(401).json({message:"Internal Server Error"})
  }



});


app.post("/send-otp", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const info = await transporter.sendMail({
      from: process.env.FROM_EMAIL || process.env.SMTP_USER,
      to: email,
      subject: "Your verification code",
      text: `Your OTP is ${otp}`,
      html: `<p>Your OTP is <b>${otp}</b>. It expires in 10 minutes.</p>`,
    });

    console.log("OTP email sent:", info.messageId);

    // In real app, save OTP somewhere (DB / cache). For now just return it.
    return res.status(200).json({
      message: "OTP sent successfully",
      messageId: info.messageId,
      otp, // remove this in production
    });
  } catch (err) {
    console.error("OTP send error:", err);
    return res.status(500).json({
      message: "Failed to send OTP",
      error: err.message,
    });
  }
});































const PORT =process.env.PORT || 5005;
app.listen(PORT,()=>{
    console.log(`Server is running on port ${PORT}`);
});


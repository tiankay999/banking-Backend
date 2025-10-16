express= require('express');
const app = express();
app.use(express.json());  
const User = require('./models/user');
const Admin =require('./models/admin');
const{sequelize}= require('./config/database');
const Wallet = require('./models/wallet');

sequelize.sync()
.then(()=>{
    console.log('Database & tables created!');
});




app.post('/check-server',(req,res)=>{
 res.send("Server is running fine");
});





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


app.post("/login",(req,res)=>{
    email=req.body.email;
    password=req.body.password;

    login= User.findOne({where:{email:email,password:password}});
    if (login){
        res.status(200).json({message:"User LOgged In Successfully",login});
    }else{
        res.status(501).json({message:"Invalid Credentials"});  
    }

})

app.post("/check-balance",(req,res)=>{
 uid=req.body.uid;

   balance = Wallet.findOne({where:{uid:uid}});

   if (balance ){
    res.status(200).json({message:`you have ${balance} in your account`})
   }

}); 


const PORT =process.env.PORT || 6000;
app.listen(PORT,()=>{
    console.log(`Server is running on port ${PORT}`);
});


express = require('express');
const authMiddleware = require('./middleware/authMiddleware')
const jwt = require("jsonwebtoken")
const depositRouter = require('./routes/deposite');
const app = express();
app.use(express.json());
const User = require('./models/user');
const { sequelize } = require('./config/database');
const Wallet = require('./models/wallet');
const Transaction = require('./models/transactions');
const withdrawalRouter = require('./routes/withdrawal');
const transferRouter = require('./routes/transfer');
const cors = require("cors");
const dotenv = require('dotenv')
const transporter = require("./config/nodemailer")

const nodemailer = require("nodemailer");
storeOTP = {};
dotenv.config()

// 1) CORS FIRST (above any routes)
const allowed = ["http://localhost:3000", "http://127.0.0.1:3000"];
app.use(cors({
  origin(origin, cb) {
    if (!origin || allowed.includes(origin)) return cb(null, true);
    return cb(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: false, // set true only if using cookies/sessions
}));
// Handle preflight for all routes
app.options("", cors());

sequelize.sync()
  .then(() => {
    console.log('Database & tables created!');
  });




app.get('/check-server', (req, res) => {
  res.send("Server is running fine");
});



//signup API
app.post("/register", async (req, res) => {
  email = req.body.email;
  password = req.body.password;
  name = req.body.name;

  const register = await User.create({ name: name, email: email, password: password });

  if (register) {

    const wallet = await Wallet.create({ uid: register.id, balance: 0.0 });

    if (wallet) {
      res.status(200).json({ message: "User Registered Successfully", register, wallet });
    } else {
      res.status(500).json({ message: "error In Creating wallet" });

    }
  } else {
    res.status(501).json({ message: "error In Registering User" });

  }

})

//log In API

app.post("/login", async (req, res) => {
  email = req.body.email;
  password = req.body.password;

  const

    login = await User.findOne({ where: { email: email, password: password } });
  if (login) {

    const token = jwt.sign({ id: login.id }, process.env.JWT_SECRET, { expiresIn: "1h" })
    res.status(200).json({ message: "User LOgged In Successfully", token });
  } else {
    res.status(401).json({ message: "Invalid Credentials" });
  }

})


// check balance API//

app.get("/check-balance", authMiddleware, async (req, res) => {
  uid = req.user.id;

  balance = await Wallet.findOne({ where: { uid: uid } });

  if (balance) {
    res.status(200).json({ message: `Balance fetched successfully`, balance: parseFloat(balance.balance) });
  }
  else {
    res.status(501).json({ message: "something went wrong please try again later" });
  }

});
//deposit API
app.use("/deposit", depositRouter);


//withdrawal API
app.use("/withdrawal", withdrawalRouter);

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

//transfer//
app.use("/transfer", transferRouter);


//get all transactions//
app.get("/transactions", authMiddleware, async (req, res) => {

  try {
    const uid = req.user.id;

    const transactions = await Transaction.findAll({ where: { uid: uid } });
    if (transactions) {
      res.status(200).json({ message: "Transactions Fetched Successfully", transactions });
    }
    else {
      res.status(401).json({ message: "No Transactions Found" });
    }

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Something went wrong" });
  }



})
















//transaction history//
app.get("/transactions", async (req, res) => {
  try {
    const Transactions = await Transaction.findAll({
      attributes: ["id", "uid", "amount", "type"], // hide password

    });
    res.json(Transactions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch Transaction" });
  }
});



//jwt test//
app.get("/profile", authMiddleware, async (req, res) => {

  try {
    return res.status(200).json({ message: "User Profile", userID: req.user.id });

  } catch (err) {
    console.error("Error in /profile:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }

});

//verification code (OTP) sending API  //
app.post("/send-otp", authMiddleware, async (req, res) => {
  try {
    const id = req.user.id;
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    storeOTP[id] = { otp, expiresAt: Date.now() + 10 * 60 * 1000 }; // Fixed: 1000 instead of 100

    const info = await transporter.sendMail({
      from: process.env.FROM_EMAIL || process.env.SMTP_USER,
      to: email,
      subject: "Your verification code",
      text: `Your OTP is ${otp}`,
      html: `<p>Your OTP is <b>${otp}</b>. It expires in 10 minutes.</p>`,
    });

    console.log("OTP email sent:", info.messageId);

    return res.status(200).json({
      message: `OTP sent successfully ${otp}`,
      messageId: info.messageId,

      // otp, // remove this in production
    });
  } catch (err) {
    console.error("OTP send error:", err);
    return res.status(500).json({
      message: "Failed to send OTP",
      error: err.message,
    });
  }
});

app.post("/verify-otp", authMiddleware, async (req, res) => {
  const otp = req.body.otp;
  const id = req.user.id;

  if (!otp) {
    return res.status(400).json({ message: "OTP is required" });
  }

  if (!storeOTP[id]) {
    return res.status(401).json({ message: "No OTP sent for this user" });
  }

  // Check expiration
  if (Date.now() > storeOTP[id].expiresAt) {
    delete storeOTP[id];
    return res.status(401).json({ message: "OTP expired" });
  }

  // Compare OTP strings
  if (storeOTP[id].otp === otp) {
    delete storeOTP[id];
    return res.status(200).json({ message: "OTP Verified Successfully" });
  } else {
    return res.status(401).json({ message: "Invalid OTP" });
  }
});



app.get("/username", authMiddleware, async (req, res) => {
  const id = req.user.id;
  try {

    const theuser = await User.findOne({ where: { id: id }, attributes: ['id', 'name', 'email'] });
    if (theuser) {
      res.status(200).json({ message: "User Found", username: theuser.name, user: theuser });
    }
    else {
      res.status(401).json({ message: "User Not Found" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Something went wrong" });
  }
})





const PORT = process.env.PORT || 5005;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});


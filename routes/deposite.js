const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middleware/authMiddleware");
const Wallet = require("../models/wallet");
const Transaction = require("../models/transactions");



 //deposit API//
 router.post("/", authMiddleware, async(req,res)=>{
  try {
    const uid = req.user.id; // Get uid from authenticated user
    const amount = req.body.amount;

    // Validate amount
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      return res.status(400).json({message: "Invalid amount. Must be a positive number."});
    }

    const wallet = await Wallet.findOne({where:{uid:uid}});
 
    if (wallet){
      const balance = parseFloat(wallet.balance); 
      const total = balance + parseFloat(amount);
      
      const update = await Wallet.update({balance:total},{where:{uid:uid}});

      if (update) {
        const trans = await Transaction.create({uid, amount, type:"Deposit"});
        
        if (trans){
          res.status(200).json({message:"Deposit Successful", total})
        } else {
          res.status(500).json({message:"Failed to record transaction"})
        }
      } else {
        res.status(500).json({message:"Failed to update wallet balance"})
      }
    } else {
      res.status(404).json({message:"Wallet not found"})
    }
  } catch(err) {
    console.error("Deposit error:", err);
    res.status(500).json({message:"Something went wrong", error: err.message});
  }
 });

 module.exports = router;


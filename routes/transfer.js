 const express = require('express');
 const router = express.Router();
 const { authMiddleware } = require("../middleware/authMiddleware");
 const Wallet = require("../models/wallet");
 const Transaction = require("../models/transactions");
 const User = require("../models/user");  








 
router.post("/",authMiddleware, async (req, res) => {
  try{
    const senderuid = req.user.id; // Get sender's user ID from auth
    const amount = req.body.amount;
    const receiveremail = req.body.receiveremail;

    // Validate inputs
    if (!receiveremail || !amount) {
      return res.status(400).json({message:"Receiver email and amount are required"})
    }

    if (isNaN(amount) || parseFloat(amount) <= 0) {
      return res.status(400).json({message:"Amount must be a positive number"})
    }
    
    // Get sender by ID (from auth)
    const sender = await User.findOne({where:{id: senderuid}});
    // Get receiver by email (from request body)
    const receiver = await User.findOne({where:{email: String(receiveremail).trim()}});
    
    if (!sender) {
      return res.status(404).json({message:"Sender not found"});
    }
    
    if (!receiver) {
      return res.status(404).json({message:"Receiver not found"});
    }

    if (sender.id === receiver.id) {
      return res.status(400).json({message:"Cannot transfer to yourself"});
    }

    const senderwallet = await Wallet.findOne({where:{uid:sender.id}});
    const receiverwallet = await Wallet.findOne({where:{uid:receiver.id}});
    
    if (!senderwallet || !receiverwallet) {
      return res.status(404).json({message:"Wallet not found"});
    }

    const senderbalance = parseFloat(senderwallet.balance);
    const transferAmount = parseFloat(amount);

    // Check sufficient balance
    if (senderbalance < transferAmount) {
      return res.status(400).json({message:"Insufficient balance"});
    }

    const receiverbalance = parseFloat(receiverwallet.balance);
    const newReceiverBalance = receiverbalance + transferAmount;
    const newSenderBalance = senderbalance - transferAmount;

    // Update receiver balance
    await Wallet.update({balance: newReceiverBalance}, {where:{uid:receiver.id}});
    
    // Update sender balance
    await Wallet.update({balance: newSenderBalance}, {where:{uid:sender.id}});

    // Record transaction for receiver
    await Transaction.create({
      type: "Transfer", 
      amount: transferAmount, 
      uid: receiver.id
    });

    // Record transaction for sender (as negative or separate type)
    await Transaction.create({
      type: "Transfer", 
      amount: -transferAmount, 
      uid: sender.id
    });

    res.status(200).json({
      message:`Transfer of ${transferAmount} to ${receiver.email} successful`,
      newBalance: newSenderBalance
    });

  } catch(err) {
    console.error("Transfer error:", err);
    res.status(500).json({ message: "Something went wrong", error: err.message });
  }
});
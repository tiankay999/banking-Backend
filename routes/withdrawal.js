const express = require('express');
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const Wallet = require("../models/wallet");
const Transaction = require("../models/transactions");
const User = require("../models/user");


// withdrawal route


router.post('/', authMiddleware, async (req, res) => {
    uid = req.user.id;
    amount = req.body.amount;
    email = req.user.id;

    try {

        const wallet = await Wallet.findOne({ where: { uid: uid } });
        const mail = await User.findOne({ where: { email: email } })
        if (wallet || mail) {
            const balance = wallet.balance;
            if (amount > balance) {
                res.status(401).json({ message: "You have Insufficent Balance" })
            }
            const withdraw = balance - amount;

            const update = Wallet.update({ balance: withdraw }, { where: { uid: uid } });

            if (update) {
                type = "Withdrawal"
                const trans = Transaction.create({ type, amount, uid })
                if (trans) {
                    res.status(200).json({ message: `You have Successfully Withdrawed ${amount}` })

                }

            } else {
                res.status(401).json({ message: " Something Went wrong" })
            }
            if (amount > balance) {
                res.status(401).json({ message: "Insufficient Funds" })
            }



        }
    }
    catch (err) {
        console.error("Withdrawal error:", err);
        res.status(500).json({ message: "Something went wrong", error: err.message });
    }
});

module.exports = router;

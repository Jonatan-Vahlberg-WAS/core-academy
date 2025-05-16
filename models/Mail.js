const mongoose = require("mongoose");

const mailSchema = new mongoose.Schema({
    subject: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ["pending", "cancelled"],
        default: "pending"
    },
    content: {
        type: String,
        required: true
    },
    sentAt: {
        type: Date,
        default: Date.now
    },
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
});

const Mail = mongoose.model("Mail", mailSchema);

module.exports = Mail;
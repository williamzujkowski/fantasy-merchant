const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    cart: [
        {
            itemId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Item'
            },
            quantity: {
                type: Number,
                default: 1
            }
        }
    ]
});

module.exports = mongoose.model('User', userSchema);
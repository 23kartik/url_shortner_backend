const mongoose = require('mongoose')

const urlSchema= new mongoose.Schema({
    originalUrl: { type: String, required: true },
    shortCode: { type: String, required: true, unique: true },
    shortUrl: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date },
    password: { type: String } 

});

module.exports = mongoose.model('Url', urlSchema);
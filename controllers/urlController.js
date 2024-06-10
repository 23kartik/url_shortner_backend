const asynHandler= require('express-async-handler')
const Url = require('../models/Url');
const shortid = require('shortid');
const bcrypt=require('bcrypt')

const shortenUrl=asynHandler(async(req,res)=>{
    const { originalUrl, customCode, expiresAt, password } = req.body;    
    
    try {
        let shortCode;

if(customCode){
    const existingUrl = await Url.findOne({ shortCode: customCode });
    if (existingUrl) {
        return res.status(400).json({ error: 'Custom code already exists' });
    }
    shortCode=customCode;
}
else{
    const shortCode=shortid.generate(); 
}
const shortUrl = `http://localhost:${process.env.PORT}/${shortCode}`;

const url = new Url({
    originalUrl,
    shortCode,
    shortUrl,
    expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    password: password ? await bcrypt.hash(password, 10) : undefined
});

await url.save();


        res.status(201).json(url);
    } catch (error) {
        console.error('Error shortening URL:', error);
        res.status(500).json({ error: 'Server error' });
    }

});

const redirectUrl=asynHandler(async(req,res)=>{

    const { shortCode } = req.params;
    const { password } = req.query;

    try {
        const url = await Url.findOne({ shortCode });

        if (!url) {
            return res.status(404).json({ error: 'URL not found' });
        }

        if (url.expiresAt && new Date() > new Date(url.expiresAt)) {
            return res.status(410).json({ error: 'URL has expired' });
        }
        if (url.password) {
            if (!password || !(await bcrypt.compare(password, url.password))) {
                return res.status(401).json({ error: 'Invalid password' });
            }
        }

        res.redirect(url.originalUrl);
    } catch (error) {
        console.error('Error redirecting URL:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports={shortenUrl,redirectUrl};
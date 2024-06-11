const asyncHandler = require('express-async-handler');
const Url = require('../models/Url');
const shortid = require('shortid');
const qrcode = require('qrcode');
const bcrypt = require('bcrypt');

// Shorten URL Controller
const shortenUrl = asyncHandler(async (req, res) => {
    const { originalUrl, customCode, expiresAt, password } = req.body;

    try {
        let shortCode;
        if (customCode) {
            // Check if the custom code already exists
            const existingUrl = await Url.findOne({ shortCode: customCode });
            if (existingUrl) {
                return res.status(400).json({ error: 'Custom code already exists' });
            }
            shortCode = customCode;
        } else {
            shortCode = shortid.generate();
        }

        const shortUrl = `http://localhost:${process.env.PORT}/${shortCode}`;
        const hashedPassword = password ? await bcrypt.hash(password, 10) : undefined;

        const url = new Url({
            originalUrl,
            shortCode,
            shortUrl,
            expiresAt: expiresAt ? new Date(expiresAt) : undefined,
            password: hashedPassword
        });

        await url.save();

        // Generate QR code
        const qrCode = await qrcode.toDataURL(shortUrl);

        res.status(201).json({ url, qrCode });
    } catch (error) {
        console.error('Error shortening URL:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET request handler
const redirectUrl = asyncHandler(async (req, res) => {
    const { shortCode } = req.params;
    try {
        const url = await Url.findOne({ shortCode });
        if (!url) {
            return res.status(404).json({ error: 'URL not found' });
        }

        if (url.expiresAt && new Date() > new Date(url.expiresAt)) {
            return res.status(410).json({ error: 'URL has expired' });
        }

        if (url.password) {
            return res.send(`
                <html>
                    <body>
                        <form action="/${shortCode}" method="post">
                            <input type="password" name="password" placeholder="Enter password" required />
                            <button type="submit">Submit</button>
                        </form>
                    </body>
                </html>
            `);
        }

        res.redirect(url.originalUrl);
    } catch (error) {
        console.error('Error redirecting URL:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

const bulkShortenUrls=asyncHandler(async(req,res)=>{
    const urls=req.body.urls;
    if(!Array.isArray(urls)||urls.length===0)
     return res.status(400).json({error:'No Url Provided'});

     try {
        const shortenedUrls=await Promise.all(urls.map(async (urlData)=>{
            const { originalUrl, customCode, expiresAt, password } = urlData;
            let shortCode;
            if(customCode){
                const existingUrl=await Url.findOne({shortCode:customCode});
                if (existingUrl) {
                    throw new Error(`Custom code ${customCode} already exists`);
                }
                shortCode = customCode;
            }
            else {
                shortCode = shortid.generate();
            }
            const shortUrl = `http://localhost:${process.env.PORT}/${shortCode}`;
            const hashedPassword = password ? await bcrypt.hash(password, 10) : undefined;

            const url = new Url({
                originalUrl,
                shortCode,
                shortUrl,
                expiresAt: expiresAt ? new Date(expiresAt) : undefined,
                password: hashedPassword
            });

            await url.save();

            const qrCode = await qrcode.toDataURL(shortUrl);
            return { url, qrCode };
        }));
        res.status(201).json(shortenedUrls);
     } catch (error) {
        console.error('Error bulk shortening URLs:', error);
        res.status(500).json({ error: error.message || 'Server error' });

     }
})

// POST request handler for password submission
const handlePostRedirect = asyncHandler(async (req, res) => {
    const { shortCode } = req.params;
    const { password } = req.body;

    try {
        const url = await Url.findOne({ shortCode });

        if (!url) {
            return res.status(404).json({ error: 'URL not found' });
        }

        if (url.expiresAt && new Date() > new Date(url.expiresAt)) {
            return res.status(410).json({ error: 'URL has expired' });
        }

        if (url.password && !(await bcrypt.compare(password, url.password))) {
            return res.status(401).json({ error: 'Invalid password' });
        }

        res.redirect(url.originalUrl);
    } catch (error) {
        console.error('Error redirecting URL:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = { shortenUrl,bulkShortenUrls, redirectUrl, handlePostRedirect };

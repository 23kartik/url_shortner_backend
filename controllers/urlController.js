const asyncHandler = require('express-async-handler');
const Url = require('../models/Url');
const shortid = require('shortid');
const qrcode = require('qrcode');
const bcrypt = require('bcrypt');
const redisClient = require('../config/redisClient'); // Import Redis client

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

        const shortUrl = `https://url-shortner-backend-xnt3.onrender.com/${shortCode}`;
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

        await redisClient.set(shortCode, JSON.stringify(url), {
            EX: 60 * 60 * 24 // Set expiration time (e.g., 1 day)
        });


        res.status(201).json({ url, qrCode });
    } catch (error) {
        console.error('Error shortening URL:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET request handler for redirection
const redirectUrl = asyncHandler(async (req, res) => {
    const { shortCode } = req.params;
    try {

         const cachedUrl = await redisClient.get(shortCode);
        if (cachedUrl) {
            console.log("cache hit");
            const url = JSON.parse(cachedUrl);
            if (url.password) {
                return res.send(`
                <html>
                <head>
                    <style>
                        body {
                            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            height: 100vh;
                            margin: 0;
                            background: url('https://source.unsplash.com/random/1600x900?dark,abstract') no-repeat center center fixed;
                            background-size: cover;
                            position: relative;
                            overflow: hidden;
                            color: #ffffff;
                        }
                        .overlay {
                            position: absolute;
                            top: 0;
                            left: 0;
                            right: 0;
                            bottom: 0;
                            background: rgba(0, 0, 0, 0.85);
                            backdrop-filter: blur(10px);
                            z-index: 1;
                        }
                        .container {
                            position: relative;
                            z-index: 2;
                            background: rgba(30, 30, 30, 0.95);
                            padding: 40px;
                            border-radius: 10px;
                            box-shadow: 0 8px 16px rgba(0, 0, 0, 0.6);
                            text-align: center;
                            max-width: 400px;
                            width: 100%;
                            color: #ffffff;
                        }
                        .container h1 {
                            margin-bottom: 20px;
                            font-size: 24px;
                            font-weight: bold;
                            color: #ff6b6b;
                            text-transform: uppercase;
                            letter-spacing: 1.2px;
                        }
                        .container p {
                            font-size: 16px;
                            margin-bottom: 30px;
                            color: #bbbbbb;
                        }
                        input[type="password"] {
                            width: 100%;
                            padding: 15px;
                            margin: 20px 0;
                            border: none;
                            border-radius: 5px;
                            background: #555;
                            color: #ffffff;
                            font-size: 16px;
                            box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.5);
                            outline: none;
                        }
                        input[type="password"]::placeholder {
                            color: #aaaaaa;
                        }
                        button {
                            background-color: #ff6b6b;
                            color: #ffffff;
                            padding: 12px 20px;
                            border: none;
                            border-radius: 5px;
                            cursor: pointer;
                            font-size: 16px;
                            font-weight: bold;
                            text-transform: uppercase;
                            transition: background-color 0.3s ease, transform 0.3s ease;
                        }
                        button:hover {
                            background-color: #ff4c4c;
                            transform: translateY(-2px);
                        }
                    </style>
                </head>
                <body>
                    <div class="overlay"></div>
                    <div class="container">
                        <h1>Secure Access</h1>
                        <p>Please enter the password to proceed</p>
                        <form action="/${shortCode}" method="post">
                            <input type="password" name="password" placeholder="Enter password" required />
                            <button type="submit">Submit</button>
                        </form>
                    </div>
                </body>
            </html>
            
                `);
            }
            return res.redirect(url.originalUrl);
        }
        console.log("cache miss");
         const url = await Url.findOne({ shortCode });
            if (!url) {
                return res.status(404).json({ error: 'URL not found' });
            }

            if (url.expiresAt && new Date() > new Date(url.expiresAt)) {
                return res.status(410).json({ error: 'URL has expired' });
            }
 await redisClient.set(shortCode, JSON.stringify(url), {
            EX: 60 * 60 * 24 // Set expiration time (e.g., 1 day)
        });
            if (url.password) {
                return res.send(`
                <html>
                <head>
                    <style>
                        body {
                            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            height: 100vh;
                            margin: 0;
                            background: url('https://source.unsplash.com/random/1600x900?dark,abstract') no-repeat center center fixed;
                            background-size: cover;
                            position: relative;
                            overflow: hidden;
                            color: #ffffff;
                        }
                        .overlay {
                            position: absolute;
                            top: 0;
                            left: 0;
                            right: 0;
                            bottom: 0;
                            background: rgba(0, 0, 0, 0.85);
                            backdrop-filter: blur(10px);
                            z-index: 1;
                        }
                        .container {
                            position: relative;
                            z-index: 2;
                            background: rgba(30, 30, 30, 0.95);
                            padding: 40px;
                            border-radius: 10px;
                            box-shadow: 0 8px 16px rgba(0, 0, 0, 0.6);
                            text-align: center;
                            max-width: 400px;
                            width: 100%;
                            color: #ffffff;
                        }
                        .container h1 {
                            margin-bottom: 20px;
                            font-size: 24px;
                            font-weight: bold;
                            color: #ff6b6b;
                            text-transform: uppercase;
                            letter-spacing: 1.2px;
                        }
                        .container p {
                            font-size: 16px;
                            margin-bottom: 30px;
                            color: #bbbbbb;
                        }
                        input[type="password"] {
                            width: 100%;
                            padding: 15px;
                            margin: 20px 0;
                            border: none;
                            border-radius: 5px;
                            background: #555;
                            color: #ffffff;
                            font-size: 16px;
                            box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.5);
                            outline: none;
                        }
                        input[type="password"]::placeholder {
                            color: #aaaaaa;
                        }
                        button {
                            background-color: #ff6b6b;
                            color: #ffffff;
                            padding: 12px 20px;
                            border: none;
                            border-radius: 5px;
                            cursor: pointer;
                            font-size: 16px;
                            font-weight: bold;
                            text-transform: uppercase;
                            transition: background-color 0.3s ease, transform 0.3s ease;
                        }
                        button:hover {
                            background-color: #ff4c4c;
                            transform: translateY(-2px);
                        }
                    </style>
                </head>
                <body>
                    <div class="overlay"></div>
                    <div class="container">
                        <h1>Secure Access</h1>
                        <p>Please enter the password to proceed</p>
                        <form action="/${shortCode}" method="post">
                            <input type="password" name="password" placeholder="Enter password" required />
                            <button type="submit">Submit</button>
                        </form>
                    </div>
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

// Bulk Shorten URLs Controller
const bulkShortenUrls = asyncHandler(async (req, res) => {
    const urls = req.body.urls;
    if (!Array.isArray(urls) || urls.length === 0) {
        return res.status(400).json({ error: 'No URLs provided' });
    }

    try {
        const shortenedUrls = await Promise.all(urls.map(async (urlData) => {
            const { originalUrl, customCode, expiresAt, password } = urlData;
            let shortCode;

            if (customCode) {
                const existingUrl = await Url.findOne({ shortCode: customCode });
                if (existingUrl) {
                    throw new Error(`Custom code ${customCode} already exists`);
                }
                shortCode = customCode;
            } else {
                shortCode = shortid.generate();
            }

            const shortUrl = `https://url-shortner-backend-xnt3.onrender.com/${shortCode}`;
            const hashedPassword = password ? await bcrypt.hash(password, 10) : undefined;

            const url = new Url({
                originalUrl,
                shortCode,
                shortUrl,
                expiresAt: expiresAt ? new Date(expiresAt) : undefined,
                password: hashedPassword
            });

            await url.save();
            await redisClient.set(shortCode, JSON.stringify(url), {
                EX: 60 * 60 * 24 // Set expiration time (e.g., 1 day)
            });
            const qrCode = await qrcode.toDataURL(shortUrl);


            return { url, qrCode };
        }));

        res.status(201).json(shortenedUrls);
    } catch (error) {
        console.error('Error bulk shortening URLs:', error);
        res.status(500).json({ error: error.message || 'Server error' });
    }
});

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

module.exports = { shortenUrl, bulkShortenUrls, redirectUrl, handlePostRedirect };

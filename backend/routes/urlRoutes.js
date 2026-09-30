const express = require('express');
const router = express.Router();
const { readUrls, writeUrls } = require('../utils/fileStore');

function isValidUrl(url){
    try{
        const parsedUrl = new URL(url);
        return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
    }catch(err){
        return false;
    }
}

function generateShortCode(length=6){
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let shortCode = ''; 
    for(let i = 0; i < length; i++){
        shortCode += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return shortCode;
}

function generateUniqueShortCode(existingUrls){
    const existingShortCodes = new Set(existingUrls.map(url => url.short_code));
    let shortCode;
    do{
        shortCode = generateShortCode();
    }while (existingShortCodes.has(shortCode));
    return shortCode;
}

router.post('/shorten',async (req,res)=>{
    try{
        const {originalUrl: rawUrl} = req.body;
        const originalUrl = rawUrl?.trim();
        if(!originalUrl){
            return res.status(400).send('Required Original url');
        }

        if(!isValidUrl(originalUrl)){
            return res.status(400).send('Invalid Url');
        }

        const urls = await readUrls();
        const existingUrl = urls.find((item)=> item.original_url===originalUrl);
        if(existingUrl){
            const short_url = `${req.protocol}://${req.host}/api/${existingUrl.short_code}`;
            return res.status(200).json({'message': 'Url already exists',
                data: {...existingUrl, short_url}
            })
        }

        const short_code = generateUniqueShortCode(urls);
        const newId = urls.length > 0 ? Math.max(...urls.map(url => url.id)) + 1 : 1;
        const newUrlEntry = {
            id: newId,
            original_url: originalUrl,
            short_code: short_code,
            clicks: 0,
            created_at: new Date().toISOString()
        };

        const updatedUrls = [...urls, newUrlEntry];
        await writeUrls(updatedUrls);
        const short_url = `${req.protocol}://${req.host}/api/${short_code}`;
        res.status(201).json({
            message: 'Url shortened successfully',
            data: {...newUrlEntry, short_url}
        });
    }catch(err){
        console.error("Error in shortening url ",err);
        res.status(500).send('Could not shorten the url');
    }
});

router.get('/urls', async (req,res)=>{
    try{
        const urls = await readUrls();
        const urlsWithShortUrl = urls.map(url => ({
            ...url,
            short_url: `${req.protocol}://${req.host}/api/${url.short_code}`
        }));
        res.status(200).json({
            message: 'urls fetched successfully',
            data: urlsWithShortUrl
        });
    }catch(err){
        console.error("Error in fetching urls ",err);
        res.status(500).send('Could not fetch the urls');
    }
});

router.get('/:shortCode', async (req,res)=>{
    try{
        const {shortCode} = req.params;
        if(!shortCode){
            return res.status(400).send('Required Short Code');
        }

        const urls = await readUrls();
        const urlEntry = urls.find((item)=> item.short_code===shortCode);
        if(!urlEntry){
            return res.status(404).send('Short Code not found');
        }

        urlEntry.clicks += 1;
        await writeUrls(urls);
        return res.redirect(urlEntry.original_url);
    }catch(err){
        console.error("Error in redirecting url ",err);
        res.status(500).send('Could not redirect the url');
    }
});

router.delete('/:id', async (req,res)=>{
    try{
        const id = Number(req.params.id);
        const urls = await readUrls();
        const remainingUrls = urls.filter((item) => item.id !== id);
        if (remainingUrls.length === urls.length) {
            return res.status(404).json({ message: "URL not found." });
        }
        await writeUrls(remainingUrls);
        res.status(200).json({ message: "URL deleted successfully." });
    }catch(err){
        console.error("Error in deleting url ",err);
        res.status(500).send('Unable to delete the url');    
    }
});

module.exports = router;
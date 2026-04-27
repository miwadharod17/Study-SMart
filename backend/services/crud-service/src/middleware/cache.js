const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 300 }); // 5 minutes default

exports.cacheMiddleware = (duration = 300) => {
    return (req, res, next) => {
        const key = `__express__${req.originalUrl || req.url}`;
        const cachedBody = cache.get(key);
        
        if (cachedBody) {
            return res.send(cachedBody);
        }
        
        res.sendResponse = res.send;
        res.send = (body) => {
            cache.set(key, body, duration);
            res.sendResponse(body);
        };
        next();
    };
};

exports.clearCache = (pattern) => {
    const keys = cache.keys();
    keys.forEach(key => {
        if (key.includes(pattern)) {
            cache.del(key);
        }
    });
};
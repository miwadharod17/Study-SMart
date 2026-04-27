exports.validateQuestion = (req, res, next) => {
    const { title, content } = req.body;
    
    if (!title || title.length < 10) {
        return res.status(400).json({ error: 'Title must be at least 10 characters' });
    }
    
    if (!content || content.length < 20) {
        return res.status(400).json({ error: 'Content must be at least 20 characters' });
    }
    
    next();
};

exports.validateAnswer = (req, res, next) => {
    const { content } = req.body;
    
    if (!content || content.length < 10) {
        return res.status(400).json({ error: 'Answer must be at least 10 characters' });
    }
    
    next();
};
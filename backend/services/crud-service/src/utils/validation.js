exports.validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};

exports.validatePassword = (password) => {
    return password && password.length >= 6;
};

exports.validatePrice = (price) => {
    return price && !isNaN(price) && price > 0;
};

exports.validateBookData = (data) => {
    const errors = [];
    
    if (!data.title || data.title.length < 3) {
        errors.push('Title must be at least 3 characters');
    }
    
    if (!data.price || data.price <= 0) {
        errors.push('Price must be greater than 0');
    }
    
    if (!data.category) {
        errors.push('Category is required');
    }
    
    return errors;
};
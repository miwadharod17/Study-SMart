exports.formatCurrency = (amount, currency = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: currency
    }).format(amount);
};

exports.generateSlug = (text) => {
    return text
        .toLowerCase()
        .replace(/[^\w ]+/g, '')
        .replace(/ +/g, '-');
};

exports.truncateText = (text, length = 100) => {
    if (text.length <= length) return text;
    return text.substring(0, length) + '...';
};

exports.paginate = (page, limit, total) => {
    const currentPage = parseInt(page) || 1;
    const perPage = parseInt(limit) || 20;
    const totalPages = Math.ceil(total / perPage);
    
    return {
        currentPage,
        perPage,
        totalPages,
        total,
        hasNext: currentPage < totalPages,
        hasPrev: currentPage > 1
    };
};
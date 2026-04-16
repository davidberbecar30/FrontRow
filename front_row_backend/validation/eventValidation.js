const { body, validationResult } = require('express-validator')


const eventValidationRules = [
    body('title')
        .notEmpty().withMessage('Title is required')
        .isString().withMessage('Title must be a string')
        .isLength({ min: 3 }).withMessage('Title must be at least 3 characters'),

    body('description')
        .notEmpty().withMessage('Description is required')
        .isString().withMessage('Description must be a string'),

    body('category')
        .notEmpty().withMessage('Category is required')
        .isString().withMessage('Category must be a string'),

    body('price')
        .notEmpty().withMessage('Price is required')
        .isNumeric().withMessage('Price must be a number')
        .custom(value => value > 0).withMessage('Price must be greater than 0'),

    body('availableTickets')
        .notEmpty().withMessage('Available tickets is required')
        .isNumeric().withMessage('Available tickets must be a number')
        .custom(value => value > 0).withMessage('Available tickets must be greater than 0'),

    body('dates')
        .notEmpty().withMessage('Dates are required')
        .isArray({ min: 1 }).withMessage('Dates must be an array with at least one entry'),

    body('dates.*.date')
        .notEmpty().withMessage('Each date entry must have a date')
        .matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Date must be in YYYY-MM-DD format'),

    body('dates.*.location')
        .notEmpty().withMessage('Each date entry must have a location')
        .isString().withMessage('Location must be a string'),

    body('dates.*.venue')
        .notEmpty().withMessage('Each date entry must have a venue')
        .isString().withMessage('Venue must be a string'),
]


const validate = (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }
    next()
}

module.exports = { eventValidationRules, validate }
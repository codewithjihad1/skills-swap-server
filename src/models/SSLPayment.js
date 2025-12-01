const mongoose = require('mongoose');

const paymentSchemaSSL = new mongoose.Schema(
    {
        tran_id: {
            type: String,
            required: true,
            unique: true,
        },
        amount: {
            type: Number,
            required: true,
        },
        currency: {
            type: String,
            default: 'BDT',
        },
        status: {
            type: String,
            enum: ['PENDING', 'SUCCESS', 'FAILED', 'CANCELLED'],
            default: 'PENDING',
        },
        customer: {
            name: String,
            email: String,
            phone: String,
            address: String,
            city: String,
            country: String,
        },
        shipping: {
            name: String,
            address: String,
            city: String,
            country: String,
        },
        ssl_response: {
            type: Object,
            default: {},
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchemaSSL);

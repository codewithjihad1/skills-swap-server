const SSLCommerzPayment = require('sslcommerz-lts');
const { ObjectId } = require('mongodb');
const store_id = 'skill692d626845e29';
const store_passwd = 'skill692d626845e29@ssl';
const is_live = false;

//sslcommerz init
const SSLPaymentInit = (req, res) => {
    const { price } = req.body;
    const trxId = new ObjectId();

    const data = {
        total_amount: price,
        currency: 'BDT',
        tran_id: trxId,
        success_url: 'http://localhost:3030/success',
        fail_url: 'http://localhost:3030/fail',
        cancel_url: 'http://localhost:3030/cancel',
        ipn_url: 'http://localhost:3030/ipn',
        shipping_method: 'Courier',
        product_name: 'Computer.',
        product_category: 'Electronic',
        product_profile: 'general',
        cus_name: 'Customer Name',
        cus_email: 'customer@example.com',
        cus_add1: 'Dhaka',
        cus_add2: 'Dhaka',
        cus_city: 'Dhaka',
        cus_state: 'Dhaka',
        cus_postcode: '1000',
        cus_country: 'Bangladesh',
        cus_phone: '01711111111',
        cus_fax: '01711111111',
        ship_name: 'Customer Name',
        ship_add1: 'Dhaka',
        ship_add2: 'Dhaka',
        ship_city: 'Dhaka',
        ship_state: 'Dhaka',
        ship_postcode: 1000,
        ship_country: 'Bangladesh',
    };
    const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);
    sslcz.init(data).then((apiResponse) => {
        // Redirect the user to payment gateway
        let GatewayPageURL = apiResponse.GatewayPageURL;
        res.redirect(GatewayPageURL);
        console.log('Redirecting to: ', GatewayPageURL);
    });
};

module.exports = { SSLPaymentInit };

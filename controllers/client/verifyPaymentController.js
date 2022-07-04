'use strict';

const eventData = require('../../data/events/client');
const crypto = require('crypto');
const dotenv = require('dotenv');
dotenv.config();

const Razorpay = require('razorpay');
const e = require('cors');
var instance = new Razorpay({
    'key_id': "rzp_test_4QxJ2ZJcCKwl8I",
    'key_secret': "M9NmsM6MelTqHxmSashsnmDo"
});

const verifyPayment = async (req,res,next) => {
    try {
        let keyCheck = req.body.order_id + "|" + req.body.payment_id;

        let expectedSignature = crypto.createHmac('sha256', process.env.KEY_SECRECT)
                                        .update(keyCheck.toString())
                                        .digest('hex');

        if(expectedSignature === req.body.payment_signature){
            const result = await eventData.updateOrderDetails(req.body);
            if(result === 1){
                try{
                    const orderDetails = await eventData.getOrderDetails(req.body.order_id);
                    if(orderDetails.length > 0){
                        const shippingDetails = await eventData.getShippingDetails({"order_id":req.body.order_id});
                        if(shippingDetails.length > 0){
                            const productDetails = await eventData.getProductWithID(orderDetails[0].product_id);
                            if(productDetails.length > 0){
                                let res = instance.invoices.create({
                                    "type": "invoice",
                                    "description": "Invoice for your order on Srizon Stores",
                                    "partial_payment": false,
                                    "customer": {
                                        "name": shippingDetails[0].email,
                                        "contact": shippingDetails[0].mobile,
                                        "email": shippingDetails[0].email,
                                        "billing_address": {
                                            "line1": shippingDetails[0].address,
                                            "line2": shippingDetails[0].address,
                                            "zipcode": shippingDetails[0].zip,
                                            "city": shippingDetails[0].city,
                                            "state": shippingDetails[0].state,
                                            "country": shippingDetails[0].country
                                        },
                                        "shipping_address": {
                                            "line1": shippingDetails[0].address,
                                            "line2": shippingDetails[0].address,
                                            "zipcode": shippingDetails[0].zip,
                                            "city": shippingDetails[0].city,
                                            "state": shippingDetails[0].state,
                                            "country": shippingDetails[0].country
                                        }
                                    },  
                                    "line_items": [
                                        {
                                            "name": productDetails[0].name,
                                            "description": productDetails[0].desc,
                                            "amount": orderDetails[0].total,
                                            "currency": "INR",
                                            "quantity": orderDetails[0].quantity
                                        }
                                    ],
                                    "sms_notify": 1,
                                    "email_notify": 1,
                                    "currency": "INR",
                                })
                                console.log('Invoice Response : ',res);
                            }
                        }
                    }
                } catch (error) {
                    res.send({"signatureIsValid":true});
                    console.log(error);
                }
                res.send({"signatureIsValid":true});
            }else{
                res.send({"signatureIsValid":false});
            }
        }else{
            res.send({"signatureIsValid":false});
        }
    } catch (error) {
        res.status(422).send({
            status: 422,
            message: error.message,
        });
    }
}

module.exports = {
    verifyPayment
}
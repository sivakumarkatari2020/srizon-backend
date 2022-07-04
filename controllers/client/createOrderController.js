'use strict';

const dotenv = require('dotenv');
dotenv.config();

const eventData = require('../../data/events/client');

const Razorpay = require('razorpay');
var instance = new Razorpay({
    key_id: 'rzp_test_4QxJ2ZJcCKwl8I',
    key_secret: 'M9NmsM6MelTqHxmSashsnmDo',
});

const createOrder = async (req,res,next) => {
    try{
        const params = req.body;
        //const createOrder = await eventData.createOrder(params);
        const getProductDetails = await eventData.getProductWithID(Number(params.product_id));

        if(getProductDetails.length > 0){
            
            for(let i=0;i<getProductDetails.length;i++){

                if(getProductDetails[i].category_id !== null){
                    const getCategoryDetails = await eventData.getCategoryWithID(getProductDetails[i].category_id);
                    getProductDetails[i].category_details = getCategoryDetails[0];
                }

                if(getProductDetails[i].inventory_id !== null){
                    const getInventoryDetails = await eventData.getInventoryWithID(getProductDetails[i].inventory_id);
                    getProductDetails[i].inventory_details = getInventoryDetails[0];
                }

            }

            if(getProductDetails[0].inventory_details !== undefined){
                if(getProductDetails[0].inventory_details.quantity >= Number(params.quantity)){
                    const updateInventoryQuantity = await eventData.updateInventoryQuantity({
                                                        'id':getProductDetails[0].inventory_details.id,
                                                        'quantity':getProductDetails[0].inventory_details.quantity - Number(params.quantity)
                                                    })
                    if(updateInventoryQuantity === 1){
                        try{
                            console.log('Create orderId request',);
                            var options = {
                                amount: getProductDetails[0].d_price * Number(params.quantity) * 100,
                                currency: 'INR',
                                receipt: 'order_rcptid_11'
                            };
                            instance.orders.create(options, async function(err,order) {
                                try{
                                    let values = {...params.values,'order_id':order.id,'status':order.status,'created_at':order.created_at,'tot_amount':order.amount}
                                
                                    let shippingDetails = {
                                        'order_id' : values.order_id,
                                        'quantity' : Number(params.quantity),
                                        'email' : values.email,
                                        'mobile' : values.mobile,
                                        'country' : values.country,
                                        'state' : values.state,
                                        'zip' : values.zip,
                                        'address' : values.address
                                    }
                                    const addShippingDetails = await eventData.addShippingDetails(shippingDetails);
                                    if(addShippingDetails === 0){
                                        const restoreQuantity = await eventData.restoreQuantity({'inventory_id':getProductDetails[0].inventory_id,'units':Number(params.quantity)});
                                        if(restoreQuantity.status !== 200){
                                            res.send({status:422,message:'Unable to update shipping details,contact admin, Error in restoring quantity'});
                                        }else{
                                            res.send({status:422,message:'Unable to update shipping details,contact admin, Quantity restored!!'});
                                        }
                                    }else{
                                        let trackDetails = {
                                            'order_id' : values.order_id,
                                            'status' : values.status,
                                        }
                                        const addTrackOrderDetails = await eventData.addTrackOrderDetails(trackDetails);
                                        if(addShippingDetails === 0){
                                            const restoreQuantity = await eventData.restoreQuantity({'inventory_id':getProductDetails[0].inventory_id,'units':Number(params.quantity)});
                                            if(restoreQuantity.status !== 200){
                                                res.send({status:422,message:'Unable to update Track Order details,contact admin, Error in restoring quantity'});
                                            }else{
                                                res.send({status:422,message:'Unable to update Track Order details,contact admin, Quantity restored!!'});
                                            }
                                        }else{
                                            let orderDetails = {
                                                'user_id':Number(params.user_id),
                                                'product_id':Number(params.product_id),
                                                'order_id':values.order_id,
                                                'total': Number(values.tot_amount),
                                                'quantity': Number(params.quantity),
                                                'status': values.status,
                                                'track_id': addTrackOrderDetails,
                                                'shipping_id': addShippingDetails
                                            }
                                            const addOrderDetails = await eventData.addOrderDetails(orderDetails);
                                            if(addOrderDetails === 0){
                                                const restoreQuantity = await eventData.restoreQuantity({'inventory_id':getProductDetails[0].inventory_id,'units':Number(params.quantity)});
                                                if(restoreQuantity.status !== 200){
                                                    res.send({status:422,message:'Unable to update Order details,contact admin, Error in restoring quantity'});
                                                }else{
                                                    res.send({status:422,message:'Unable to update Order details,contact admin, Quantity restored!!'});
                                                }
                                            }else{
                                                res.send({status:200,message:'Order details updated successfully!!','order_id':values.order_id,'amount':values.tot_amount});
                                            }
                                        }
                                    }
                                } catch (error) {
                                    const restoreQuantity = await eventData.restoreQuantity({'inventory_id':getProductDetails[0].inventory_id,'units':Number(params.quantity)});
                                    if(restoreQuantity.status !== 200){
                                        res.send({status:422,message:'Unable to order the product, Error in creating order Id & Error in restoring quantity'});
                                    }else{
                                        res.send({status:422,message:'Unable to order the product, Quantity restored!!'});
                                    }
                                }
                            })
                        } catch (error) {
                            const restoreQuantity = await eventData.restoreQuantity({'inventory_id':getProductDetails[0].inventory_id,'units':Number(params.quantity)});
                            if(restoreQuantity.status !== 200){
                                res.send({status:422,message:'Unable to order the product, Error in creating order Id & Error in restoring quantity'});
                            }else{
                                res.send({status:422,message:'Unable to order the product, Quantity restored!!'});
                            }
                        }
                    }else{
                        res.send({status:422,message:'Unable to order the product,unable to update the Quantity'});
                    }
                }else{
                    res.send({status:422,message:'Unable to order the product,Quantity not available'});
                }
            }else{
                res.send({status:422,message:'Unable to order the product,unclear Product Inventory Details!!'});
            }
        }else{
            res.send({status:422,message:'Unable to order the product,please try later!!'});
        }
    } catch (error) {
        res.status(422).send({
            status:422,
            message: error.message,
        })
    }
}

module.exports = {
    createOrder
}
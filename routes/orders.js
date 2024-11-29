const { Order } = require('../models/order');
const { OrderItem } = require('../models/order-item'); // Ensure this model exists
const express = require('express');
const router = express.Router();

// **GET Orders**
router.get('/', async (req, res) => {
    try {
        const orderList = await Order.find()
            .populate('user', 'name').sort({'dateOrdered' : -1}) // Populate user details
            .populate({
                path: 'orderItems',
                populate: { path: 'product', select: 'name price' }, // Populate product details inside orderItems
            });

        if (!orderList) {
            return res.status(500).json({ success: false });
        }
        res.status(200).send(orderList);
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});


router.get('/:id', async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('user', 'name')// Populate user details
            .populate({path: 'orderItems', populate: {path : 'product', populate: 'category'}});

        if (!order) {
            return res.status(500).json({ success: false });
        }
        res.status(200).send(order);
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// **POST Order**
router.post('/', async (req, res) => {
    try {
        // Create `orderItems` in database and get their IDs
        const orderItemsIds = await Promise.all(req.body.orderItems.map(async (orderItem) => {
            let newOrderItem = new OrderItem({
                quantity: orderItem.quantity,
                product: orderItem.product,
            });

            newOrderItem = await newOrderItem.save();
            return newOrderItem._id;
        }));

        const orderItemsIdsResolved = await orderItemsIds;

        const totalPrices = await Promise.all(orderItemsIdsResolved.map(async (orderItemId) => {
            const orderItem = await OrderItem.findById(orderItemId).populate('prooduct','price');
            const totalPrice = orderItem.product.price * orderItem.quantity;
            return totalPrice;
        }))

        const totalPrice = totalPrices.reduce((a,b) => {a+b},0);

        // Create new order
        let order = new Order({
            orderItems: orderItemsIdsResolved,
            shippingAddress1: req.body.shippingAddress1,
            shippingAddress2: req.body.shippingAddress2,
            city: req.body.city,
            zip: req.body.zip,
            country: req.body.country,
            phone: req.body.phone,
            status: req.body.status,
            totalPrice: totalPrice,
            user: req.body.user,
        });

        order = await order.save();

        if (!order) {
            return res.status(400).send('The order could not be created!');
        }

        res.status(200).send(order);
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.put('/:id',async (req, res)=> {
    const order = await Order.findByIdAndUpdate(
        req.params.id,
        {
            status : req.body.status
        },
        { new: true}
    )

    if(!order)
    return res.status(400).send('the order cannot be created!')

    res.send(order);
})


router.delete('/:id', (req, res)=>{
    Order.findByIdAndRemove(req.params.id).then(async order =>{
        if(order) {
            await order.orderItems.map(async orderItem => {
                await OrderItem.findByIdAndRemove(orderItem)
            })
            return res.status(200).json({success: true, message: 'the order is deleted!'})
        } else {
            return res.status(404).json({success: false , message: "order not found!"})
        }
    }).catch(err=>{
       return res.status(500).json({success: false, error: err}) 
    })
})

router.get('/get/totalsales', async (req, res) => {
    const totalSales = await Order.aggregate([
        { $group: { _id: null, totalSales: { $sum: '$totalPrice' } } }
    ]);

    if (!totalSales) {
        return res.status(400).send('The order sales cannot be generated');
    }

    res.send({ totalSales: totalSales[0]?.totalSales || 0 });
});


router.get(`/get/count`, async (req, res) => {
    
    const orderCount = await Order.countDocuments((count) => count)

    if(!orderCount){
        res.status(500).json({success : false});
    }
    res.send({
        orderCount : orderCount
    });
})

router.get(`/get/userorders/:userid`, async (req, res) => {
    
    const userorderList = await Order.find({user:req.params.userid}).populate({
        path: 'orderItems', populate:{
            path:'product' , populate : {
                path : 'product', populate : 'category'}
            }}).sort({'dateOrdered' : -1});

    if(!userorderList){
        res.status(500).json({success : false});
    }
    res.send(userorderList);

})

module.exports = router;

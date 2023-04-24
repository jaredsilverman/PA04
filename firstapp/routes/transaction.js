/*
  transaction.js -- Router for the Transactions
*/
const express = require('express');
const router = express.Router();
const TransactionItem = require('../models/TransactionItem');

/*
this is a very simple server which maintains a key/value
store using an object where the keys and values are lists of strings

*/

isLoggedIn = (req,res,next) => {
  if (res.locals.loggedIn) {
    next()
  } else {
    res.redirect('/login')
  }
}

// get the value associated to the key
router.get('/transaction/',
  isLoggedIn,
  async (req, res, next) => {
    const show = req.query.show;
    const sort = req.query.sortBy;
    console.log("inside /transaction/");
    console.log(req.user._id);
    let items = await TransactionItem.find({userId:req.user._id})
                                     .sort({date:1, description:1, category:1, amount:1});
    if (sort == "category") {
      items = await TransactionItem.find({userId:req.user._id})
                                   .sort({category:1, date:1, description:1, amount:1});
    } else if (sort == "amount") {
      items = await TransactionItem.find({userId:req.user._id})
                                   .sort({amount:1, category:1, date:1, description:1});
    } else if (sort == "description") {
      items = await TransactionItem.find({userId:req.user._id})
                                   .sort({description:1, amount:1, category:1, date:1});
    }
    res.render('transactions',{items,show});
  }
);

/* add the value in the body to the list associated to the key */
router.post('/transaction',
  isLoggedIn,
  async (req, res, next) => {
    const transaction = new TransactionItem(
      {description:req.body.description,
        amount: req.body.amount,
        category: req.body.category,
        date: req.body.date,
        userId: req.user._id
      })
    await transaction.save();
    res.redirect('/transaction')
  }
);

router.get('/transaction/remove/:itemId',
  isLoggedIn,
  async (req, res, next) => {
    console.log("inside /transaction/remove/:itemId")
    await TransactionItem.deleteOne({_id:req.params.itemId});
    res.redirect('/transaction')
  }
);

router.get('/transaction/edit/:itemId',
  isLoggedIn,
  async (req, res, next) => {
    console.log("inside /transaction/edit/:itemId")
    const item = await TransactionItem.findById(req.params.itemId);
    res.locals.item = item
    res.render('editTransaction')
  }
);

router.post('/transaction/updateTransaction',
  isLoggedIn,
  async (req, res, next) => {
    const {itemId,description,category,amount,date} = req.body;
    console.log("inside /transaction/updateTransaction");
    await TransactionItem.findOneAndUpdate(
      {_id:itemId},
      {$set: {description,amount,category,date}} );
    res.redirect('/transaction')
  }
);

router.get('/transaction/byCategory',
  isLoggedIn,
  async (req, res, next) => {
    console.log(req.user._id);
    let results = await TransactionItem.aggregate([ 
      {$match: {userId:req.user._id}},
      {$group:{
        _id:'$category',
        total:{$sum:'$amount'}
      }},
      {$sort: {_id:1}},
    ]);
    res.render('summarizeByCategory',{results})
});

module.exports = router;
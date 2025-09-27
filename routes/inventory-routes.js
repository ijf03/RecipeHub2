const express = require('express');
const router = express.Router();
const invCont = require('../controllers/inventory-controller');
const {SID} = require('../config/constants')

// LIST
router.get(`/inventory-${SID}`, invCont.list);

// NEW INV
router.get(`/inventory/new-${SID}`, invCont.newForm);
router.post(`/inventory/new-${SID}`, invCont.create);

// VIEW
router.get(`/inventory/view-${SID}/:inventoryId`, invCont.view);

// DELETE
router.post(`/inventory/delete-${SID}/:inventoryId`, invCont.remove);

module.exports = router;

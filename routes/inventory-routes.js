const express = require("express");
const invCont = require("../controllers/inventory-controller");

module.exports = (SID) => {
    const router = express.Router();

    // NEW
    router.get(`/inventory/new-${SID}`, invCont.newForm);
    router.post(`/inventory/create-${SID}`, invCont.create);

    //GET
    router.get(`/inventory/list-${SID}`, invCont.list);
    router.get(`/inventory/view-${SID}/:inventoryId`, invCont.view);

    //PDATE
    router.get(`/inventory/edit-${SID}/:inventoryId`, invCont.editForm);
    router.post(`/inventory/update-${SID}/:inventoryId`, invCont.update);

    // DELETE
    router.post(`/inventory/delete-${SID}/:inventoryId`, invCont.remove);

    return router;
};

const express = require("express");
const userCont = require("../controllers/user-controller");

module.exports = (SID) => {
    
    const router = express.Router();
    //NEW
    router.get(`/users/new-${SID}`, userCont.newForm);
    router.post(`/users/create-${SID}`, userCont.create);

    // GET
    router.get(`/users/list-${SID}`, userCont.list);
    router.get(`/users/view-${SID}/:userId`, userCont.view);

    //EDIT
    router.get(`/users/edit-${SID}/:userId`, userCont.editForm);
    router.post(`/users/update-${SID}/:userId`, userCont.update);

    // DELETE
    router.post(`/users/delete-${SID}/:userId`, userCont.delete);

    return router;
};

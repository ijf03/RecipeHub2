const express = require("express");
const recipeCont = require("../controllers/recipe-controller");

module.exports = (SID) => {
    const router = express.Router();

    // NEW
    router.get(`/recipes/new-${SID}`, recipeCont.newForm);
    router.post(`/recipes/create-${SID}`, recipeCont.create);

    // GET
    router.get(`/recipes/list-${SID}`, recipeCont.list);
    router.get(`/recipes/view-${SID}/:recipeId`, recipeCont.view);

    // UPDATE
    router.get(`/recipes/edit-${SID}/:recipeId`, recipeCont.editForm);
    router.post(`/recipes/update-${SID}/:recipeId`, recipeCont.update);

    // DELETE
    router.post(`/recipes/delete-${SID}/:recipeId`, recipeCont.remove);

    return router;
};

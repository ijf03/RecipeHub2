const User = require('../models/user');
const Recipe = require('../models/recipe');
const Inventory = require('../models/inventory');

exports.getHome = async (req, res) => {
  try {
    const { SID } = req.app.locals;
    const { currentUser, userIdParam } = req;

    const [userCount, recipeCount, inventoryCount] = await Promise.all([
      User.countDocuments(),
      Recipe.countDocuments(),
      Inventory.countDocuments()
    ]);

    res.render('index', {
      pageTitle: 'Home',
      SID,
      currentUser,
      userIdParam,
      userCount,
      recipeCount,
      inventoryCount
    });
  } catch (err) {
    console.error('Error rendering home:', err);
    res.status(500).render('errors/404', {
      pageTitle: 'Error',
      url: req.originalUrl
    });
  }
};

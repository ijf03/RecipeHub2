const User = require('../models/user');
const Recipe = require('../models/recipe');
const Inventory = require('../models/inventory');

exports.getHome = async (req, res) => {
  try {
    const { SID } = req.app.locals;
    const { currentUser, userIdParam } = req;

    // all stats
    const [userCount, recipeCount, inventoryCount] = await Promise.all([
      User.countDocuments(),
      Recipe.countDocuments(),
      Inventory.countDocuments()
    ]);

    // count user's recipes
    const myRecipeCount = currentUser
      ? await Recipe.countDocuments({ userId: currentUser.userId })
      : null;

    res.render('index', {
      pageTitle: 'Home',
      SID,
      currentUser,
      userIdParam,
      userCount,
      recipeCount,
      inventoryCount,
      myRecipeCount
    });
  } catch (err) {
    console.error('Error rendering home:', err);
    res.status(500).render('errors/404', { pageTitle: 'Error', url: req.originalUrl });
  }
};

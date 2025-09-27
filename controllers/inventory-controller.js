const Inventory = require('../models/inventory');

const UNIT_OPTS = Inventory.schema.path('unit')?.enumValues || ['grams','kg','ml','litres','cups','tsp','tbsp','pieces','slices','bunches'];
const CAT_OPTS  = Inventory.schema.path('category')?.enumValues || [
  'Vegetables','Fruits','Dairy','Meat','Seafood','Grains','Baking Supplies','Spices & Herbs',
  'Condiments','Beverages','Snacks','Other'
];
const LOC_OPTS  = Inventory.schema.path('location')?.enumValues || ['Pantry','Fridge','Freezer','Other'];


async function uniqueInventoryId(Model) {
  const count = await Model.countDocuments();
  return `I-${String(count + 1).padStart(5, '0')}`;
}

// GET inventory
exports.list = async (req, res, next) => {
  try {
    const SID = req.app.locals.SID;
    const filters = {
      q: (req.query.q || '').trim(),
      category: req.query.category || '',
      location: req.query.location || '',
      sort: req.query.sort || ''
    };

    const find = {};
    if (filters.q) {
      const rx = new RegExp(filters.q, 'i');
      find.$or = [
        { ingredientName: rx },
        { category: rx },
        { location: rx }
      ];
    }
    if (filters.category) find.category = filters.category;
    if (filters.location) find.location = filters.location;

    let docs = await Inventory.find(find).lean();

    // sort "YYYY-MM-DD"
    if (filters.sort === 'expAsc')  docs.sort((a,b) => String(a.expirationDate||'9999').localeCompare(String(b.expirationDate||'9999')));
    if (filters.sort === 'expDesc') docs.sort((a,b) => String(b.expirationDate||'0000').localeCompare(String(a.expirationDate||'0000')));


    res.render('inventory/inv_list', {
      pageTitle: 'Inventory',
      SID,
      inventory: docs,
      filters,
      F: filters,
      categories: CAT_OPTS,
      locations: LOC_OPTS
    });
  } catch (err) { next(err); }
};

// GET new item
exports.newForm = (req, res) => {
  res.render('inventory/inv_new', {
    pageTitle: 'New Inventory Item',
    SID: req.app.locals.SID,
    form: {},
    error: null,
    units: UNIT_OPTS,
    categories: CAT_OPTS,
    locations: LOC_OPTS
  });
};

// POST new item
exports.create = async (req, res, next) => {
  try {
    const SID = req.app.locals.SID;
    const form = req.body;

    const doc = {
      inventoryId: await uniqueInventoryId(Inventory),
      userId: req.body.userId || 'U-00001',
      ingredientName: form.ingredientName,
      quantity: Number(form.quantity),
      unit: form.unit,
      category: form.category,
      location: form.location,
      purchaseDate: String(form.purchaseDate || '').trim(),
      expirationDate: String(form.expirationDate || '').trim(),
      cost: Number(form.cost || 0),
      createdDate: new Date().toISOString().slice(0,10)
    };

    await Inventory.create(doc);
    res.redirect(`/inventory-${SID}`);
  } catch (err) {
    res.status(400).render('inventory/inv_new', {
      pageTitle: 'New Inventory Item',
      SID: req.app.locals.SID,
      form: req.body,
      error: err.message,
      units: UNIT_OPTS,
      categories: CAT_OPTS,
      locations: LOC_OPTS
    });
  }
};

// GET inv
exports.view = async (req, res, next) => {
  try {
    const doc = await Inventory.findOne({ inventoryId: req.params.inventoryId }).lean();
    if (!doc) {
      return res.status(404).render('errors/404', { pageTitle: 'Not Found', url: req.originalUrl });
    }
    res.render('inventory/inv_view', {
      pageTitle: doc.ingredientName,
      SID: req.app.locals.SID,
      item: doc
    });
  } catch (err) { next(err); }
};

// POST delete inv by id
exports.remove = async (req, res, next) => {
  try {
    const SID = req.app.locals.SID;
    await Inventory.deleteOne({ inventoryId: req.params.inventoryId });
    res.redirect(`/inventory-${SID}`);
  } catch (err) { next(err); }
};

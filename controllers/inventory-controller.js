const Inventory = require('../models/inventory');
const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;
const startOfDay = d => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const toDate = s => (s ? new Date(s) : null);

const UNIT_OPTS = Inventory.schema.path('unit').enumValues;
const CAT_OPTS  = Inventory.schema.path('category').enumValues;
const LOC_OPTS  = Inventory.schema.path('location').enumValues;

//validation errors
function firstError(err) {
  if (!err) return null;
  if (err.code === 11000) return 'Duplicate ID or unique field already exists.';
  if (err.errors) {
    const k = Object.keys(err.errors)[0];
    return err.errors[k]?.message || 'Validation error.';
  }
  return err.message || 'Validation error.';
}

// Compute days left
function annotateExpiry(list) {
  const today = startOfDay(new Date());
  return list.map(i => {
    const exp = toDate(i.expirationDate);
    let daysLeft = null, expSoon = false, expired = false;
    if (exp && !isNaN(exp)) {
      const diffDays = Math.ceil((startOfDay(exp) - today) / (1000*60*60*24));
      daysLeft = diffDays;
      expSoon = diffDays >= 0 && diffDays <= 7;
      expired = diffDays < 0;
    }
    return { ...i, daysLeft, expSoon, expired, _expDate: exp };
  });
}

exports.list = async (req, res) => {
  try {
    const { q = '', category = '', location = '', sort = '' } = req.query;

    const filter = {};
    if (category) filter.category = category;
    if (location) filter.location = location;

    // text search
    let docs = await Inventory.find(filter).lean();

    const norm = v => String(v ?? '').toLowerCase().trim();
    if (q && q.trim()) {
      const needle = norm(q);
      docs = docs.filter(i =>
        [i.ingredientName, i.unit, i.category, i.location, String(i.quantity)]
          .some(v => norm(v).includes(needle))
      );
    }

    let list = annotateExpiry(docs);

    // sort by expiration date (no date = bottom)
    if (sort === 'expAsc' || sort === 'expDesc') {
      const dir = sort === 'expAsc' ? 1 : -1;
      list.sort((a, b) => {
        if (!a._expDate && !b._expDate) return 0;
        if (!a._expDate) return dir;
        if (!b._expDate) return -dir;
        return (a._expDate - b._expDate) * dir;
      });
    }

    res.render('inventory/list', {
      pageTitle: 'Inventory',
      inventory: list,
      filters: { q, category, location, sort },
      categories: CAT_OPTS,
      locations: LOC_OPTS
    });
  } catch (err) {
    res.status(500).render('errors/404', { pageTitle: 'Error', url: req.originalUrl });
  }
};

// GET inventory
exports.newForm = (req, res) => {
  res.render('inventory/new', {
    pageTitle: 'Add Item',
    form: {},
    error: null,
    units: UNIT_OPTS,
    categories: CAT_OPTS,
    locations: LOC_OPTS
  });
};

// POST inv
exports.create = async (req, res) => {
  const SID = req.app.locals.SID;
  try {
    const {
      ingredientName, quantity, unit, category,
      purchaseDate, expirationDate, location, cost
    } = req.body;

    const inventoryId = makeId('I');

    const doc = new Inventory({
      inventoryId,
      userId: String(req.body.userId || ''),
      ingredientName: String(ingredientName || '').trim(),
      quantity: Number(quantity),
      unit,
      category,
      purchaseDate,
      expirationDate,
      location,
      cost: Number(cost)
    });

    await doc.save();
    res.redirect(`/inventory/list-${SID}`);
  } catch (err) {
    res.status(400).render('inventory/new', {
      pageTitle: 'Add Item',
      error: firstError(err),
      form: req.body,
      units: UNIT_OPTS,
      categories: CAT_OPTS,
      locations: LOC_OPTS
    });
  }
};

// GET inv
exports.view = async (req, res) => {
  try {
    const doc = await Inventory.findOne({ inventoryId: req.params.inventoryId }).lean();
    if (!doc) return res.status(404).render('errors/404', { pageTitle: 'Not Found', url: req.originalUrl });

    const [annotated] = annotateExpiry([doc]);
    res.render('inventory/view', {
      pageTitle: annotated.ingredientName,
      item: annotated
    });
  } catch (err) {
    res.status(500).render('errors/404', { pageTitle: 'Error', url: req.originalUrl });
  }
};

// GET by inv Id
exports.editForm = async (req, res) => {
  try {
    const doc = await Inventory.findOne({ inventoryId: req.params.inventoryId }).lean();
    if (!doc) return res.status(404).render('errors/404', { pageTitle: 'Not Found', url: req.originalUrl });

    res.render('inventory/edit', {
      pageTitle: `Edit ${doc.ingredientName}`,
      form: doc,
      error: null,
      units: UNIT_OPTS,
      categories: CAT_OPTS,
      locations: LOC_OPTS
    });
  } catch (err) {
    res.status(500).render('errors/404', { pageTitle: 'Error', url: req.originalUrl });
  }
};

// POST inv Id
exports.update = async (req, res) => {
  const SID = req.app.locals.SID;
  try {
    const {
      ingredientName, quantity, unit, category,
      purchaseDate, expirationDate, location, cost
    } = req.body;

    const update = {
      ingredientName: String(ingredientName || '').trim(),
      quantity: Number(quantity),
      unit,
      category,
      purchaseDate,
      expirationDate,
      location,
      cost: Number(cost)
    };

    const doc = await Inventory.findOneAndUpdate(
      { inventoryId: req.params.inventoryId },
      update,
      { new: true, runValidators: true }
    );

    if (!doc) return res.status(404).render('errors/404', { pageTitle: 'Not Found', url: req.originalUrl });
    res.redirect(`/inventory/view-${SID}/${doc.inventoryId}`);
  } catch (err) {
    res.status(400).render('inventory/edit', {
      pageTitle: 'Edit Item',
      form: { ...req.body, inventoryId: req.params.inventoryId },
      error: firstError(err),
      units: UNIT_OPTS,
      categories: CAT_OPTS,
      locations: LOC_OPTS
    });
  }
};

//delete inv by id
exports.remove = async (req, res) => {
  const SID = req.app.locals.SID;
  try {
    const result = await Inventory.deleteOne({ inventoryId: req.params.inventoryId });
    if (result.deletedCount === 0) {
      return res.status(404).render('errors/404', { pageTitle: 'Not Found', url: req.originalUrl });
    }
    res.redirect(`/inventory/list-${SID}`);
  } catch (err) {
    res.status(500).render('errors/404', { pageTitle: 'Error', url: req.originalUrl });
  }
};

// simple ID generator
function makeId(prefix) {
  return `${prefix}-${String(Math.floor(Math.random() * 100000)).padStart(5, '0')}`;
}

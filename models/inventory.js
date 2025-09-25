const mongoose = require('mongoose');

const UNITS = ['grams','kg','ml','litres','cups','tsp','tbsp','pieces','slices','bunches'];
const CATEGORIES = [
  'Vegetables','Fruits','Dairy','Meat','Seafood','Grains','Baking Supplies','Spices & Herbs',
  'Condiments','Beverages','Snacks','Other'
];
const LOCATIONS = ['Pantry','Fridge','Freezer','Other'];

const ISO_RE = /^\d{4}-\d{2}-\d{2}$/; // YYYY-MM-DD

const inventorySchema = new mongoose.Schema({
  inventoryId: {
    type: String,
    required: true,
    unique: true,
    match: /^I-\d{5}$/ // I-00001
  },
  userId: {
    type: String,
    default: ''
  },
  ingredientName: {
    type: String,
    required: true,
    minlength: 2,
    trim: true
  },
  quantity: {
    type: Number,
    min: [0.0000001, 'Quantity must be a positive number.'],
    required: true
  },
  unit: {
    type: String,
    enum: UNITS,
    required: true
  },
  category: {
    type: String,
    enum: CATEGORIES,
    required: true
  },
  purchaseDate: {
    type: String,
    required: true,
    validate: {
      validator: (v) => ISO_RE.test(v),
      message: 'purchaseDate must be YYYY-MM-DD.'
    }
  },
  expirationDate: {
    type: String,
    required: true,
    validate: [
      {
        validator: (v) => ISO_RE.test(v),
        message: 'expirationDate must be YYYY-MM-DD.'
      },
      {
        validator: function (v) {
          if (!ISO_RE.test(v) || !ISO_RE.test(this.purchaseDate)) return true;
          return new Date(v) >= new Date(this.purchaseDate);
        },
        message: 'expirationDate cannot be earlier than purchaseDate.'
      }
    ]
  },
  location: {
    type: String,
    enum: LOCATIONS,
    required: true
  },
  cost: {
    type: Number,
    min: [0, 'Cost must be a non-negative number.'],
    required: true
  },
  createdDate: {
    type: String,
    default: () => new Date().toISOString().slice(0, 10)
  }
}, { versionKey: false });

module.exports = mongoose.model('Inventory', inventorySchema);

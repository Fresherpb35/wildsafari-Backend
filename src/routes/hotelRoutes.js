const express = require('express');
const router = express.Router();
const { 
  getAllHotels, 
  createHotel, 
  updateHotel, 
  deleteHotel 
} = require('../controllers/hotelController');

router.get('/', getAllHotels);
router.post('/', createHotel);        // Admin use karega
router.put('/:id', updateHotel);
router.delete('/:id', deleteHotel);

module.exports = router;
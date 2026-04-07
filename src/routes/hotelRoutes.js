const express = require('express');
const router = express.Router();
const { getHotelContent, updateHotelContent } = require('../controllers/hotelController');

router.get('/', getHotelContent);
router.put('/', updateHotelContent);   // or POST if you prefer

module.exports = router;
const { prisma } = require('../config/db');

async function getAllHotels(req, res, next) {
  try {
    const hotels = await prisma.hotel.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }]
    });
    res.json({ success: true, data: hotels });
  } catch (err) {
    next(err);
  }
}

async function createHotel(req, res, next) {
  try {
    const { name, img, tag, desc, sortOrder } = req.body;
    const hotel = await prisma.hotel.create({
      data: { name, img, tag, desc, sortOrder: sortOrder || 0 }
    });
    res.json({ success: true, message: "Hotel created", data: hotel });
  } catch (err) {
    next(err);
  }
}

async function updateHotel(req, res, next) {
  try {
    const { id } = req.params;
    const { name, img, tag, desc, sortOrder, isActive } = req.body;

    const hotel = await prisma.hotel.update({
      where: { id },
      data: { name, img, tag, desc, sortOrder, isActive }
    });
    res.json({ success: true, message: "Hotel updated", data: hotel });
  } catch (err) {
    next(err);
  }
}

async function deleteHotel(req, res, next) {
  try {
    const { id } = req.params;
    await prisma.hotel.delete({ where: { id } });
    res.json({ success: true, message: "Hotel deleted" });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAllHotels, createHotel, updateHotel, deleteHotel };
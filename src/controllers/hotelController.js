const { prisma } = require('../config/db');

// Since there's usually only one hotel record, we'll use upsert logic
async function getHotelContent(req, res, next) {
  try {
    let hotel = await prisma.hotelContent.findFirst();
    if (!hotel) {
      hotel = await prisma.hotelContent.create({
        data: {
          hotelName: "Wildlife Rose Safari Resort",
          description: "",
          contactEmail: "",
          phone: "",
          address: "",
          websiteTitle: "",
          welcomeText: "",
          aboutSection: "",
          images: [],
        }
      });
    }
    res.json({ success: true, data: hotel });
  } catch (err) {
    next(err);
  }
}

async function updateHotelContent(req, res, next) {
  try {
    const data = req.body;

    const hotel = await prisma.hotelContent.upsert({
      where: { id: data.id || 'default' }, // fallback if no id
      update: {
        hotelName: data.hotelName,
        description: data.description,
        contactEmail: data.contactEmail,
        phone: data.phone,
        address: data.address,
        websiteTitle: data.websiteTitle,
        welcomeText: data.welcomeText,
        aboutSection: data.aboutSection,
        images: data.images || [],
      },
      create: {
        hotelName: data.hotelName || "Wildlife Rose Safari Resort",
        description: data.description || "",
        contactEmail: data.contactEmail,
        phone: data.phone,
        address: data.address,
        websiteTitle: data.websiteTitle,
        welcomeText: data.welcomeText,
        aboutSection: data.aboutSection,
        images: data.images || [],
      },
    });

    res.json({ success: true, message: "Hotel content updated", data: hotel });
  } catch (err) {
    next(err);
  }
}

module.exports = { getHotelContent, updateHotelContent };
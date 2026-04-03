// ─── CONTACT CONTROLLER ───────────────────────────────────────────────────────
const { prisma } = require('../config/db');
const email      = require('../config/email');
const logger     = require('../config/logger');

// POST /api/contacts  — public
async function createContact(req, res, next) {
  try {
    const { name, email: userEmail, message } = req.body;

    const contact = await prisma.contact.create({
      data: { name, email: userEmail, message },
    });

    Promise.allSettled([
      email.sendContactConfirmation(contact),
      email.sendContactAlert(contact),
    ]).then(results => {
      results.forEach((r, i) => {
        if (r.status === 'rejected') logger.warn(`Contact email ${i} failed:`, r.reason?.message);
      });
    });

    return res.status(201).json({
      success: true,
      message: "Message received! We'll get back to you within 24 hours.",
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/contacts  — admin
async function getAllContacts(req, res, next) {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const where = status ? { status } : {};

    const [contacts, total] = await Promise.all([
      prisma.contact.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: parseInt(limit) }),
      prisma.contact.count({ where }),
    ]);

    return res.json({
      success: true,
      data:    contacts,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/contacts/:id  — admin
async function getContactById(req, res, next) {
  try {
    const contact = await prisma.contact.findUnique({ where: { id: req.params.id } });
    if (!contact) return res.status(404).json({ success: false, message: 'Contact not found' });
    return res.json({ success: true, data: contact });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/contacts/:id/status  — admin
async function updateContactStatus(req, res, next) {
  try {
    const { status } = req.body;
    const valid = ['UNREAD', 'READ', 'REPLIED'];
    if (!valid.includes(status)) return res.status(422).json({ success: false, message: 'Invalid status' });

    const contact = await prisma.contact.update({ where: { id: req.params.id }, data: { status } });
    return res.json({ success: true, data: contact });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/contacts/:id  — admin
async function deleteContact(req, res, next) {
  try {
    await prisma.contact.delete({ where: { id: req.params.id } });
    return res.json({ success: true, message: 'Contact deleted' });
  } catch (err) {
    next(err);
  }
}

module.exports = { createContact, getAllContacts, getContactById, updateContactStatus, deleteContact };

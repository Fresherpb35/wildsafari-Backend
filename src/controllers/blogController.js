const { prisma } = require('../config/db');
const logger = require('../config/logger');

// POST /api/blogs
async function createBlog(req, res, next) {
  try {
    const { title, content, excerpt, imageUrl, author, published } = req.body;

    const blog = await prisma.blog.create({
      data: {
        title,
        slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
        content,
        excerpt,
        imageUrl,
        author: author || 'Admin',
        published: published || false,
        publishedAt: published ? new Date() : null,
      },
    });

    res.status(201).json({ success: true, data: blog });
  } catch (err) {
    next(err);
  }
}

// GET /api/blogs (public + admin)
async function getAllBlogs(req, res, next) {
  try {
    const { published } = req.query;
    const where = published === 'true' ? { published: true } : {};

    const blogs = await prisma.blog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: { id: true, title: true, slug: true, excerpt: true, imageUrl: true, published: true, createdAt: true }
    });

    res.json({ success: true, data: blogs });
  } catch (err) {
    next(err);
  }
}

// GET /api/blogs/:id
async function getBlogById(req, res, next) {
  try {
    const blog = await prisma.blog.findUnique({ where: { id: req.params.id } });
    if (!blog) return res.status(404).json({ success: false, message: 'Blog not found' });
    res.json({ success: true, data: blog });
  } catch (err) {
    next(err);
  }
}

// PUT /api/blogs/:id
async function updateBlog(req, res, next) {
  try {
    const { title, content, excerpt, imageUrl, published } = req.body;

    const data = {
      title,
      content,
      excerpt,
      imageUrl,
      published,
    };

    if (published && published !== false) {
      data.publishedAt = new Date();
    }

    const blog = await prisma.blog.update({
      where: { id: req.params.id },
      data,
    });

    res.json({ success: true, message: 'Blog updated', data: blog });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ success: false, message: 'Blog not found' });
    next(err);
  }
}

// DELETE /api/blogs/:id
async function deleteBlog(req, res, next) {
  try {
    await prisma.blog.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Blog deleted' });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ success: false, message: 'Blog not found' });
    next(err);
  }
}

module.exports = {
  createBlog,
  getAllBlogs,
  getBlogById,
  updateBlog,
  deleteBlog,
};
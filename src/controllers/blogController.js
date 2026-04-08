const prisma = require('../config/db');
const logger = require('../config/logger');

// POST /api/blogs - Create Blog
async function createBlog(req, res, next) {
  try {
    const { 
      title, 
      content, 
      excerpt, 
      imageUrl, 
      category,
      tag,
      readTime,
      color,
      imageEmoji,
      author,
      published 
    } = req.body;

    if (!title || !content) {
      return res.status(400).json({ 
        success: false, 
        message: 'Title and content are required' 
      });
    }

    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const blog = await prisma.blog.create({
      data: {
        title,
        slug,
        content,
        excerpt: excerpt || content.substring(0, 180) + '...',
        imageUrl,
        category: category || 'Wildlife',
        tag: tag || 'New Story',
        readTime: readTime || '6 min read',
        color: color || '#2d7a4f',
        imageEmoji: imageEmoji || '🌿',
        author: author || 'Admin',
        published: published || false,
        publishedAt: published ? new Date() : null,
      },
    });

    res.status(201).json({ 
      success: true, 
      message: 'Blog created successfully',
      data: blog 
    });
  } catch (err) {
    logger.error(err);
    next(err);
  }
}

// GET /api/blogs - Get All Blogs (Public)
async function getAllBlogs(req, res, next) {
  try {
    const { published } = req.query;

    const where = published === 'true' ? { published: true } : {};

    const blogs = await prisma.blog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        imageUrl: true,
        category: true,
        tag: true,
        readTime: true,
        color: true,
        imageEmoji: true,
        author: true,
        published: true,
        publishedAt: true,
        createdAt: true,
      }
    });

    res.json({ success: true, data: blogs });
  } catch (err) {
    logger.error(err);
    next(err);
  }
}

// GET /api/blogs/:id - Get Single Blog
async function getBlogById(req, res, next) {
  try {
    const blog = await prisma.blog.findUnique({
      where: { id: req.params.id }
    });

    if (!blog) {
      return res.status(404).json({ success: false, message: 'Blog not found' });
    }

    res.json({ success: true, data: blog });
  } catch (err) {
    next(err);
  }
}

// PUT /api/blogs/:id - Update Blog
async function updateBlog(req, res, next) {
  try {
    const { 
      title, 
      content, 
      excerpt, 
      imageUrl, 
      category,
      tag,
      readTime,
      color,
      imageEmoji,
      published 
    } = req.body;

    const data = {
      title,
      content,
      excerpt,
      imageUrl,
      category,
      tag,
      readTime,
      color,
      imageEmoji,
      published,
    };

    if (published === true && !req.body.publishedAt) {
      data.publishedAt = new Date();
    }

    const blog = await prisma.blog.update({
      where: { id: req.params.id },
      data,
    });

    res.json({ 
      success: true, 
      message: 'Blog updated successfully', 
      data: blog 
    });
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Blog not found' });
    }
    logger.error(err);
    next(err);
  }
}

// DELETE /api/blogs/:id
async function deleteBlog(req, res, next) {
  try {
    await prisma.blog.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Blog deleted successfully' });
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Blog not found' });
    }
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
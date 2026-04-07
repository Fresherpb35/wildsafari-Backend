const express = require('express');
const router = express.Router();
const { 
  createBlog, getAllBlogs, getBlogById, updateBlog, deleteBlog 
} = require('../controllers/blogController');

router.post('/', createBlog);
router.get('/', getAllBlogs);
router.get('/:id', getBlogById);
router.put('/:id', updateBlog);
router.delete('/:id', deleteBlog);

module.exports = router;
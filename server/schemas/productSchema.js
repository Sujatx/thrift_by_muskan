const { z } = require('zod');

const CATEGORIES = ['tops', 'bottoms', 'dresses', 'accessories'];

const createProductSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200).trim(),
  category: z.enum(CATEGORIES, { errorMap: () => ({ message: `Category must be one of: ${CATEGORIES.join(', ')}` }) }),
  originalPrice: z.number().nonnegative().optional(),
  salePrice: z.number().nonnegative({ message: 'Sale price must be a non-negative number' }),
  size: z.string().min(1, 'Size is required').max(20).trim(),
  description: z.string().max(2000).default(''),
  images: z.array(z.string().url('Each image must be a valid URL')).default([]),
  thumbnailUrl: z.string().url('Thumbnail must be a valid URL').optional().or(z.literal('')),
  tags: z.array(z.string().max(50)).default([]),
});

const updateProductSchema = createProductSchema.partial();

module.exports = { createProductSchema, updateProductSchema, CATEGORIES };

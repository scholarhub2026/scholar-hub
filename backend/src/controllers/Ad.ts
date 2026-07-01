import { Request, Response } from 'express'

import { catchAsync } from '../utils/catchAsync'
import { validateRequiredFeilds, mongooseIdValidator } from '../utils/validateFeilds'
import Ad from '../models/Ad'

/**
 * GET /api/ads
 * Public — active banners for the mobile home carousel, ordered.
 */
export const getActiveAdsController = catchAsync(
  async (_req: Request, res: Response) => {
    const ads = await Ad.find({ isActive: true }).sort({ order: 1, createdAt: -1 })
    return res.status(200).json({ message: 'Ads retrieved successfully', data: ads })
  }
)

/**
 * GET /api/ads/all
 * Admin — every banner including inactive ones.
 */
export const getAllAdsController = catchAsync(
  async (_req: Request, res: Response) => {
    const ads = await Ad.find().sort({ order: 1, createdAt: -1 })
    return res.status(200).json({ message: 'Ads retrieved successfully', data: ads })
  }
)

/**
 * POST /api/ads  body: { title, imageUrl, linkUrl?, isActive?, order? }
 * Admin — create a banner. Upload the image via /api/media first, pass the URL here.
 */
export const createAdController = catchAsync(
  async (req: Request, res: Response) => {
    const error = validateRequiredFeilds(req.body, ['title', 'imageUrl'])
    if (error) {
      return res.status(400).json({ message: error })
    }

    const ad = await Ad.create({
      title: req.body.title,
      imageUrl: req.body.imageUrl,
      linkUrl: req.body.linkUrl ?? '',
      isActive: req.body.isActive ?? true,
      order: req.body.order ?? 0,
    })

    return res.status(201).json({ message: 'Ad created successfully', data: ad })
  }
)

/**
 * PUT /api/ads/:id — Admin — update a banner (partial).
 */
export const updateAdController = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params
    if (!mongooseIdValidator(id)) {
      return res.status(400).json({ message: 'Invalid ad id' })
    }

    const ad = await Ad.findByIdAndUpdate(id, req.body, { new: true })
    if (!ad) {
      return res.status(404).json({ message: 'Ad not found' })
    }

    return res.status(200).json({ message: 'Ad updated successfully', data: ad })
  }
)

/**
 * DELETE /api/ads/:id — Admin — remove a banner.
 */
export const deleteAdController = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params
    if (!mongooseIdValidator(id)) {
      return res.status(400).json({ message: 'Invalid ad id' })
    }

    const ad = await Ad.findByIdAndDelete(id)
    if (!ad) {
      return res.status(404).json({ message: 'Ad not found' })
    }

    return res.status(200).json({ message: 'Ad deleted successfully' })
  }
)

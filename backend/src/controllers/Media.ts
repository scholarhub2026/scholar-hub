import cloudinary from '../utils/cloudinary'

export const uploadMedia = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' })
    }
    const fileBase64 = `data:${
      req.file.mimetype
    };base64,${req.file.buffer.toString('base64')}`

    // Upload to Cloudinary inside a folder
    const result = await cloudinary.uploader.upload(fileBase64, {
      folder: 'scholarHub', // <-- YOUR CLOUDINARY FOLDER
      resource_type: 'image',
    })

    res.json({
      success: true,
      url: result.secure_url,
      public_id: result.public_id,
      folder: result.folder,
    })
  } catch (error) {
    return res
      .status(500)
      .json({ message: 'Server Error', error: error.message })
  }
}

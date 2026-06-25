import { Router } from 'express';
import multer from 'multer';
import { uploadMedia } from '../controllers/Media.js';

const upload = multer({ dest: 'uploads/' }); // configure multer to store in /uploads

export const mediaRouter = Router();

// Upload route with multer middleware
mediaRouter.post('/upload', upload.single('image'), uploadMedia);

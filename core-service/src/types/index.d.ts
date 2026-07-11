import multer from 'multer';

declare global {
  type MulterFile = multer.File;
}
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class CloudinaryService {
  constructor(@Inject('CLOUDINARY') private cloudinary) {}

  async uploadFile(file: Express.Multer.File, options: any = {}) {
    return new Promise((resolve, reject) => {
      this.cloudinary.uploader.upload_stream(
        {
          folder: options.folder || 'images',
          resource_type: options.resource_type || 'image',
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        },
      ).end(file.buffer);
    });
  }
}
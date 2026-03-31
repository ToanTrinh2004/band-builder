import { Injectable } from '@nestjs/common';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class AdminService {
  constructor(private cloudinaryService: CloudinaryService) {}

  // 📸 Upload Image
  async uploadImage(file: Express.Multer.File) {
    const result: any = await this.cloudinaryService.uploadFile(file);

    return {
      url: result.secure_url,
      public_id: result.public_id,
      type: 'image',
    };
  }

  // 🎤 Upload Audio
  async uploadAudio(file: Express.Multer.File) {
    const result: any = await this.cloudinaryService.uploadFile(file, {
      resource_type: 'video', // important for audio/video
      folder: 'audio',
    });

    return {
      url: result.secure_url,
      public_id: result.public_id,
      type: 'audio',
    };
  }
}
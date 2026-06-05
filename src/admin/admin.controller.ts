import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, UploadedFile, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('upload/image')
  @UseInterceptors(FileInterceptor('file'))
  uploadImage(@UploadedFile() file) {
    return this.adminService.uploadImage(file);
  }
  
  @Post('upload/audio')
  @UseInterceptors(FileInterceptor('file'))
  uploadAudio(@UploadedFile() file) {
    return this.adminService.uploadAudio(file);
  }
}


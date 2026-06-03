import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { AdminPracticeService } from './admin-practice.service';
import {
  CreatePracticeTestDto,
  UpdatePracticeTestDto,
  CreateSkillTestDto,
  UpdateSkillTestDto,
} from './dto/admin-practice.dto';

@ApiTags('Admin Practice')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin/practice')
export class AdminPracticeController {
  constructor(private readonly adminPracticeService: AdminPracticeService) {}

  @Post('tests')
  @ApiOperation({ summary: 'Tạo mới một Practice Test' })
  @ApiResponse({ status: 201, description: 'Tạo đề thi thành công' })
  createTest(@Body() dto: CreatePracticeTestDto) {
    return this.adminPracticeService.createTest(dto);
  }

  @Get('tests')
  @ApiOperation({ summary: 'Lấy danh sách tất cả các Practice Test (phân trang)' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  getAllTests(
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.adminPracticeService.getAllTests(page ?? 1, limit ?? 20);
  }

  @Get('tests/:id')
  @ApiOperation({ summary: 'Chi tiết một Practice Test kèm danh sách skill và nội dung chi tiết' })
  @ApiParam({ name: 'id', description: 'ID của Practice Test' })
  getTestById(@Param('id') id: string) {
    return this.adminPracticeService.getTestById(id);
  }

  @Put('tests/:id')
  @ApiOperation({ summary: 'Cập nhật thông tin tiêu đề của Practice Test' })
  @ApiParam({ name: 'id', description: 'ID của Practice Test' })
  updateTest(@Param('id') id: string, @Body() dto: UpdatePracticeTestDto) {
    return this.adminPracticeService.updateTest(id, dto);
  }

  @Delete('tests/:id')
  @ApiOperation({ summary: 'Xóa một Practice Test' })
  @ApiParam({ name: 'id', description: 'ID của Practice Test' })
  deleteTest(@Param('id') id: string) {
    return this.adminPracticeService.deleteTest(id);
  }

  @Post('tests/:id/skills')
  @ApiOperation({ summary: 'Thêm một Skill (Listening, Reading, Writing, Speaking) vào Practice Test' })
  @ApiParam({ name: 'id', description: 'ID của Practice Test' })
  addSkillToTest(@Param('id') id: string, @Body() dto: CreateSkillTestDto) {
    return this.adminPracticeService.addSkillToTest(id, dto);
  }

  @Put('skills/:skillContentId')
  @ApiOperation({ summary: 'Cập nhật nội dung chi tiết (JSON, Audio, Source) của một Skill' })
  @ApiParam({ name: 'skillContentId', description: 'ID của SkillContent cần sửa' })
  updateSkill(@Param('skillContentId') skillContentId: string, @Body() dto: UpdateSkillTestDto) {
    return this.adminPracticeService.updateSkill(skillContentId, dto);
  }

  @Delete('tests/:practiceTestId/skills/:skillTestId')
  @ApiOperation({ summary: 'Xóa một Skill khỏi một Practice Test' })
  @ApiParam({ name: 'practiceTestId', description: 'ID của Practice Test' })
  @ApiParam({ name: 'skillTestId', description: 'ID của SkillTest cần xóa' })
  deleteSkillFromTest(
    @Param('practiceTestId') practiceTestId: string,
    @Param('skillTestId') skillTestId: string,
  ) {
    return this.adminPracticeService.deleteSkillFromTest(practiceTestId, skillTestId);
  }
}

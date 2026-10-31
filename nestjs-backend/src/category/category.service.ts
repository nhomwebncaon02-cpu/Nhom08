import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Category } from './category.entity';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { UpdateCategoryDto } from '../dto/update-category.dto';
import type { JwtUser } from '../auth/decorators/current-user.decorator';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    private readonly audit: AuditService,
  ) {}

  async create(user: JwtUser, dto: CreateCategoryDto): Promise<Category> {
    const newCategory = this.categoryRepository.create({
      categoryName: dto.categoryName,
      type: dto.type,
      icon: dto.icon,
      userId: user.role === 'admin' ? null : user.userId,
    });
    const saved = await this.categoryRepository.save(newCategory);
    if (user.role === 'admin') {
      await this.audit.log({ userId: user.userId, username: user.username, action: 'CATEGORY_CREATE', detail: `Tạo danh mục hệ thống "${saved.categoryName}" (${saved.type})` });
    }
    return saved;
  }

  /** [Admin] Chỉ danh mục hệ thống (userId NULL) + số lần đã được dùng */
  async findSystem() {
    const rows: { categoryId: number; categoryName: string; type: string; icon: string | null; usageCount: string }[] =
      await this.categoryRepository.query(
        `SELECT c.CategoryId AS categoryId, c.CategoryName AS categoryName, c.Type AS type, c.Icon AS icon,
                (SELECT COUNT(*) FROM \`Transaction\` t WHERE t.CategoryId = c.CategoryId) AS usageCount
           FROM \`Category\` c
          WHERE c.UserId IS NULL
          ORDER BY c.Type, c.CategoryName`,
      );
    return rows.map((r) => ({ ...r, categoryId: Number(r.categoryId), userId: null, usageCount: Number(r.usageCount) }));
  }

  /** Admin thấy tất cả; user thấy danh mục hệ thống (userId NULL) + danh mục của mình */
  async findAll(user: JwtUser): Promise<Category[]> {
    if (user.role === 'admin') return this.categoryRepository.find();
    return this.categoryRepository.find({
      where: [{ userId: IsNull() }, { userId: user.userId }],
    });
  }

  async findOne(user: JwtUser, id: number): Promise<Category> {
    const category = await this.categoryRepository.findOne({ where: { categoryId: id } });
    if (!category) throw new NotFoundException(`Không tìm thấy danh mục với ID: ${id}`);
    const visible = user.role === 'admin' || category.userId == null || category.userId === user.userId;
    if (!visible) throw new NotFoundException(`Không tìm thấy danh mục với ID: ${id}`);
    return category;
  }

  async update(user: JwtUser, id: number, dto: UpdateCategoryDto): Promise<Category> {
    const category = await this.findOne(user, id);
    this.assertCanModify(user, category);
    if (dto.type && dto.type !== category.type) {
      const transactionCount = await this.categoryRepository
        .createQueryBuilder('category')
        .innerJoin('category.transactions', 'transaction')
        .where('category.categoryId = :id', { id })
        .getCount();
      if (transactionCount > 0) {
        throw new BadRequestException('Không thể đổi loại danh mục đã được dùng trong giao dịch');
      }
    }
    Object.assign(category, dto);
    const saved = await this.categoryRepository.save(category);
    if (user.role === 'admin' && saved.userId == null) {
      await this.audit.log({ userId: user.userId, username: user.username, action: 'CATEGORY_UPDATE', detail: `Sửa danh mục hệ thống "${saved.categoryName}"` });
    }
    return saved;
  }

  async remove(user: JwtUser, id: number): Promise<{ message: string }> {
    const category = await this.findOne(user, id);
    this.assertCanModify(user, category);

    // Danh mục đã dùng trong giao dịch / ngân sách -> không xoá được (tránh lỗi khoá ngoại 500)
    const [usage] = await this.categoryRepository.query(
      `SELECT (SELECT COUNT(*) FROM \`Transaction\` WHERE CategoryId = ?) AS tx,
              (SELECT COUNT(*) FROM \`Budget\` WHERE CategoryId = ?) AS bg`,
      [id, id],
    );
    if (Number(usage?.tx) > 0 || Number(usage?.bg) > 0) {
      throw new BadRequestException(
        `Danh mục đang được dùng trong ${Number(usage.tx)} giao dịch và ${Number(usage.bg)} ngân sách nên không thể xoá`,
      );
    }

    const name = category.categoryName;
    const isSystem = category.userId == null;
    await this.categoryRepository.remove(category);
    if (user.role === 'admin' && isSystem) {
      await this.audit.log({ userId: user.userId, username: user.username, action: 'CATEGORY_DELETE', detail: `Xoá danh mục hệ thống "${name}"` });
    }
    return { message: 'Đã xóa danh mục' };
  }

  /** User chỉ được sửa/xóa danh mục của chính mình; danh mục hệ thống chỉ admin sửa */
  private assertCanModify(user: JwtUser, category: Category) {
    if (user.role === 'admin') return;
    if (category.userId !== user.userId) {
      throw new ForbiddenException('Bạn không có quyền sửa danh mục này');
    }
  }
}

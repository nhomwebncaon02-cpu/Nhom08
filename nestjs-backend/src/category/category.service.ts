import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Category } from './category.entity';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { UpdateCategoryDto } from '../dto/update-category.dto';
import type { JwtUser } from '../auth/decorators/current-user.decorator';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async create(user: JwtUser, dto: CreateCategoryDto): Promise<Category> {
    const newCategory = this.categoryRepository.create({
      ...dto,
      userId: user.role === 'admin' ? (null as any) : user.userId,
    });
    return this.categoryRepository.save(newCategory);
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
    Object.assign(category, dto);
    return this.categoryRepository.save(category);
  }

  async remove(user: JwtUser, id: number): Promise<{ message: string }> {
    const category = await this.findOne(user, id);
    this.assertCanModify(user, category);
    await this.categoryRepository.remove(category);
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

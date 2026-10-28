import { IsIn, IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

// Không nhận userId từ client: backend tự gán theo JWT
// (admin tạo -> danh mục hệ thống userId = null; user tạo -> danh mục riêng)
export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty({ message: 'Tên danh mục không được để trống' })
  @Length(1, 100)
  categoryName: string;

  @IsIn(['Income', 'Expense'], { message: 'Loại danh mục phải là Income hoặc Expense' })
  type: 'Income' | 'Expense';

  @IsOptional()
  @IsString()
  @Length(0, 50)
  icon?: string;
}

import { PartialType } from '@nestjs/mapped-types';
import { CreateGoalDto } from './create-goal.dto';

// currentAmount KHÔNG sửa tay nữa — dùng nạp/rút tiền (POST /goal/:id/deposit | /withdraw)
export class UpdateGoalDto extends PartialType(CreateGoalDto) {}

import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import type { PromoDiscountKind } from '../entities/promo-code.entity';

export class CreatePromoCodeDto {
  @IsString()
  @MinLength(2)
  @MaxLength(32)
  code!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(200)
  label!: string;

  @IsIn(['fixed', 'percent'])
  discountKind!: PromoDiscountKind;

  @IsInt()
  @Min(0)
  @Max(1_000_000_000)
  discountFixed!: number;

  @IsInt()
  @Min(0)
  @Max(100)
  discountPercent!: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1_000_000_000)
  discountCapVnd?: number | null;

  @IsInt()
  @Min(0)
  @Max(1_000_000_000)
  minOrderSubtotal!: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  validFrom?: string | null;

  @IsOptional()
  @IsString()
  validUntil?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1_000_000_000)
  usageLimit?: number | null;
}

export class UpdatePromoCodeDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  label?: string;

  @IsOptional()
  @IsIn(['fixed', 'percent'])
  discountKind?: PromoDiscountKind;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1_000_000_000)
  discountFixed?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  discountPercent?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1_000_000_000)
  discountCapVnd?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1_000_000_000)
  minOrderSubtotal?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  validFrom?: string | null;

  @IsOptional()
  @IsString()
  validUntil?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1_000_000_000)
  usageLimit?: number | null;
}

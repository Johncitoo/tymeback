import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { Promotion, PromotionTypeEnum } from './entities/promotion.entity';
import { CreatePromotionDto } from './dto/create-promotion.dto';

@Injectable()
export class PromotionsService {
  constructor(
    @InjectRepository(Promotion)
    private readonly repo: Repository<Promotion>,
  ) {}

  async findAll(gymId: string): Promise<Promotion[]> {
    return this.repo.find({
      where: { gymId, isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Promotion> {
    const promo = await this.repo.findOne({ where: { id } });
    if (!promo) throw new NotFoundException('Promoción no encontrada');
    return promo;
  }

  async findByCode(gymId: string, code: string): Promise<Promotion | null> {
    const today = new Date().toISOString().slice(0, 10);
    return this.repo.findOne({
      where: {
        gymId,
        code: code.toUpperCase(),
        isActive: true,
        validFrom: LessThanOrEqual(today),
        validUntil: MoreThanOrEqual(today),
      },
    });
  }

  async validatePromotion(
    gymId: string,
    code: string,
    planId: string,
  ): Promise<{ valid: boolean; promotion?: Promotion; message?: string }> {
    const promo = await this.findByCode(gymId, code);

    if (!promo) {
      return { valid: false, message: 'Código de promoción inválido o expirado' };
    }

    // Verificar límite de usos
    if (promo.maxUses && promo.timesUsed >= promo.maxUses) {
      return { valid: false, message: 'Esta promoción ha alcanzado su límite de usos' };
    }

    // Verificar si aplica al plan
    if (promo.applicablePlanIds && promo.applicablePlanIds.length > 0) {
      if (!promo.applicablePlanIds.includes(planId)) {
        return { valid: false, message: 'Esta promoción no aplica al plan seleccionado' };
      }
    }

    return { valid: true, promotion: promo };
  }

  async incrementUsage(promotionId: string): Promise<void> {
    await this.repo.increment({ id: promotionId }, 'timesUsed', 1);
  }

  calculateDiscount(promotion: Promotion, basePrice: number): number {
    if (promotion.type === PromotionTypeEnum.PERCENTAGE) {
      return Math.round((basePrice * promotion.discountValue) / 100);
    } else {
      return Math.min(promotion.discountValue, basePrice); // No puede ser mayor que el precio
    }
  }

  async create(data: Partial<Promotion>): Promise<Promotion> {
    const promo = this.repo.create({
      ...data,
      code: data.code ? data.code.toUpperCase() : null,
      timesUsed: 0,
    });
    return this.repo.save(promo);
  }
}

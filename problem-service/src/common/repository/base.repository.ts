import {
  Repository,
  FindOptionsWhere,
  FindManyOptions,
  DeepPartial,
  FindOneOptions,
  ObjectLiteral,
} from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';

export interface PaginationOptions {
  page?: number;
  limit?: number;
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export abstract class BaseRepository<
  T extends ObjectLiteral,
> extends Repository<T> {

  /**
   * Find entities with pagination
   */
  async findWithPagination(
    options: PaginationOptions & {
      where?: FindOptionsWhere<T> | FindOptionsWhere<T>[];
      order?: FindManyOptions<T>['order'];
    } = {},
  ): Promise<PaginationResult<T>> {
    const { page = 1, limit = 10, where, order } = options;
    const skip = (page - 1) * limit;

    const [data, total] = await this.findAndCount({
      where,
      order,
      skip,
      take: limit,
    });

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update an entity by id and return the updated entity
   */
  async updateById(
    id: string | number,
    data: QueryDeepPartialEntity<T>,
  ): Promise<T | null> {
    await this.update(id, data);
    return this.findOne({ where: { id } as any } as FindOneOptions<T>);
  }

  /**
   * Update entities by conditions and return the first updated entity
   */
  async updateBy(
    where: FindOptionsWhere<T>,
    data: QueryDeepPartialEntity<T>,
  ): Promise<T | null> {
    await this.update(where, data);
    return this.findOne({ where } as FindOneOptions<T>);
  }

  /**
   * Soft delete an entity by id and return the entity
   */
  async softDeleteById(id: string | number): Promise<T | null> {
    await this.softDelete(id);
    return this.findOne({
      where: { id } as any,
      withDeleted: true,
    } as FindOneOptions<T>);
  }

  /**
   * Soft delete entities by conditions
   */
  async softDeleteBy(where: FindOptionsWhere<T>): Promise<number> {
    const result = await this.softDelete(where);
    return result.affected || 0;
  }

  /**
   * Restore soft deleted entity by id and return the entity
   */
  async restoreById(id: string | number): Promise<T | null> {
    await this.restore(id);
    return this.findOne({ where: { id } as any } as FindOneOptions<T>);
  }

  /**
   * Find one or create
   */
  async findOneOrCreate(
    where: FindOptionsWhere<T>,
    createData: DeepPartial<T>,
  ): Promise<T> {
    let entity = await this.findOne({ where } as FindOneOptions<T>);

    if (!entity) {
      entity = this.create(createData);
      await this.save(entity as DeepPartial<T>);
    }

    return entity;
  }

  /**
   * Bulk create entities
   */
  async bulkCreate(data: DeepPartial<T>[]): Promise<T[]> {
    const entities = this.create(data);
    return await this.save(entities as DeepPartial<T>[]);
  }
}

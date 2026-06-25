import { Document, Model, PopulateOptions } from 'mongoose';

interface PaginateResult<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

type PopulateType = string | PopulateOptions | Array<string | PopulateOptions>;

export const paginate = async <T extends Document>(
  model: Model<T>,
  filter: object = {},
  page: number = 1,
  limit: number = 10,
  populate?: PopulateType,
  projection?: object // 👈 added projection argument here
): Promise<PaginateResult<T>> => {
  const skip = (page - 1) * limit;

  let query = model.find(filter, projection).skip(skip).limit(limit);

  if (populate) {
    const populateArray: PopulateOptions[] = (
      Array.isArray(populate) ? populate : [populate]
    ).map((item) =>
      typeof item === 'string' ? { path: item } : item
    );

    for (const pop of populateArray) {
      query = query.populate(pop);
    }
  }

  const [data, total] = await Promise.all([
    query.exec(),
    model.countDocuments(filter),
  ]);

  return {
    data,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
};

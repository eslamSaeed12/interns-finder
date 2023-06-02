import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import { Model } from 'mongoose';
import { Intern } from './intern.schema';
import { ICrawlerPayload } from './inter.crawler';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { FilterSortBody, GetInternsQuery } from './intern.controller';
import { GetInternsSortBy } from './intern.controller';
import _ from 'lodash';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class InternService {
  constructor(
    @InjectModel(Intern.name) private model: Model<Intern>,
    @InjectQueue('Crawler') private crawlerQueue: Queue,
  ) {}

  Save(interns: Array<Partial<Intern>>) {
    console.log(interns);
    // return this.model.updateMany(interns, {}, { upsert: true });
  }

  CallCrawler(type: ICrawlerPayload) {
    return this.crawlerQueue.add(type);
  }

  Validate(data: Array<Partial<Intern>>) {
    return validate(plainToInstance(Intern, data));
  }

  Get(query: GetInternsQuery & FilterSortBody) {
    return this.buildQuery(this.model, query);
  }

  protected setPagination(page: number, take: number) {
    return {
      skip: page * take,
      limit: take,
    };
  }

  protected setSorting(sorters: GetInternsSortBy) {
    return {
      sort: sorters,
    };
  }

  async buildQuery(
    model: Model<Intern>,
    query: GetInternsQuery & FilterSortBody,
  ) {
    const queryInternals = {
      options: {},
      search: {},
      where: {},
    };

    if (query.page && query.take) {
      queryInternals['options'] = {
        ...this.setPagination(query.page, query.take),
      };
    }

    if (query.sorters) {
      queryInternals['options'] = {
        ...queryInternals?.options,
        ...this.setSorting(query.sorters),
      };
    }

    if (query.search) {
      queryInternals.where['title'] = {
        $regex: query.search,
        $options: 'i',
      };
    }

    if (query.filters) {
      if (query?.filters?.dateFrom) {
        queryInternals.where['datePosted'] = {
          ...queryInternals.where['datePosted'],
          $gte: new Date(query?.filters?.dateFrom),
        };
      }

      if (query.filters.dateTo) {
        queryInternals.where['datePosted'] = {
          ...queryInternals.where['datePosted'],
          $lte: new Date(query.filters.dateTo),
        };
      }

      if (query.filters.fields) {
        queryInternals.where['fields'] = { $in: [...query.filters.fields] };
      }

      queryInternals.where = {
        ...queryInternals.where,
        ..._?.pick(query, 'company', 'provider', 'location'),
      };
    }
    return this.refineData(
      await model.find(queryInternals.where, {}, queryInternals.options).exec(),
      'successfully find interns',
      query.page,
      query.take,
    );
  }

  protected refineData(data: any, mssage: string, page: number, take: number) {
    return { data, mssage, page, take, count: data?.length };
  }
}

import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import { Model } from 'mongoose';
import { Intern } from './intern.schema';
import { ICrawlerPayload } from './inter.crawler';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { GetInternsQuery } from './intern.controller';
import * as _ from 'lodash';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class InternService {
  constructor(
    @InjectModel(Intern.name) private model: Model<Intern>,
    @InjectQueue('Crawler') private crawlerQueue: Queue,
  ) {}

  Save(interns: Array<Partial<Intern>>) {
    return this.model.insertMany(interns, {
      throwOnValidationError: false,
    });
  }

  CallCrawler(type: ICrawlerPayload) {
    return this.crawlerQueue.add(type);
  }

  Validate(data: Array<Partial<Intern>>) {
    return validate(plainToInstance(Intern, data));
  }

  Get(query: GetInternsQuery) {
    return this.buildQuery(this.model, query);
  }

  protected setPagination(page: number, take: number) {
    return {
      skip: page * take,
      limit: take,
    };
  }

  protected setSorting(
    sorters: Pick<
      GetInternsQuery,
      'S_proivder' | 'S_location' | 'S_datePosted'
    >,
  ) {
    const mapper = {
      S_proivder: 'proivder',
      S_location: 'location',
      S_datePosted: 'datePosted',
    };
    const sort = _.mapKeys(sorters, (key, value) => mapper[key]);

    return {
      sort,
    };
  }

  async buildQuery(model: Model<Intern>, query: GetInternsQuery) {
    const queryInternals = {
      options: {},
      search: {},
      where: {},
    };

    const filters = _.pick(query, [
      'F_provider',
      'F_location',
      'F_company',
      'F_fields',
      'F_dateFrom',
      'F_dateTo',
    ]);
    const sorters = _.pick(query, ['S_datePosted', 'S_location', 'S_proivder']);
    if (query.page && query.take) {
      queryInternals['options'] = {
        ...this.setPagination(query.page, query.take),
      };
    }

    if (Object.keys(sorters)) {
      queryInternals['options'] = {
        ...queryInternals?.options,
        ...this.setSorting(sorters),
      };
    }

    if (query.search) {
      queryInternals.where['title'] = {
        $regex: query.search,
        $options: 'i',
      };
    }

    if (Object.keys(filters)) {
      if (query?.F_dateFrom) {
        queryInternals.where['datePosted'] = {
          ...queryInternals.where['datePosted'],
          $gte: new Date(query?.F_dateFrom),
        };
      }

      if (query.F_dateTo) {
        queryInternals.where['datePosted'] = {
          ...queryInternals.where['datePosted'],
          $lte: new Date(query.F_dateTo),
        };
      }

      if (query.F_fields) {
        queryInternals.where['fields'] = { $in: [...query.F_fields] };
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

  protected refineData(data: any, mssage: string, page?: number, take?: number) {
    return { data, mssage, page, take, count: data?.length };
  }

  async getCompanies() {
    const data = await this.model.find().select('company').distinct('company');

    return this.refineData(data, 'successfully find comapnies');
  }

  async getLocations() {
    const data = await this.model
      .find()
      .select('location')
      .distinct('location');

    return this.refineData(data, 'successfully find locations');
  }
  async getProviders() {
    const data = await this.model
      .find()
      .select('proivder')
      .distinct('proivder');

    return this.refineData(data, 'successfully find providers');
  }
  async getFields() {
    const data = await this.model.find().select('fields');

    return this.refineData(
      _.uniq(_.flatMap(data, (it) => it?.fields)),
      'successfully find fields',
    );
  }
}

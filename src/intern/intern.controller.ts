import {
  Body,
  Controller,
  Get,
  InternalServerErrorException,
  Options,
  Post,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { InternService } from './intern.service';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  ApiBody,
  ApiOperation,
  ApiProperty,
  ApiResponse,
  ApiTags,
  OmitType,
} from '@nestjs/swagger';
import { Intern } from './intern.schema';
import { SentryInterceptor } from 'src/sentry/sentry.interceptor';

export enum ProviderFilter {
  wuzzuf = 'Wuzzuf',
  tanqeeb = 'Tanqeeb',
  indeed = 'Indeed',
  linkedin = 'Linkedin',
}

export enum Sorter {
  asc = -1,
  desc = 1,
}

export class GetInternsQuery {
  @IsString()
  @IsOptional()
  @MinLength(3)
  @MaxLength(22)
  @ApiProperty({ required: false, description: 'search by a keyword' })
  search?: string;

  @IsNumber()
  @IsOptional()
  @ApiProperty({ required: false, default: 0 })
  page?: number = 0;

  @IsNumber()
  @IsOptional()
  @ApiProperty({ required: false, default: 5 })
  take?: number = 5;

  @IsEnum(ProviderFilter)
  @IsOptional()
  @ApiProperty({
    required: false,
    enum: ProviderFilter,
    description: 'Filter by provider',
  })
  F_provider: ProviderFilter;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false, description: 'Filter by location' })
  F_location: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ description: 'Filter by company', required: false })
  F_company: string;

  @IsString({ each: true })
  @ApiProperty({
    required: false,
    isArray: true,
    description: 'Filter by  fields',
  })
  F_fields: Array<string>;

  @IsDateString()
  @IsOptional()
  @ApiProperty({ description: 'Filter by To From', required: false })
  F_dateFrom: string;

  @IsDateString()
  @IsOptional()
  @ApiProperty({ description: 'Filter by To Date', required: false })
  F_dateTo: string;

  @IsEnum(Sorter)
  @IsOptional()
  @ApiProperty({ description: 'Sort by date', enum: Sorter, required: false })
  S_datePosted: Sorter;

  @IsEnum(Sorter)
  @IsOptional()
  @ApiProperty({
    enum: Sorter,
    required: false,
    description: 'Sort by location',
  })
  S_location: Sorter;

  @IsEnum(Sorter)
  @IsOptional()
  @ApiProperty({
    description: 'Sort by provider',
    enum: Sorter,
    required: false,
  })
  S_proivder: Sorter;
}

export class InternsQueryResponse {
  @ApiProperty({ type: Intern, isArray: true })
  data: Array<Intern>;

  @ApiProperty()
  message: string;

  @ApiProperty()
  page: number;

  @ApiProperty()
  take: number;
}

export class StringedDataWithMessage {
  @ApiProperty({ type: String, isArray: true })
  data: Array<string>;

  @ApiProperty()
  message: string;
}

export class HttpException {
  @ApiProperty()
  message: string;

  @ApiProperty()
  status: number;

  @ApiProperty({ isArray: true, type: String, required: false })
  errors?: string[];
}

@Controller('/api/interns')
@ApiTags('interns')
@UseInterceptors(SentryInterceptor)
export class InternController {
  constructor(private readonly internService: InternService) {}

  @Get('')
  @ApiOperation({
    description: 'get interns data & filter and sort,search',
    summary: 'find interns',
  })
  @ApiResponse({ type: InternsQueryResponse, status: 200 })
  @ApiResponse({ type: OmitType(HttpException, ['errors']), status: 500 })
  @ApiResponse({ type: HttpException, status: 400 })
  GetAll(@Query() query: GetInternsQuery) {
    return this.internService.Get(query);
  }

  @Get('/companies')
  @ApiOperation({ summary: 'Get All Companies Has Published Interns' })
  @ApiResponse({ type: StringedDataWithMessage, status: 200 })
  @ApiResponse({ type: OmitType(HttpException, ['errors']), status: 500 })
  countires() {
    return this.internService.getCompanies();
  }

  @Get('/locations')
  @ApiOperation({ summary: 'Get All Locations Has Published Interns' })
  @ApiResponse({ type: StringedDataWithMessage, status: 200 })
  @ApiResponse({ type: OmitType(HttpException, ['errors']), status: 500 })
  locations() {
    return this.internService.getLocations();
  }

  @Get('/providers')
  @ApiOperation({ summary: 'Get All providers Has Published Interns' })
  @ApiResponse({ type: StringedDataWithMessage, status: 200 })
  @ApiResponse({ type: OmitType(HttpException, ['errors']), status: 500 })
  providers() {
    return this.internService.getProviders();
  }

  @Get('/fields')
  @ApiOperation({ summary: 'Get All fields Has Published Interns' })
  @ApiResponse({ type: StringedDataWithMessage, status: 200 })
  @ApiResponse({ type: OmitType(HttpException, ['errors']), status: 500 })
  fields() {
    return this.internService.getFields();
  }
}

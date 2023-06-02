import {
  Body,
  Controller,
  Get,
  InternalServerErrorException,
  Options,
  Post,
  Query,
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

export enum ProviderFilter {
  wuzzuf = 'Wuzzuf',
  tanqeeb = 'Tanqeeb',
  indeed = 'Indeed',
  linkedin = 'Linkedin',
}

export class GetInternsFilters {
  @IsEnum(ProviderFilter)
  @IsOptional()
  @ApiProperty({ enum: ProviderFilter })
  provider: ProviderFilter;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false })
  location: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false })
  company: string;

  @IsString({ each: true })
  @ApiProperty({ required: false, isArray: true })
  fields: Array<string>;

  @IsDateString()
  @IsOptional()
  @ApiProperty({ required: false })
  dateFrom: string;

  @IsDateString()
  @IsOptional()
  @ApiProperty({ required: false })
  dateTo: string;
}

export enum Sorter {
  asc = -1,
  desc = 1,
}

export class GetInternsSortBy {
  @IsEnum(Sorter)
  @IsOptional()
  @ApiProperty({ enum: Sorter, required: false })
  datePosted: Sorter;

  @IsEnum(Sorter)
  @IsOptional()
  @ApiProperty({ enum: Sorter, required: false })
  location: Sorter;

  @IsEnum(Sorter)
  @IsOptional()
  @ApiProperty({ enum: Sorter, required: false })
  proivder: Sorter;
}

export class GetInternsQuery {
  @IsString()
  @IsOptional()
  @MinLength(3)
  @MaxLength(22)
  @ApiProperty({ required: false })
  search?: string;

  @IsNumber()
  @IsOptional()
  @ApiProperty({ required: false, default: 0 })
  page?: number = 0;

  @IsNumber()
  @IsOptional()
  @ApiProperty({ required: false, default: 5 })
  take?: number = 5;
}

export class FilterSortBody {
  @ValidateNested()
  @Type(() => GetInternsFilters)
  @IsOptional()
  @ApiProperty({ type: GetInternsFilters, required: false })
  filters?: GetInternsFilters;

  @ValidateNested()
  @Type(() => GetInternsSortBy)
  @IsOptional()
  @ApiProperty({ type: GetInternsSortBy, required: false })
  sorters?: GetInternsSortBy;
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
export class InternController {
  constructor(private readonly internService: InternService) {}

  @Post('')
  @ApiOperation({
    description: 'get interns data & filter and sort,search',
    summary: 'find interns',
  })
  @ApiBody({ type: FilterSortBody, required: false })
  @ApiResponse({ type: InternsQueryResponse, status: 200 })
  @ApiResponse({ type: OmitType(HttpException, ['errors']), status: 500 })
  @ApiResponse({ type: HttpException, status: 400 })
  GetAll(@Query() query: GetInternsQuery, @Body() body?: FilterSortBody) {
    return this.internService.Get({ ...query, ...body });
  }
}

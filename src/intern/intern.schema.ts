import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsISO31661Alpha2,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';
import { HydratedDocument } from 'mongoose';

export enum InternMode {
  remote = 'remote',
  onsite = 'onsite',
  hybrid = 'hybrid',
  unkown = 'unkown',
}

export type InternDocument = HydratedDocument<Intern>;

@Schema({ versionKey: false, timestamps: false, collection: 'intern' })
export class Intern {
  @IsUrl()
  @Prop()
  @ApiProperty()
  url: string;

  @Prop()
  @IsString()
  @Prop({ unique: true })
  @ApiProperty()
  title: string;

  @Prop({ isRequired: false })
  @IsString()
  @IsOptional()
  @ApiProperty()
  body: string;

  @Prop()
  @IsDateString()
  @ApiProperty()
  datePosted: Date;

  @Prop({ isRequired: false })
  @IsString()
  @IsISO31661Alpha2()
  @IsOptional()
  @ApiProperty()
  country: string;

  @Prop({ isRequired: false })
  @IsString()
  @IsOptional()
  @ApiProperty()
  company: string;

  @Prop({ required: false })
  @IsString()
  @IsOptional()
  @ApiProperty()
  location: string;

  @Prop({ enum: InternMode })
  @IsEnum(InternMode)
  @ApiProperty({ enum: InternMode })
  mode: InternMode;

  @Prop({ isRequired: false })
  @IsUrl()
  @IsOptional()
  @ApiProperty()
  logo: string;

  @Prop({ isRequired: false, type: [String] })
  @IsOptional()
  @IsString({ each: true })
  @ApiProperty({ isArray: true, type: String })
  fields: string[];

  @Prop()
  @ApiProperty()
  proivder: string;
}

export const InternSchema = SchemaFactory.createForClass(Intern);

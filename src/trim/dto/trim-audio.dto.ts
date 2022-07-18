import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  Min,
} from 'class-validator';

export class TrimAudioDto {
  @IsNotEmpty()
  @IsString()
  key: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  trimStart!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  trimLength!: number;
}

import { IsNotEmpty, IsString } from 'class-validator';

export class GetUploadUrlDto {
  @IsNotEmpty()
  @IsString()
  key: string;
}

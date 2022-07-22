import { IsNotEmpty, IsString } from 'class-validator';

export class ConcatAudioDto {
  @IsNotEmpty()
  @IsString()
  key: string;
}

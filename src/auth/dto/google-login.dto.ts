// src/auth/dto/google-login.dto.ts
import { ApiProperty } from "@nestjs/swagger";

export class GoogleLoginDto {
  @ApiProperty({ example: "ya29.a0AX..." })
  token: string;
}

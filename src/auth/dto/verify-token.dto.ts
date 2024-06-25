// src\auth\dto\verify-token.dto.ts

import { ApiProperty } from "@nestjs/swagger";

export class VerifyTokenDto {
  @ApiProperty({ example: "eyJhbGciOiJIUzI1NiIsIn..." })
  token: string;
}

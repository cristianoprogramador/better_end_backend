// src/auth/auth.controller.ts
import {
  Controller,
  Post,
  Body,
  HttpStatus,
  Get,
  Req,
  Logger,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiExcludeEndpoint,
} from "@nestjs/swagger";
import { GoogleLoginDto } from "./dto/google-login.dto";
import { AuthService } from "./auth.service";

@ApiTags("Auth")
@ApiBearerAuth()
@Controller("auth")
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private authService: AuthService) {}

  @Post("google")
  @ApiExcludeEndpoint()
  async googleLogin(@Body() googleLoginDto: GoogleLoginDto) {
    return this.authService.googleLogin(googleLoginDto);
  }

  @Get("verify-token")
  @ApiOperation({ summary: "Verify JWT token" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Token is valid",
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Invalid or expired token",
  })
  async verifyToken(@Req() request: Request) {
    const authHeader = request.headers["authorization"];
    const token = authHeader?.split(" ")[1] || "";
    return this.authService.verifyToken(token);
  }
}

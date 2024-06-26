// src/auth/auth.service.ts

import { HttpException, HttpStatus, Injectable, Logger } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { OAuth2Client } from "google-auth-library";
import { GoogleLoginDto } from "./dto/google-login.dto";
import axios from "axios";
import { randomBytes } from "crypto";
import { ConfigService } from "@nestjs/config";
import { UsersService } from "src/users/users.service";
import { CreateUserDto } from "src/users/dto/create-user.dto";
import { UserType } from "prisma-client-postgresql";

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly oAuth2Client: OAuth2Client;

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService
  ) {
    this.oAuth2Client = new OAuth2Client(
      configService.get<string>("GOOGLE_CLIENT_ID")
    );
  }

  async googleLogin(googleLoginDto: GoogleLoginDto) {
    const response = await axios.get(
      `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${googleLoginDto.token}`
    );

    const payload = response.data;

    if (!payload || !payload.verified_email) {
      throw new HttpException("Invalid Google token", HttpStatus.UNAUTHORIZED);
    }

    let user = await this.usersService.findByEmailGoogle(payload.email);
    if (!user) {
      const randomPassword = randomBytes(16).toString("hex");
      const hashedPassword =
        await this.usersService.encryptPassword(randomPassword);

      const createUserDto: CreateUserDto = {
        name: payload.given_name || "",
        email: payload.email,
        password: hashedPassword,
        profileImageUrl: payload.picture,
        type: UserType.client,
      };

      user = await this.usersService.create(createUserDto);
    }

    const accessToken = this.jwtService.sign({
      email: user.email,
      sub: user.uuid,
    });
    return {
      accessToken,
      userData: {
        uuid: user.uuid,
        email: user.email,
        name: user.name,
        profileImageUrl: user.profileImageUrl,
        type: user.type,
      },
    };
  }

  async verifyToken(token: string) {
    try {
      const decoded = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET,
      });

      const user = await this.usersService.findByUuid(decoded.sub);
      if (!user) {
        throw new HttpException("User not found", HttpStatus.NOT_FOUND);
      }

      return {
        uuid: user.uuid,
        email: user.email,
        type: user.type,
      };
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        throw new HttpException("Expired token", HttpStatus.UNAUTHORIZED);
      } else {
        throw new HttpException(
          "Invalid or expired token",
          HttpStatus.UNAUTHORIZED
        );
      }
    }
  }
}

import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { UsersModule } from "../users/users.module";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { OAuth2Client } from "google-auth-library";

@Module({
  imports: [
    UsersModule,
    ConfigModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: "60m" },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    {
      provide: OAuth2Client,
      useFactory: (configService: ConfigService) => {
        return new OAuth2Client(configService.get<string>("GOOGLE_CLIENT_ID"));
      },
      inject: [ConfigService],
    },
  ],
  exports: [AuthService],
})
export class AuthModule {}

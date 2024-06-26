import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { PrismaModulePostgresql } from "./prisma-postgresql/prisma.module";
import { PrismaModuleMongodb } from "./prisma-mongodb/prisma.module";
import { UsersModule } from "./users/users.module";
import { AuthModule } from "./auth/auth.module";

@Module({
  imports: [
    PrismaModulePostgresql,
    PrismaModuleMongodb,
    UsersModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { PrismaModuleMongodb } from "./prisma-mongodb/prisma.module";
import { PrismaModulePostgresql } from "./prisma-postgresql/prisma.module";
import { UserModule } from "./user/user.module";

@Module({
  imports: [PrismaModulePostgresql, PrismaModuleMongodb, UserModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

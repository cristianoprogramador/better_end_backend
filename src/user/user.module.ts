import { Module } from "@nestjs/common";
import { UserService } from "./user.service";
import { UserController } from "./user.controller";
import { PrismaModulePostgresql } from "src/prisma-postgresql/prisma.module";
import { PrismaModuleMongodb } from "src/prisma-mongodb/prisma.module";

@Module({
  imports: [PrismaModulePostgresql, PrismaModuleMongodb],
  providers: [UserService],
  controllers: [UserController],
})
export class UserModule {}

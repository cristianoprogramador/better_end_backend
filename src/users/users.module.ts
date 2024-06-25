import { Module } from "@nestjs/common";
import { UsersService } from "./users.service";
import { UsersController } from "./users.controller";
import { PrismaModulePostgresql } from "../prisma-postgresql/prisma.module";
import { PrismaModuleMongodb } from "../prisma-mongodb/prisma.module";

@Module({
  imports: [PrismaModulePostgresql, PrismaModuleMongodb],
  providers: [UsersService],
  controllers: [UsersController],
})
export class UsersModule {}

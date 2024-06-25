import { Module } from "@nestjs/common";
import { PrismaServiceMongodb } from "./prisma.service";

@Module({
  providers: [PrismaServiceMongodb],
  exports: [PrismaServiceMongodb],
})
export class PrismaModuleMongodb {}

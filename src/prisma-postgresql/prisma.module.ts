import { Module } from "@nestjs/common";
import { PrismaServicePostgresql } from "./prisma.service";

@Module({
  providers: [PrismaServicePostgresql],
  exports: [PrismaServicePostgresql],
})
export class PrismaModulePostgresql {}

// src\order\order.module.ts

import { Module } from "@nestjs/common";
import { PrismaServicePostgresql } from "../prisma-postgresql/prisma.service";
import { OrderService } from "./order.service";
import { OrderController } from "./order.controller";
import { PrismaServiceMongodb } from "src/prisma-mongodb/prisma.service";

@Module({
  controllers: [OrderController],
  providers: [OrderService, PrismaServicePostgresql, PrismaServiceMongodb],
  exports: [OrderService],
})
export class OrderModule {}

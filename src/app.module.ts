import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { PrismaModulePostgresql } from "./prisma-postgresql/prisma.module";
import { PrismaModuleMongodb } from "./prisma-mongodb/prisma.module";
import { UsersModule } from "./users/users.module";
import { AuthModule } from "./auth/auth.module";
import { OrderModule } from "./order/order.module";
import { databaseProviders } from "./database.providers";
import { DatabaseModule } from "./database.module";

@Module({
  imports: [
    PrismaModulePostgresql,
    PrismaModuleMongodb,
    UsersModule,
    AuthModule,
    OrderModule,
    DatabaseModule,
  ],
  controllers: [AppController],
  providers: [...databaseProviders, AppService],
  exports: [...databaseProviders],
})
export class AppModule {}

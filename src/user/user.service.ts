import { Injectable } from "@nestjs/common";
import { PrismaServicePostgresql } from "../prisma-postgresql/prisma.service";
import { PrismaServiceMongodb } from "../prisma-mongodb/prisma.service";
import { Prisma as PrismaPostgresql } from "../../prisma-client-postgresql";
import { Prisma as PrismaMongodb } from "../../prisma-client-mongodb";

@Injectable()
export class UserService {
  constructor(
    private prismaPostgresql: PrismaServicePostgresql,
    private prismaMongodb: PrismaServiceMongodb
  ) {}

  async create(data: PrismaPostgresql.UserCreateInput) {
    const userInPostgresql = await this.prismaPostgresql.user.create({ data });
    const userInMongodb = await this.prismaMongodb.user.create({
      data: data as PrismaMongodb.UserCreateInput,
    });
    return { userInPostgresql, userInMongodb };
  }

  async findAll() {
    const usersInPostgresql = await this.prismaPostgresql.user.findMany();
    const usersInMongodb = await this.prismaMongodb.user.findMany();
    return { usersInPostgresql, usersInMongodb };
  }
}

import { Controller, Get, Post, Body } from "@nestjs/common";
import { UsersService } from "./users.service";
import { Prisma as PrismaPostgresql } from "../../prisma-client-postgresql";

@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async create(@Body() data: PrismaPostgresql.UserCreateInput) {
    return this.usersService.create(data);
  }

  @Get()
  async findAll() {
    return this.usersService.findAll();
  }
}

import { Controller, Get, Post, Body } from "@nestjs/common";
import { UserService } from "./user.service";
import { Prisma as PrismaPostgresql } from "../../prisma-client-postgresql";

@Controller("user")
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  async create(@Body() data: PrismaPostgresql.UserCreateInput) {
    return this.userService.create(data);
  }

  @Get()
  async findAll() {
    return this.userService.findAll();
  }
}

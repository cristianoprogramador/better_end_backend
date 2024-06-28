// src\users\users.service.ts

import { HttpException, HttpStatus, Injectable, Logger } from "@nestjs/common";
import { PrismaServicePostgresql } from "../prisma-postgresql/prisma.service";
import * as bcrypt from "bcrypt";
import { CreateUserDto } from "./dto/create-user.dto";

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private prismaPostgresql: PrismaServicePostgresql) {}

  async create(createUserDto: CreateUserDto) {
    const cipherText = createUserDto.password
      ? await this.encryptPassword(createUserDto.password)
      : null;

    const user = await this.prismaPostgresql.user.create({
      data: {
        ...createUserDto,
        password: cipherText,
      },
    });

    return user;
  }

  async findAll() {
    const usersInPostgresql = await this.prismaPostgresql.user.findMany();
    return { usersInPostgresql };
  }

  async findByUuid(uuid: string) {
    const user = await this.prismaPostgresql.user.findUnique({
      where: { uuid },
    });
    if (!user) {
      this.logger.warn(`No user found for UUID: ${uuid}`);
      throw new HttpException("User not found", HttpStatus.NOT_FOUND);
    }
    // this.logger.log(`User found for UUID: ${uuid}`);
    return user;
  }

  async findByEmailGoogle(email: string) {
    const user = await this.prismaPostgresql.user.findUnique({
      where: { email },
    });

    if (!user) {
      this.logger.log(`No user found for email: ${email}`);
      return null;
    }

    // this.logger.log(`User found for email: ${email}`);
    return user;
  }

  async encryptPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    return hashedPassword;
  }
}

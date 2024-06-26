import { Controller, Get, Post, Body } from "@nestjs/common";
import { UsersService } from "./users.service";
import { ApiTags } from "@nestjs/swagger";
import { CreateUserDto } from "./dto/create-user.dto";

@ApiTags("Users")
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  createUser(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  async findAll() {
    return this.usersService.findAll();
  }
}

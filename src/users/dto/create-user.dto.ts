import { ApiProperty } from "@nestjs/swagger";
import { UserType } from "prisma-client-postgresql";

export class CreateUserDto {
  @ApiProperty({
    example: "user@example.com",
    description: "User email address",
  })
  email: string;

  @ApiProperty({ example: "securePassword!", description: "User password" })
  password: string;

  @ApiProperty({
    example: "John Doe",
    description: "User's full name",
  })
  name: string;

  @ApiProperty({
    example: "https://example.com/profile.jpg",
    description: "URL of user's profile image",
  })
  profileImageUrl: string;

  @ApiProperty({
    enum: UserType,
    example: UserType.client,
    description: "User type",
  })
  type: UserType;

  @ApiProperty({
    example: "optional-uuid",
    required: false,
    description: "UUID of user details",
  })
  userDetailsUuid?: string;
}

// src\order\order.controller.ts

import { Controller, Post, Delete, Get } from "@nestjs/common";
import { OrderService } from "./order.service";
import * as path from "path";
import { OrderData, readExcel } from "src/utils/excelUtils";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
@ApiTags("Orders")
@Controller("orders")
export class OrderController {
  constructor(private orderService: OrderService) {}

  private readOrdersData(): OrderData[] {
    const excelFilePath = path.join(
      __dirname,
      "..",
      "mock",
      "orders_data.xlsx"
    );
    return readExcel(excelFilePath);
  }

  @Post("import")
  @ApiOperation({ summary: "Import orders into both PostgreSQL and MongoDB" })
  @ApiResponse({ status: 201, description: "Orders successfully imported." })
  @ApiResponse({ status: 400, description: "Invalid input data." })
  async importOrders() {
    const data = this.readOrdersData();
    await this.orderService.importOrdersPostgreSQL(data);
    await this.orderService.importOrdersMongoDB(data);
    return { message: "Orders imported successfully" };
  }

  @Post("importPostgreSQL")
  @ApiOperation({ summary: "Import orders into PostgreSQL" })
  @ApiResponse({
    status: 201,
    description: "Orders successfully imported into PostgreSQL.",
  })
  @ApiResponse({ status: 400, description: "Invalid input data." })
  async importOrdersPostgreSQL() {
    const data = this.readOrdersData();
    await this.orderService.importOrdersPostgreSQL(data);
    return { message: "Orders imported successfully into PostgreSQL" };
  }

  @Post("importMongoDB")
  @ApiOperation({ summary: "Import orders into MongoDB" })
  @ApiResponse({
    status: 201,
    description: "Orders successfully imported into MongoDB.",
  })
  @ApiResponse({ status: 400, description: "Invalid input data." })
  async importOrdersMongoDB() {
    const data = this.readOrdersData();
    await this.orderService.importOrdersMongoDB(data);
    return { message: "Orders imported successfully into MongoDB" };
  }

  @Delete("delete-all")
  @ApiOperation({ summary: "Delete all orders from both databases" })
  @ApiResponse({ status: 200, description: "All orders successfully deleted." })
  @ApiResponse({ status: 500, description: "Internal server error." })
  async deleteOrders() {
    await this.orderService.deleteAllOrders();
    return { message: "All orders deleted successfully" };
  }

  @Get("complexPostgreSQL")
  @ApiOperation({
    summary: "Get complex orders from PostgreSQL",
    description:
      "Retrieve orders that include products from the 'Fruits' category, and where the order status is 'Shipped'. This query demonstrates the performance of PostgreSQL with complex filters involving multiple joins and conditions.",
  })
  @ApiResponse({
    status: 200,
    description: "Orders fetched successfully from PostgreSQL.",
  })
  @ApiResponse({ status: 500, description: "Internal server error." })
  async getComplexOrdersPostgreSQL() {
    const orders = await this.orderService.getComplexOrdersPostgreSQL();
    return orders;
  }

  @Get("complexMongoDB")
  @ApiOperation({
    summary: "Get complex orders from MongoDB",
    description:
      "Retrieve orders that include products from the 'Fruits' category, and where the order status is 'Shipped'. This query demonstrates the performance of MongoDB with complex filters involving multiple lookups, unwinds, and match conditions.",
  })
  @ApiResponse({
    status: 200,
    description: "Orders fetched successfully from MongoDB.",
  })
  @ApiResponse({ status: 500, description: "Internal server error." })
  async getComplexOrdersMongoDB() {
    const orders = await this.orderService.getComplexOrdersMongoDB();
    return orders;
  }
}

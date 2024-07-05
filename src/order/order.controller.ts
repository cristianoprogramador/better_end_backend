// src\order\order.controller.ts

import { Controller, Post, Delete, Get, Put } from "@nestjs/common";
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

  @Get("/sizes")
  @ApiOperation({
    summary: "Get database sizes",
    description:
      "Retrieve the size of the databases in PostgreSQL and MongoDB.",
  })
  @ApiResponse({
    status: 200,
    description: "Database sizes fetched successfully.",
  })
  @ApiResponse({ status: 500, description: "Internal server error." })
  async getDatabaseSizes() {
    const postgresStats = await this.orderService.getPostgresDatabaseSize();
    const mongoStats = await this.orderService.getMongoDatabaseSize();
    return {
      postgres: postgresStats,
      mongo: mongoStats,
    };
  }

  @Put("updateStatusPostgreSQL")
  @ApiOperation({
    summary: "Update order statuses in PostgreSQL",
    description:
      "Update the status of all orders from 'Pending' to 'Updated' for the months of June and July in PostgreSQL, and also update the related customer's address.",
  })
  @ApiResponse({
    status: 200,
    description: "Order statuses updated successfully in PostgreSQL.",
  })
  @ApiResponse({ status: 500, description: "Internal server error." })
  async updateOrdersStatusPostgreSQL() {
    await this.orderService.updateOrdersStatusPostgreSQL();
    return { message: "Order statuses updated successfully in PostgreSQL" };
  }

  @Put("updateStatusMongoDB")
  @ApiOperation({
    summary: "Update order statuses in MongoDB",
    description:
      "Update the status of all orders from 'Pending' to 'Updated' for the months of June and July in MongoDB, and also update the related customer's address.",
  })
  @ApiResponse({
    status: 200,
    description: "Order statuses updated successfully in MongoDB.",
  })
  @ApiResponse({ status: 500, description: "Internal server error." })
  async updateOrdersStatusMongoDB() {
    await this.orderService.updateOrdersStatusMongoDB();
    return { message: "Order statuses updated successfully in MongoDB" };
  }

  @Delete("delete-old-orders-postgresql")
  @ApiOperation({
    summary: "Delete old orders from PostgreSQL",
    description:
      "Delete orders older than a certain date along with their order items.",
  })
  @ApiResponse({
    status: 200,
    description: "Old orders deleted successfully from PostgreSQL.",
  })
  @ApiResponse({ status: 500, description: "Internal server error." })
  async deleteOldOrdersPostgreSQL() {
    const result = await this.orderService.deleteOldOrdersPostgreSQL();
    return result;
  }

  @Delete("delete-old-orders-mongodb")
  @ApiOperation({
    summary: "Delete old orders from MongoDB",
    description:
      "Delete orders older than a certain date along with their order items.",
  })
  @ApiResponse({
    status: 200,
    description: "Old orders deleted successfully from MongoDB.",
  })
  @ApiResponse({ status: 500, description: "Internal server error." })
  async deleteOldOrdersMongoDB() {
    const result = await this.orderService.deleteOldOrdersMongoDB();
    return result;
  }
}

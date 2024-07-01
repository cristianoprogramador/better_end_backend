// src\order\order.controller.ts

import { Controller, Post, Delete } from "@nestjs/common";
import { OrderService } from "./order.service";
import * as path from "path";
import { OrderData, readExcel } from "src/utils/excelUtils";

@Controller("orders")
export class OrderController {
  constructor(private orderService: OrderService) {}

  @Post("import")
  async importOrders() {
    const excelFilePath = path.join(
      __dirname,
      "..",
      "mock",
      "orders_data.xlsx"
    );
    const data: OrderData[] = readExcel(excelFilePath);
    await this.orderService.importOrders(data);
    return { message: "Orders imported successfully" };
  }

  @Post("importPostgreSQL")
  async importOrdersPostgreSQL() {
    const excelFilePath = path.join(
      __dirname,
      "..",
      "mock",
      "orders_data.xlsx"
    );
    const data: OrderData[] = readExcel(excelFilePath);
    await this.orderService.importOrdersPostgreSQL(data);
    return { message: "Orders imported successfully" };
  }

  @Post("importOrdersMongoDB")
  async importOrdersMongoDB() {
    const excelFilePath = path.join(
      __dirname,
      "..",
      "mock",
      "orders_data.xlsx"
    );
    const data: OrderData[] = readExcel(excelFilePath);
    await this.orderService.importOrdersMongoDB(data);
    return { message: "Orders imported successfully" };
  }

  @Delete("delete")
  async deleteOrders() {
    await this.orderService.deleteAllOrders();
    return { message: "All orders deleted successfully" };
  }
}

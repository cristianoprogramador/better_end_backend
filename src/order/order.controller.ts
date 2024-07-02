// src\order\order.controller.ts

import { Controller, Post, Delete } from "@nestjs/common";
import { OrderService } from "./order.service";
import * as path from "path";
import { OrderData, readExcel } from "src/utils/excelUtils";

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
  async importOrders() {
    const data = this.readOrdersData();
    await this.orderService.importOrdersPostgreSQL(data);
    await this.orderService.importOrdersMongoDB(data);
    return { message: "Orders imported successfully" };
  }

  @Post("importPostgreSQL")
  async importOrdersPostgreSQL() {
    const data = this.readOrdersData();
    await this.orderService.importOrdersPostgreSQL(data);
    return { message: "Orders imported successfully" };
  }

  @Post("importMongoDB")
  async importOrdersMongoDB() {
    const data = this.readOrdersData();
    await this.orderService.importOrdersMongoDB(data);
    return { message: "Orders imported successfully" };
  }

  @Delete("delete")
  async deleteOrders() {
    await this.orderService.deleteAllOrders();
    return { message: "All orders deleted successfully" };
  }
}

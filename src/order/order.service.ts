// src\order\order.service.ts

import { Injectable, HttpException, HttpStatus } from "@nestjs/common";
import { PrismaServicePostgresql } from "src/prisma-postgresql/prisma.service";
import { OrderData } from "../utils/excelUtils";
import { PrismaServiceMongodb } from "src/prisma-mongodb/prisma.service";

@Injectable()
export class OrderService {
  constructor(
    private prismaPostgresql: PrismaServicePostgresql,
    private prismaMongodb: PrismaServiceMongodb
  ) {}

  private async isOrderAlreadyImported(orderId: string): Promise<boolean> {
    const order = await this.prismaPostgresql.order.findUnique({
      where: { id: orderId },
    });
    return order !== null;
  }

  async importOrders(data: OrderData[]): Promise<void> {
    for (const row of data) {
      const alreadyImported = await this.isOrderAlreadyImported(row.OrderID);
      if (alreadyImported) {
        throw new HttpException(
          `Order with ID ${row.OrderID} already imported.`,
          HttpStatus.BAD_REQUEST
        );
      }

      // PostgreSQL
      const customerPostgres = await this.prismaPostgresql.customer.upsert({
        where: { email: row.Email },
        update: {},
        create: {
          id: row.CustomerID,
          name: row.CustomerName,
          email: row.Email,
          phone: row.PhoneNumber,
          address: row.Address,
          city: row.City,
          state: row.State,
          zipCode: row.ZipCode,
          createdAt: new Date(row.OrderDate),
          updatedAt: new Date(row.OrderDate),
        },
      });

      const productPostgres = await this.prismaPostgresql.product.upsert({
        where: { id: row.ProductID },
        update: {},
        create: {
          id: row.ProductID,
          name: row.ProductName,
          category: {
            connectOrCreate: {
              where: { id: row.CategoryID },
              create: {
                id: row.CategoryID,
                name: row.CategoryName,
              },
            },
          },
          price: row.Price,
          createdAt: new Date(row.OrderDate),
          updatedAt: new Date(row.OrderDate),
        },
      });

      await this.prismaPostgresql.order.create({
        data: {
          id: row.OrderID,
          orderDate: new Date(row.OrderDate),
          customer: { connect: { id: customerPostgres.id } },
          shippingCost: row.ShippingCost,
          totalOrderValue: row.TotalOrderValue,
          status: row.OrderStatus,
          paymentMethod: row.PaymentMethod,
          items: {
            create: {
              product: { connect: { id: productPostgres.id } },
              quantity: row.Quantity,
              totalPrice: row.TotalProductPrice,
            },
          },
        },
      });

      // MongoDB
      const customerMongoDB = await this.prismaMongodb.customer.upsert({
        where: { email: row.Email },
        update: {},
        create: {
          id: row.CustomerID,
          name: row.CustomerName,
          email: row.Email,
          phone: row.PhoneNumber,
          address: row.Address,
          city: row.City,
          state: row.State,
          zipCode: row.ZipCode,
          createdAt: new Date(row.OrderDate),
          updatedAt: new Date(row.OrderDate),
        },
      });

      const categoryMongoDB = await this.prismaMongodb.category.upsert({
        where: { id: row.CategoryID },
        update: {},
        create: {
          id: row.CategoryID,
          name: row.CategoryName,
        },
      });

      const productMongoDB = await this.prismaMongodb.product.upsert({
        where: { id: row.ProductID },
        update: {},
        create: {
          id: row.ProductID,
          name: row.ProductName,
          categoryId: categoryMongoDB.id,
          price: row.Price,
          createdAt: new Date(row.OrderDate),
          updatedAt: new Date(row.OrderDate),
        },
      });

      const orderMongoDB = await this.prismaMongodb.order.upsert({
        where: { id: row.OrderID },
        update: {},
        create: {
          id: row.OrderID,
          orderDate: new Date(row.OrderDate),
          customerId: customerMongoDB.id,
          shippingCost: row.ShippingCost,
          totalOrderValue: row.TotalOrderValue,
          status: row.OrderStatus,
          paymentMethod: row.PaymentMethod,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      await this.prismaMongodb.orderItem.create({
        data: {
          orderId: orderMongoDB.id,
          productId: productMongoDB.id,
          quantity: row.Quantity,
          totalPrice: row.TotalProductPrice,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }
  }

  async deleteAllOrders(): Promise<void> {
    await this.prismaPostgresql.orderItem.deleteMany({});
    await this.prismaPostgresql.order.deleteMany({});
    await this.prismaPostgresql.product.deleteMany({});
    await this.prismaPostgresql.customer.deleteMany({});
    await this.prismaPostgresql.category.deleteMany({});

    // MongoDB
    await this.prismaMongodb.orderItem.deleteMany({});
    await this.prismaMongodb.order.deleteMany({});
    await this.prismaMongodb.product.deleteMany({});
    await this.prismaMongodb.customer.deleteMany({});
    await this.prismaMongodb.category.deleteMany({});
  }
}

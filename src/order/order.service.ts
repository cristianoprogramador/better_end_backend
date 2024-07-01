import { Injectable, Inject, HttpException, HttpStatus } from "@nestjs/common";
import { PrismaServicePostgresql } from "src/prisma-postgresql/prisma.service";
import { OrderData } from "../utils/excelUtils";
import { performance } from "perf_hooks";
import { Db } from "mongodb";

@Injectable()
export class OrderService {
  constructor(
    private prismaPostgresql: PrismaServicePostgresql,
    @Inject("MONGO_CONNECTION") private readonly db: Db
  ) {}

  private async isOrderAlreadyImported(orderId: string): Promise<boolean> {
    const order = await this.prismaPostgresql.order.findUnique({
      where: { id: orderId },
    });
    return order !== null;
  }

  async importOrdersPostgreSQL(data: OrderData[]): Promise<void> {
    const startTotalTime = performance.now();

    // Preparar categorias únicas
    const uniqueCategories = new Map<string, string>();
    for (const row of data) {
      if (!uniqueCategories.has(row.CategoryID)) {
        uniqueCategories.set(row.CategoryID, row.CategoryName);
      }
    }

    // Processamento PostgreSQL
    for (const row of data) {
      const alreadyImported = await this.isOrderAlreadyImported(row.OrderID);
      if (alreadyImported) {
        throw new HttpException(
          `Order with ID ${row.OrderID} already imported.`,
          HttpStatus.BAD_REQUEST
        );
      }

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
    }

    const endTotalTime = performance.now();

    function formatTime(ms: number): string {
      return `${(ms / 1000).toFixed(3)} s`;
    }

    console.log(
      `Total processing time for PostgreSQL: ${formatTime(endTotalTime - startTotalTime)}`
    );
  }

  async importOrdersMongoDB(data: OrderData[]): Promise<void> {
    const startTotalTime = performance.now();

    // Preparar categorias únicas
    const uniqueCategories = new Map<string, string>();
    for (const row of data) {
      if (!uniqueCategories.has(row.CategoryID)) {
        uniqueCategories.set(row.CategoryID, row.CategoryName);
      }
    }

    // Inserir categorias no MongoDB
    const categoryPromises = [];
    for (const [id, name] of uniqueCategories.entries()) {
      categoryPromises.push(
        this.db
          .collection("Category")
          .updateOne({ id }, { $set: { id, name } }, { upsert: true })
      );
    }
    await Promise.all(categoryPromises);

    // Processamento MongoDB
    const customerPromises = [];
    const productPromises = [];
    const orderPromises = [];
    const orderItemPromises = [];

    for (const row of data) {
      customerPromises.push(
        this.db.collection("Customer").updateOne(
          { email: row.Email },
          {
            $set: {
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
          },
          { upsert: true }
        )
      );

      productPromises.push(
        this.db.collection("Product").updateOne(
          { id: row.ProductID },
          {
            $set: {
              id: row.ProductID,
              name: row.ProductName,
              categoryId: row.CategoryID,
              price: row.Price,
              createdAt: new Date(row.OrderDate),
              updatedAt: new Date(row.OrderDate),
            },
          },
          { upsert: true }
        )
      );

      orderPromises.push(
        this.db.collection("Order").updateOne(
          { id: row.OrderID },
          {
            $set: {
              id: row.OrderID,
              orderDate: new Date(row.OrderDate),
              customerId: row.CustomerID,
              shippingCost: row.ShippingCost,
              totalOrderValue: row.TotalOrderValue,
              status: row.OrderStatus,
              paymentMethod: row.PaymentMethod,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          },
          { upsert: true }
        )
      );

      orderItemPromises.push(
        this.db.collection("OrderItem").updateOne(
          { id: `${row.OrderID}-${row.ProductID}` },
          {
            $set: {
              id: `${row.OrderID}-${row.ProductID}`,
              orderId: row.OrderID,
              productId: row.ProductID,
              quantity: row.Quantity,
              totalPrice: row.TotalProductPrice,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          },
          { upsert: true }
        )
      );
    }

    await Promise.all(customerPromises);
    await Promise.all(productPromises);
    await Promise.all(orderPromises);
    await Promise.all(orderItemPromises);

    const endTotalTime = performance.now();

    function formatTime(ms: number): string {
      return `${(ms / 1000).toFixed(3)} s`;
    }

    console.log(
      `Total processing time for MongoDB: ${formatTime(endTotalTime - startTotalTime)}`
    );
  }

  async deleteAllOrders(): Promise<void> {
    await this.prismaPostgresql.orderItem.deleteMany({});
    await this.prismaPostgresql.order.deleteMany({});
    await this.prismaPostgresql.product.deleteMany({});
    await this.prismaPostgresql.customer.deleteMany({});
    await this.prismaPostgresql.category.deleteMany({});

    await this.db.collection("Customer").deleteMany({});
    await this.db.collection("Product").deleteMany({});
    await this.db.collection("Category").deleteMany({});
    await this.db.collection("Order").deleteMany({});
    await this.db.collection("OrderItem").deleteMany({});
  }
}

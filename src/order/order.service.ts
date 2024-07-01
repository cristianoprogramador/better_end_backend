import { Injectable, HttpException, HttpStatus } from "@nestjs/common";
import { PrismaServicePostgresql } from "src/prisma-postgresql/prisma.service";
import { OrderData } from "../utils/excelUtils";
import { PrismaServiceMongodb } from "src/prisma-mongodb/prisma.service";
import { performance } from "perf_hooks";

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
    const startTotalTime = performance.now();
    let totalPostgresCustomerTime = 0;
    let totalPostgresProductTime = 0;
    let totalPostgresOrderTime = 0;

    let totalMongoCustomerTime = 0;
    let totalMongoCategoryTime = 0;
    let totalMongoProductTime = 0;
    let totalMongoOrderTime = 0;
    let totalMongoOrderItemTime = 0;

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
      const startMongoCategory = performance.now();
      categoryPromises.push(
        this.prismaMongodb.category.upsert({
          where: { id },
          update: {},
          create: { id, name },
        })
      );
      const endMongoCategory = performance.now();
      totalMongoCategoryTime += endMongoCategory - startMongoCategory;
    }
    await Promise.all(categoryPromises);

    // Processamento PostgreSQL
    for (const row of data) {
      const alreadyImported = await this.isOrderAlreadyImported(row.OrderID);
      if (alreadyImported) {
        throw new HttpException(
          `Order with ID ${row.OrderID} already imported.`,
          HttpStatus.BAD_REQUEST
        );
      }

      const startPostgresCustomer = performance.now();
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
      const endPostgresCustomer = performance.now();
      totalPostgresCustomerTime += endPostgresCustomer - startPostgresCustomer;

      const startPostgresProduct = performance.now();
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
      const endPostgresProduct = performance.now();
      totalPostgresProductTime += endPostgresProduct - startPostgresProduct;

      const startPostgresOrder = performance.now();
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
      const endPostgresOrder = performance.now();
      totalPostgresOrderTime += endPostgresOrder - startPostgresOrder;
    }

    // Processamento MongoDB
    const customerPromises = [];
    const productPromises = [];
    const orderPromises = [];
    const orderItemPromises = [];

    for (const row of data) {
      const startMongoCustomer = performance.now();
      customerPromises.push(
        this.prismaMongodb.customer.upsert({
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
        })
      );
      const endMongoCustomer = performance.now();
      totalMongoCustomerTime += endMongoCustomer - startMongoCustomer;

      const startMongoProduct = performance.now();
      productPromises.push(
        this.prismaMongodb.product.upsert({
          where: { id: row.ProductID },
          update: {},
          create: {
            id: row.ProductID,
            name: row.ProductName,
            categoryId: row.CategoryID,
            price: row.Price,
            createdAt: new Date(row.OrderDate),
            updatedAt: new Date(row.OrderDate),
          },
        })
      );
      const endMongoProduct = performance.now();
      totalMongoProductTime += endMongoProduct - startMongoProduct;

      const startMongoOrder = performance.now();
      orderPromises.push(
        this.prismaMongodb.order.upsert({
          where: { id: row.OrderID },
          update: {},
          create: {
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
        })
      );
      const endMongoOrder = performance.now();
      totalMongoOrderTime += endMongoOrder - startMongoOrder;

      const startMongoOrderItem = performance.now();
      orderItemPromises.push(
        this.prismaMongodb.orderItem.upsert({
          where: { id: `${row.OrderID}-${row.ProductID}` },
          update: {},
          create: {
            id: `${row.OrderID}-${row.ProductID}`,
            orderId: row.OrderID,
            productId: row.ProductID,
            quantity: row.Quantity,
            totalPrice: row.TotalProductPrice,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        })
      );
      const endMongoOrderItem = performance.now();
      totalMongoOrderItemTime += endMongoOrderItem - startMongoOrderItem;
    }

    await Promise.all(customerPromises);
    await Promise.all(productPromises);
    await Promise.all(orderPromises);
    await Promise.all(orderItemPromises);

    const endTotalTime = performance.now();

    function formatMilliseconds(ms: number): string {
      return `${ms.toLocaleString()} ms`;
    }

    console.log(
      `Total processing time: ${formatMilliseconds(endTotalTime - startTotalTime)}`
    );
    console.log(
      `PostgreSQL Customer total processing time: ${formatMilliseconds(totalPostgresCustomerTime)}`
    );
    console.log(
      `PostgreSQL Product total processing time: ${formatMilliseconds(totalPostgresProductTime)}`
    );
    console.log(
      `PostgreSQL Order total processing time: ${formatMilliseconds(totalPostgresOrderTime)}`
    );

    console.log(
      `MongoDB Customer total processing time: ${formatMilliseconds(totalMongoCustomerTime)}`
    );
    console.log(
      `MongoDB Category total processing time: ${formatMilliseconds(totalMongoCategoryTime)}`
    );
    console.log(
      `MongoDB Product total processing time: ${formatMilliseconds(totalMongoProductTime)}`
    );
    console.log(
      `MongoDB Order total processing time: ${formatMilliseconds(totalMongoOrderTime)}`
    );
    console.log(
      `MongoDB OrderItem total processing time: ${formatMilliseconds(totalMongoOrderItemTime)}`
    );
  }

  async importOrdersPostgreSQL(data: OrderData[]): Promise<void> {
    const startTotalTime = performance.now();
    let totalPostgresCustomerTime = 0;
    let totalPostgresProductTime = 0;
    let totalPostgresOrderTime = 0;

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

      const startPostgresCustomer = performance.now();
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
      const endPostgresCustomer = performance.now();
      totalPostgresCustomerTime += endPostgresCustomer - startPostgresCustomer;

      const startPostgresProduct = performance.now();
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
      const endPostgresProduct = performance.now();
      totalPostgresProductTime += endPostgresProduct - startPostgresProduct;

      const startPostgresOrder = performance.now();
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
      const endPostgresOrder = performance.now();
      totalPostgresOrderTime += endPostgresOrder - startPostgresOrder;
    }

    const endTotalTime = performance.now();

    function formatMilliseconds(ms: number): string {
      return `${ms.toLocaleString()} ms`;
    }

    console.log(
      `Total processing time: ${formatMilliseconds(endTotalTime - startTotalTime)}`
    );
    console.log(
      `PostgreSQL Customer total processing time: ${formatMilliseconds(totalPostgresCustomerTime)}`
    );
    console.log(
      `PostgreSQL Product total processing time: ${formatMilliseconds(totalPostgresProductTime)}`
    );
    console.log(
      `PostgreSQL Order total processing time: ${formatMilliseconds(totalPostgresOrderTime)}`
    );
  }

  async importOrdersMongoDB(data: OrderData[]): Promise<void> {
    const startTotalTime = performance.now();

    let totalMongoCustomerTime = 0;
    let totalMongoCategoryTime = 0;
    let totalMongoProductTime = 0;
    let totalMongoOrderTime = 0;
    let totalMongoOrderItemTime = 0;

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
      const startMongoCategory = performance.now();
      categoryPromises.push(
        this.prismaMongodb.category.upsert({
          where: { id },
          update: {},
          create: { id, name },
        })
      );
      const endMongoCategory = performance.now();
      totalMongoCategoryTime += endMongoCategory - startMongoCategory;
    }
    await Promise.all(categoryPromises);

    // Processamento MongoDB
    const customerPromises = [];
    const productPromises = [];
    const orderPromises = [];
    const orderItemPromises = [];

    for (const row of data) {
      const startMongoCustomer = performance.now();
      customerPromises.push(
        this.prismaMongodb.customer.upsert({
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
        })
      );
      const endMongoCustomer = performance.now();
      totalMongoCustomerTime += endMongoCustomer - startMongoCustomer;

      const startMongoProduct = performance.now();
      productPromises.push(
        this.prismaMongodb.product.upsert({
          where: { id: row.ProductID },
          update: {},
          create: {
            id: row.ProductID,
            name: row.ProductName,
            categoryId: row.CategoryID,
            price: row.Price,
            createdAt: new Date(row.OrderDate),
            updatedAt: new Date(row.OrderDate),
          },
        })
      );
      const endMongoProduct = performance.now();
      totalMongoProductTime += endMongoProduct - startMongoProduct;

      const startMongoOrder = performance.now();
      orderPromises.push(
        this.prismaMongodb.order.upsert({
          where: { id: row.OrderID },
          update: {},
          create: {
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
        })
      );
      const endMongoOrder = performance.now();
      totalMongoOrderTime += endMongoOrder - startMongoOrder;

      const startMongoOrderItem = performance.now();
      orderItemPromises.push(
        this.prismaMongodb.orderItem.upsert({
          where: { id: `${row.OrderID}-${row.ProductID}` },
          update: {},
          create: {
            id: `${row.OrderID}-${row.ProductID}`,
            orderId: row.OrderID,
            productId: row.ProductID,
            quantity: row.Quantity,
            totalPrice: row.TotalProductPrice,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        })
      );
      const endMongoOrderItem = performance.now();
      totalMongoOrderItemTime += endMongoOrderItem - startMongoOrderItem;
    }

    await Promise.all(customerPromises);
    await Promise.all(productPromises);
    await Promise.all(orderPromises);
    await Promise.all(orderItemPromises);

    const endTotalTime = performance.now();

    function formatMilliseconds(ms: number): string {
      return `${ms.toLocaleString()} ms`;
    }

    console.log(
      `Total processing time: ${formatMilliseconds(endTotalTime - startTotalTime)}`
    );

    console.log(
      `MongoDB Customer total processing time: ${formatMilliseconds(totalMongoCustomerTime)}`
    );
    console.log(
      `MongoDB Category total processing time: ${formatMilliseconds(totalMongoCategoryTime)}`
    );
    console.log(
      `MongoDB Product total processing time: ${formatMilliseconds(totalMongoProductTime)}`
    );
    console.log(
      `MongoDB Order total processing time: ${formatMilliseconds(totalMongoOrderTime)}`
    );
    console.log(
      `MongoDB OrderItem total processing time: ${formatMilliseconds(totalMongoOrderItemTime)}`
    );
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

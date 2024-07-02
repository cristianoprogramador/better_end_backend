import { Injectable, Inject } from "@nestjs/common";
import { PrismaServicePostgresql } from "src/prisma-postgresql/prisma.service";
import { OrderData } from "../utils/excelUtils";
import { performance } from "perf_hooks";
import { Db } from "mongodb";
import { v4 as uuidv4 } from "uuid"; // Importa a função de geração de UUID

@Injectable()
export class OrderService {
  constructor(
    private prismaPostgresql: PrismaServicePostgresql,
    @Inject("MONGO_CONNECTION") private readonly db: Db
  ) {}

  async importOrdersPostgreSQL(data: OrderData[]): Promise<void> {
    const startTotalTime = performance.now();

    // Maps para evitar inserções duplicadas
    const categoryMap = new Map();
    const customerMap = new Map();
    const productMap = new Map();
    const orderMap = new Map();

    // Preparar e inserir categorias, produtos e clientes de forma eficiente
    const categoryPromises = [];
    const customerPromises = [];
    const productPromises = [];
    const orderPromises = [];
    const orderItemPromises = [];

    data.forEach((row) => {
      // Categorias
      if (!categoryMap.has(row.CategoryID)) {
        categoryMap.set(row.CategoryID, row.CategoryName);
        categoryPromises.push(
          this.prismaPostgresql.category.upsert({
            where: { id: row.CategoryID },
            update: {},
            create: { id: row.CategoryID, name: row.CategoryName },
          })
        );
      }

      // Clientes
      if (!customerMap.has(row.CustomerID)) {
        customerMap.set(row.CustomerID, true);
        customerPromises.push(
          this.prismaPostgresql.customer.upsert({
            where: { id: row.CustomerID },
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
      }
    });

    // Aguarde as inserções de categorias e clientes antes de inserir produtos
    await Promise.all([...categoryPromises, ...customerPromises]);

    data.forEach((row) => {
      // Produtos
      if (!productMap.has(row.ProductID)) {
        productMap.set(row.ProductID, true);
        productPromises.push(
          this.prismaPostgresql.product.upsert({
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
      }
    });

    // Aguarde as inserções de produtos antes de inserir ordens e itens de pedido
    await Promise.all(productPromises);

    data.forEach((row) => {
      // Pedidos
      if (!orderMap.has(row.OrderID)) {
        orderMap.set(row.OrderID, true);
        orderPromises.push(
          this.prismaPostgresql.order.upsert({
            where: { id: row.OrderID },
            update: {},
            create: {
              id: row.OrderID,
              orderDate: new Date(row.OrderDate),
              customer: { connect: { id: row.CustomerID } },
              shippingCost: row.ShippingCost,
              totalOrderValue: row.TotalOrderValue,
              status: row.OrderStatus,
              paymentMethod: row.PaymentMethod,
            },
          })
        );
      }

      // Itens de Pedido
      orderItemPromises.push(
        this.prismaPostgresql.orderItem.upsert({
          where: { id: uuidv4() },
          update: {},
          create: {
            id: uuidv4(),
            order: { connect: { id: row.OrderID } },
            product: { connect: { id: row.ProductID } },
            quantity: row.Quantity,
            totalPrice: row.TotalProductPrice,
            createdAt: new Date(row.OrderDate),
            updatedAt: new Date(row.OrderDate),
          },
        })
      );
    });

    await Promise.all(orderPromises);
    await Promise.all(orderItemPromises);

    const endTotalTime = performance.now();
    console.log(
      `Total processing time for PostgreSQL: ${((endTotalTime - startTotalTime) / 1000).toFixed(3)} s`
    );
  }

  async importOrdersMongoDB(data: OrderData[]): Promise<void> {
    const startTotalTime = performance.now();

    // Carrega os documentos existentes para comparação
    const allCategories = new Map(
      (await this.db.collection("Category").find({}).toArray()).map((doc) => [
        doc.id,
        doc.name,
      ])
    );
    const allCustomers = new Map(
      (await this.db.collection("Customer").find({}).toArray()).map((doc) => [
        doc.email,
        doc,
      ])
    );
    const allProducts = new Map(
      (await this.db.collection("Product").find({}).toArray()).map((doc) => [
        doc.id,
        doc,
      ])
    );

    const categoryOps = [];
    const customerOps = [];
    const productOps = [];
    const orderOps = [];
    const orderItemOps = [];
    const batchSize = 1000; // Tamanho do lote para operações de bulk

    data.forEach((row) => {
      // Categorias
      if (
        !allCategories.has(row.CategoryID) ||
        allCategories.get(row.CategoryID) !== row.CategoryName
      ) {
        categoryOps.push({
          updateOne: {
            filter: { id: row.CategoryID },
            update: { $set: { name: row.CategoryName } },
            upsert: true,
          },
        });
      }

      // Clientes
      const currentCustomer = allCustomers.get(row.Email);
      if (
        !currentCustomer ||
        Object.entries(currentCustomer).some(
          ([key, value]) => row[key] !== value
        )
      ) {
        customerOps.push({
          updateOne: {
            filter: { email: row.Email },
            update: {
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
            upsert: true,
          },
        });
      }

      // Produtos
      const currentProduct = allProducts.get(row.ProductID);
      if (
        !currentProduct ||
        Object.entries(currentProduct).some(
          ([key, value]) => row[key] !== value
        )
      ) {
        productOps.push({
          updateOne: {
            filter: { id: row.ProductID },
            update: {
              $set: {
                id: row.ProductID,
                name: row.ProductName,
                categoryId: row.CategoryID,
                price: row.Price,
                createdAt: new Date(row.OrderDate),
                updatedAt: new Date(row.OrderDate),
              },
            },
            upsert: true,
          },
        });
      }

      // Pedidos
      orderOps.push({
        updateOne: {
          filter: { id: row.OrderID },
          update: {
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
          upsert: true,
        },
      });

      // Itens do Pedido
      orderItemOps.push({
        updateOne: {
          filter: { id: uuidv4() }, // Gera um UUID válido para o item de pedido
          update: {
            $set: {
              id: uuidv4(), // Gera um UUID válido para o item de pedido
              orderId: row.OrderID,
              productId: row.ProductID,
              quantity: row.Quantity,
              totalPrice: row.TotalProductPrice,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          },
          upsert: true,
        },
      });

      // Executar operações de bulk em lotes
      if (categoryOps.length >= batchSize) {
        this.db
          .collection("Category")
          .bulkWrite(categoryOps, { ordered: false });
        categoryOps.length = 0;
      }
      if (customerOps.length >= batchSize) {
        this.db
          .collection("Customer")
          .bulkWrite(customerOps, { ordered: false });
        customerOps.length = 0;
      }
      if (productOps.length >= batchSize) {
        this.db.collection("Product").bulkWrite(productOps, { ordered: false });
        productOps.length = 0;
      }
      if (orderOps.length >= batchSize) {
        this.db.collection("Order").bulkWrite(orderOps, { ordered: false });
        orderOps.length = 0;
      }
      if (orderItemOps.length >= batchSize) {
        this.db
          .collection("OrderItem")
          .bulkWrite(orderItemOps, { ordered: false });
        orderItemOps.length = 0;
      }
    });

    // Executar quaisquer operações de bulk restantes
    if (categoryOps.length > 0) {
      await this.db
        .collection("Category")
        .bulkWrite(categoryOps, { ordered: false });
    }
    if (customerOps.length > 0) {
      await this.db
        .collection("Customer")
        .bulkWrite(customerOps, { ordered: false });
    }
    if (productOps.length > 0) {
      await this.db
        .collection("Product")
        .bulkWrite(productOps, { ordered: false });
    }
    if (orderOps.length > 0) {
      await this.db.collection("Order").bulkWrite(orderOps, { ordered: false });
    }
    if (orderItemOps.length > 0) {
      await this.db
        .collection("OrderItem")
        .bulkWrite(orderItemOps, { ordered: false });
    }

    const endTotalTime = performance.now();
    console.log(
      `Total processing time for MongoDB: ${((endTotalTime - startTotalTime) / 1000).toFixed(3)} s`
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

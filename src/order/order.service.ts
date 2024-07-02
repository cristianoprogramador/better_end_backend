import { Injectable, Inject } from "@nestjs/common";
import { PrismaServicePostgresql } from "src/prisma-postgresql/prisma.service";
import { OrderData } from "../utils/excelUtils";
import { performance } from "perf_hooks";
import { Db } from "mongodb";
import { v4 as uuidv4 } from "uuid";
import { standardizeOrderOutput } from "src/utils/orderOutput";

@Injectable()
export class OrderService {
  constructor(
    private prismaPostgresql: PrismaServicePostgresql,
    @Inject("MONGO_CONNECTION") private readonly db: Db
  ) {}

  // Function to import orders to PostgreSQL
  async importOrdersPostgreSQL(data: OrderData[]): Promise<void> {
    const startTotalTime = performance.now();

    // Insert Categories in Bulk
    const categories = data.map((row) => ({
      id: row.CategoryID,
      name: row.CategoryName,
    }));

    await this.prismaPostgresql.category.createMany({
      data: categories,
      skipDuplicates: true,
    });

    // Insert Customers in Bulk
    const customers = data.map((row) => ({
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
    }));

    await this.prismaPostgresql.customer.createMany({
      data: customers,
      skipDuplicates: true,
    });

    // Insert Products in Bulk
    const products = data.map((row) => ({
      id: row.ProductID,
      name: row.ProductName,
      categoryId: row.CategoryID,
      price: row.Price,
      createdAt: new Date(row.OrderDate),
      updatedAt: new Date(row.OrderDate),
    }));

    await this.prismaPostgresql.product.createMany({
      data: products,
      skipDuplicates: true,
    });

    // Prepare Orders and Order Items for Bulk Insertion
    const orders = new Map();
    const orderItems = [];

    data.forEach((row) => {
      if (!orders.has(row.OrderID)) {
        orders.set(row.OrderID, {
          id: row.OrderID,
          orderDate: new Date(row.OrderDate),
          customerId: row.CustomerID,
          shippingCost: row.ShippingCost,
          totalOrderValue: row.TotalOrderValue,
          status: row.OrderStatus,
          paymentMethod: row.PaymentMethod,
        });
      }

      orderItems.push({
        id: uuidv4(),
        orderId: row.OrderID,
        productId: row.ProductID,
        quantity: row.Quantity,
        totalPrice: row.TotalProductPrice,
        createdAt: new Date(row.OrderDate),
        updatedAt: new Date(row.OrderDate),
      });
    });

    // Insert Orders in Bulk
    await this.prismaPostgresql.order.createMany({
      data: Array.from(orders.values()),
      skipDuplicates: true,
    });

    // Insert Order Items in Bulk
    await this.prismaPostgresql.orderItem.createMany({
      data: orderItems,
      skipDuplicates: true,
    });

    const endTotalTime = performance.now();
    console.log(
      `Total processing time for PostgreSQL: ${((endTotalTime - startTotalTime) / 1000).toFixed(3)} s`
    );
  }

  // Function to import orders to MongoDB
  async importOrdersMongoDB(data: OrderData[]): Promise<void> {
    const startTotalTime = performance.now();

    try {
      // Ensure indexes are created for the collections
      await this.ensureIndexes();

      // Use Map to ensure uniqueness of data to be inserted
      const allCategories = new Map();
      const allCustomers = new Map();
      const allProducts = new Map();
      const allOrders = new Map();
      const allOrderItems = new Map();

      const batchSize = 5000; // Batch size for bulk operations

      data.forEach((row) => {
        // Categories
        if (!allCategories.has(row.CategoryID)) {
          allCategories.set(row.CategoryID, {
            updateOne: {
              filter: { id: row.CategoryID },
              update: { $set: { id: row.CategoryID, name: row.CategoryName } },
              upsert: true,
            },
          });
        }

        // Customers
        if (!allCustomers.has(row.CustomerID)) {
          allCustomers.set(row.CustomerID, {
            updateOne: {
              filter: { id: row.CustomerID },
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

        // Products
        if (!allProducts.has(row.ProductID)) {
          allProducts.set(row.ProductID, {
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

        // Orders
        if (!allOrders.has(row.OrderID)) {
          allOrders.set(row.OrderID, {
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
        }

        // Order Items
        const orderItemId = `${row.OrderID}-${row.ProductID}`;
        if (!allOrderItems.has(orderItemId)) {
          allOrderItems.set(orderItemId, {
            updateOne: {
              filter: { id: orderItemId },
              update: {
                $set: {
                  id: orderItemId,
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
        }
      });

      // Execute bulk operations in parallel for each collection
      const categoryOps = Array.from(allCategories.values());
      const customerOps = Array.from(allCustomers.values());
      const productOps = Array.from(allProducts.values());
      const orderOps = Array.from(allOrders.values());
      const orderItemOps = Array.from(allOrderItems.values());

      const executeBulkOperations = async (ops, collectionName) => {
        for (let i = 0; i < ops.length; i += batchSize) {
          const batch = ops.slice(i, i + batchSize);
          await this.db
            .collection(collectionName)
            .bulkWrite(batch, { ordered: false });
        }
      };

      await Promise.all([
        executeBulkOperations(categoryOps, "Category"),
        executeBulkOperations(customerOps, "Customer"),
        executeBulkOperations(productOps, "Product"),
        executeBulkOperations(orderOps, "Order"),
        executeBulkOperations(orderItemOps, "OrderItem"),
      ]);

      const endTotalTime = performance.now();
      console.log(
        `Total processing time for MongoDB: ${((endTotalTime - startTotalTime) / 1000).toFixed(3)} s`
      );
    } catch (error) {
      console.error("Error importing orders to MongoDB:", error);
      throw error;
    }
  }

  // Function to ensure indexes exist on MongoDB collections
  async ensureIndexes() {
    const collections = await this.db.listCollections().toArray();
    const collectionNames = collections.map((col) => col.name);

    const createIndexIfNotExists = async (
      collectionName: string,
      indexSpec: any,
      options: any
    ) => {
      if (collectionNames.includes(collectionName)) {
        const indexes = await this.db.collection(collectionName).indexes();
        const indexExists = indexes.some(
          (index) =>
            index.key &&
            Object.keys(index.key).join(",") ===
              Object.keys(indexSpec).join(",")
        );

        if (!indexExists) {
          await this.db
            .collection(collectionName)
            .createIndex(indexSpec, options);
        }
      } else {
        await this.db
          .collection(collectionName)
          .createIndex(indexSpec, options);
      }
    };

    await createIndexIfNotExists("Category", { id: 1 }, { unique: true });
    await createIndexIfNotExists("Customer", { email: 1 }, { unique: true });
    await createIndexIfNotExists("Product", { id: 1 }, { unique: true });
    await createIndexIfNotExists("Order", { id: 1 }, { unique: true });
    await createIndexIfNotExists("OrderItem", { id: 1 }, { unique: true });
  }

  // Function to delete all orders from both PostgreSQL and MongoDB
  async deleteAllOrders(): Promise<void> {
    try {
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
    } catch (error) {
      console.error("Error deleting all orders:", error);
      throw error;
    }
  }

  async getComplexOrdersPostgreSQL(): Promise<any> {
    const startTotalTime = performance.now();

    const orders = await this.prismaPostgresql.order.findMany({
      where: {
        status: "Shipped",
        items: {
          some: {
            product: {
              category: {
                name: "Fruits",
              },
              price: {
                gt: 15,
              },
            },
          },
        },
      },
      include: {
        customer: true,
        items: {
          include: {
            product: {
              include: {
                category: true,
              },
            },
          },
        },
      },
    });

    const filteredOrders = orders.map((order) => ({
      ...order,
      items: order.items.filter(
        (item) =>
          item.product.category.name === "Fruits" && item.product.price > 15
      ),
    }));

    const endTotalTime = performance.now();
    console.log(
      `Total processing time for PostgreSQL: ${((endTotalTime - startTotalTime) / 1000).toFixed(3)} s`
    );

    return standardizeOrderOutput(filteredOrders);
  }

  async getComplexOrdersMongoDB(): Promise<any> {
    const startTotalTime = performance.now();

    const orders = await this.db
      .collection("Order")
      .aggregate([
        {
          $match: {
            status: "Shipped",
          },
        },
        {
          $lookup: {
            from: "Customer",
            localField: "customerId",
            foreignField: "id",
            as: "customer",
          },
        },
        {
          $unwind: "$customer",
        },
        {
          $lookup: {
            from: "OrderItem",
            localField: "id",
            foreignField: "orderId",
            as: "items",
          },
        },
        {
          $unwind: "$items",
        },
        {
          $lookup: {
            from: "Product",
            localField: "items.productId",
            foreignField: "id",
            as: "productDetails",
          },
        },
        {
          $unwind: "$productDetails",
        },
        {
          $lookup: {
            from: "Category",
            localField: "productDetails.categoryId",
            foreignField: "id",
            as: "categoryDetails",
          },
        },
        {
          $unwind: "$categoryDetails",
        },
        {
          $match: {
            "categoryDetails.name": "Fruits",
            "productDetails.price": { $gt: 15 },
          },
        },
        {
          $group: {
            _id: "$id",
            orderId: { $first: "$id" },
            orderDate: { $first: "$orderDate" },
            customer: { $first: "$customer" },
            shippingCost: { $first: "$shippingCost" },
            totalOrderValue: { $first: "$totalOrderValue" },
            status: { $first: "$status" },
            paymentMethod: { $first: "$paymentMethod" },
            items: {
              $push: {
                productId: "$items.productId",
                productName: "$productDetails.name",
                category: {
                  id: "$categoryDetails.id",
                  name: "$categoryDetails.name",
                },
                price: "$productDetails.price",
                quantity: "$items.quantity",
                totalPrice: "$items.totalPrice",
              },
            },
          },
        },
      ])
      .toArray();

    const endTotalTime = performance.now();
    console.log(
      `Total processing time for MongoDB: ${((endTotalTime - startTotalTime) / 1000).toFixed(3)} s`
    );

    return standardizeOrderOutput(orders);
  }
}

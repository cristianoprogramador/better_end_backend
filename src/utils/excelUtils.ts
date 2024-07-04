import * as xlsx from "xlsx";

interface OrderData {
  OrderID: string;
  OrderDate: Date;
  CustomerID: string;
  CustomerName: string;
  Email: string;
  PhoneNumber: string;
  Address: string;
  City: string;
  State: string;
  ZipCode: string;
  ProductID: string;
  ProductName: string;
  CategoryID: string;
  CategoryName: string;
  Price: number;
  Quantity: number;
  TotalProductPrice: number;
  ShippingCost: number;
  TotalOrderValue: number;
  OrderStatus: string;
  PaymentMethod: string;
}

function excelDateToJSDate(excelDate: number): Date {
  const date = new Date((excelDate - (25567 + 1)) * 86400 * 1000);
  return date;
}

function readExcel(filePath: string): OrderData[] {
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const jsonData: any[] = xlsx.utils.sheet_to_json(sheet);

  const data: OrderData[] = jsonData.map((row) => ({
    OrderID: row["OrderID"],
    OrderDate: excelDateToJSDate(row["OrderDate"]),
    CustomerID: row["CustomerID"],
    CustomerName: row["CustomerName"],
    Email: row["Email"],
    PhoneNumber: row["PhoneNumber"],
    Address: row["Address"],
    City: row["City"],
    State: row["State"],
    ZipCode: row["ZipCode"],
    ProductID: row["ProductID"],
    ProductName: row["ProductName"],
    CategoryID: row["CategoryID"],
    CategoryName: row["CategoryName"],
    Price: row["Price"],
    Quantity: row["Quantity"],
    TotalProductPrice: row["TotalProductPrice"],
    ShippingCost: row["ShippingCost"],
    TotalOrderValue: row["TotalOrderValue"],
    OrderStatus: row["OrderStatus"],
    PaymentMethod: row["PaymentMethod"],
  }));

  return data;
}

export { readExcel, OrderData };

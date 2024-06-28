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

function readExcel(filePath: string): OrderData[] {
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data: OrderData[] = xlsx.utils.sheet_to_json(sheet);
  return data;
}

export { readExcel, OrderData };

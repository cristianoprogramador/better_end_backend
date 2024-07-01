import pandas as pd
import uuid
from faker import Faker
import random

fake = Faker()

num_records = 4000

# Listas pré-definidas de produtos e categorias de supermercado
products = [
    ("Apple", "Fruits"),
    ("Banana", "Fruits"),
    ("Carrot", "Vegetables"),
    ("Tomato", "Vegetables"),
    ("Chicken Breast", "Meat"),
    ("Beef Steak", "Meat"),
    ("Milk", "Dairy"),
    ("Cheese", "Dairy"),
    ("Bread", "Bakery"),
    ("Cake", "Bakery")
]

# Dicionários para armazenar IDs únicos
product_ids = {name: str(uuid.uuid4()) for name, _ in products}
category_ids = {category: str(uuid.uuid4()) for _, category in set(products)}

data = []

for _ in range(num_records):
    customer_id = str(uuid.uuid4())
    order_id = str(uuid.uuid4())

    # Selecionar produto e categoria aleatórios
    product_name, category_name = random.choice(products)
    product_id = product_ids[product_name]
    category_id = category_ids[category_name]

    order_date = fake.date_between(start_date='-2y', end_date='today')
    customer_name = fake.name()
    email = fake.email()
    phone_number = fake.phone_number()
    address = fake.street_address()
    city = fake.city()
    state = fake.state_abbr()
    zip_code = fake.zipcode()
    price = round(random.uniform(1.0, 100.0), 2)
    quantity = random.randint(1, 10)
    total_product_price = round(price * quantity, 2)
    shipping_cost = round(random.uniform(5.0, 20.0), 2)
    total_order_value = round(total_product_price + shipping_cost, 2)
    order_status = random.choice(["Pending", "Shipped", "Delivered", "Cancelled"])
    payment_method = random.choice(["Credit Card", "PayPal", "Bank Transfer"])

    data.append([order_id, order_date, customer_id, customer_name, email, phone_number, address, city, state, zip_code, product_id, product_name, category_id, category_name, price, quantity, total_product_price, shipping_cost, total_order_value, order_status, payment_method])

df = pd.DataFrame(data, columns=["OrderID", "OrderDate", "CustomerID", "CustomerName", "Email", "PhoneNumber", "Address", "City", "State", "ZipCode", "ProductID", "ProductName", "CategoryID", "CategoryName", "Price", "Quantity", "TotalProductPrice", "ShippingCost", "TotalOrderValue", "OrderStatus", "PaymentMethod"])

df.to_excel("orders_data.xlsx", index=False)

print("Planilha 'orders_data.xlsx' criada com sucesso!")

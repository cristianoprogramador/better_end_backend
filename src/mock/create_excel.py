import pandas as pd
import uuid
from faker import Faker
import random

fake = Faker()

num_records = 2500  # Fewer orders, but each order has multiple items

# Pre-defined lists of supermarket products and categories
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

# Dictionaries for storing unique IDs
product_ids = {name: str(uuid.uuid4()) for name, _ in products}
category_ids = {category: str(uuid.uuid4()) for _, category in set(products)}

# Set for storing unique emails
used_emails = set()

data = []

for _ in range(num_records):
    customer_id = str(uuid.uuid4())
    order_id = str(uuid.uuid4())

    # Ensure unique email
    email = fake.email()
    while email in used_emails:
        email = fake.email()
    used_emails.add(email)

    # General customer and order info
    customer_name = fake.name()
    order_date = fake.date_between(start_date='-2y', end_date='today')
    phone_number = fake.phone_number()
    address = fake.street_address()
    city = fake.city()
    state = fake.state_abbr()
    zip_code = fake.zipcode()
    order_status = random.choice(["Pending", "Shipped", "Delivered", "Cancelled"])
    payment_method = random.choice(["Credit Card", "PayPal", "Bank Transfer"])

    num_products = random.randint(1, 5)  # Random number of products per order
    total_order_value = 0
    products_list = []

    for _ in range(num_products):
        product_name, category_name = random.choice(products)
        product_id = product_ids[product_name]
        category_id = category_ids[category_name]
        price = round(random.uniform(1.0, 100.0), 2)
        quantity = random.randint(1, 10)
        total_product_price = round(price * quantity, 2)
        total_order_value += total_product_price

        # Collect individual product info
        products_list.append([product_id, product_name, category_id, category_name, price, quantity, total_product_price])

    shipping_cost = round(random.uniform(5.0, 20.0), 2)
    total_order_value += shipping_cost

    # Append data for each product in the order
    for product in products_list:
        data.append([
            order_id, order_date, customer_id, customer_name, email, phone_number, address, city, state, zip_code,
            product[0], product[1], product[2], product[3], product[4], product[5], product[6],
            order_status, payment_method, shipping_cost, total_order_value
        ])

columns=["OrderID", "OrderDate", "CustomerID", "CustomerName", "Email", "PhoneNumber", "Address", "City", "State", "ZipCode", "ProductID", "ProductName", "CategoryID", "CategoryName", "Price", "Quantity", "TotalProductPrice", "OrderStatus", "PaymentMethod", "ShippingCost", "TotalOrderValue"]
df = pd.DataFrame(data, columns=columns)

df.to_excel("orders_data.xlsx", index=False)

print("Planilha 'orders_data.xlsx' criada com sucesso!")

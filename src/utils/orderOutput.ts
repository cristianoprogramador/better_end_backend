export function standardizeOrderOutput(orders: any[]): any[] {
  return orders.map((order) => ({
    orderId: order.id || order._id || order.orderId,
    orderDate: order.orderDate || order.order_date,
    customer: {
      id: order.customer?.id || order.customer_id || "",
      name: order.customer?.name || "",
      email: order.customer?.email || "",
      phone: order.customer?.phone || "",
      address: order.customer?.address || "",
      city: order.customer?.city || "",
      state: order.customer?.state || "",
      zipCode: order.customer?.zipCode || order.customer?.zip_code || "",
    },
    shippingCost: order.shippingCost || order.shipping_cost,
    totalOrderValue: order.totalOrderValue || order.total_order_value,
    status: order.status,
    paymentMethod: order.paymentMethod || order.payment_method,
    items: (order.items || []).map((item) => ({
      productId: item.product?.id || item.product_id,
      productName: item.product?.name || "",
      category: {
        id: item.product?.category?.id || item.category_id || "",
        name: item.product?.category?.name || "",
      },
      price: item.product?.price || 0,
      quantity: item.quantity,
      totalPrice: item.totalPrice || item.total_price,
    })),
  }));
}

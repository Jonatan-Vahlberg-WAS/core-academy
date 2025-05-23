const Order = require("../../models/Order");
const { faker } = require("@faker-js/faker");

/**
 * Order factory to generate test order data using Faker
 */
class OrderFactory {
  /**
   * Generate fake order data
   * @param {Object} overrides - Data to override defaults
   * @returns {Object} - Fake order data
   */
  static generate(overrides = {}) {
    return {
      status: faker.helpers.arrayElement(["pending", "completed", "cancelled"]),
      paymentMethod: faker.helpers.arrayElement([
        "credit_card",
        "paypal",
        "bank_transfer",
      ]),
      paymentStatus: faker.helpers.arrayElement([
        "pending",
        "completed",
        "failed",
      ]),
      purchasedAt: faker.date.recent(),
      completedAt: faker.date.recent(),
      cancelledAt: undefined,
      notes: faker.lorem.sentence(),
      ...overrides,
    };
  }

  static generateWithoutTimeStamps(overrides = {}) {
    return {
      ...this.generate(overrides),
      purchasedAt: undefined,
      completedAt: undefined,
      cancelledAt: undefined,
    };
  }

  static generateMany(count = 2, overrides = {}, withoutTimeStamps = false) {
    if (withoutTimeStamps) {
      return Array.from({ length: count }, () => this.generateWithoutTimeStamps({ ...overrides}));
    }
    return Array.from({ length: count }, () => this.generate({ ...overrides}));
  }

  /**
   * Create an order with fake data
   * @param {Object} overrides - Data to override defaults
   * @returns {Promise<Order>} - Created order instance
   */
  static async create(overrides = {}, withoutTimeStamps = false) {
    const orderData = withoutTimeStamps ? this.generateWithoutTimeStamps(overrides) : this.generate(overrides);
    return await Order.create(orderData);
  }

  /**
   * Create multiple orders
   * @param {number} count - Number of orders to create
   * @param {Object} overrides - Base data to use for all orders
   * @returns {Promise<Array<Order>>} - Array of created orders
   */
  static async createMany(count = 2, overrides = {}, withoutTimeStamps = false) {
    const orders = [];
    for (let i = 0; i < count; i++) {
      orders.push(await this.create(overrides, withoutTimeStamps));
    }
    return orders;
  }

  /**
   * Build an order instance without saving to database
   * @param {Object} overrides - Data to override defaults
   * @returns {Order} - Order instance
   */
  static build(overrides = {}) {
    const orderData = this.generate(overrides);
    return new Order(orderData);
  }
}

module.exports = OrderFactory;

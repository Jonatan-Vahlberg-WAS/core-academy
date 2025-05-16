const Order = require("../../models/Order");
const Mail = require("../../models/Mail")
const OrderFactory = require("../factories/orderFactory");
const UserFactory = require("../factories/userFactory");
const CourseFactory = require("../factories/courseFactory");

describe("Order Model", () => {
  afterEach(async () => {
    // Clear the orders collection after each test
    await Order.deleteMany({});
  });

  it("should create a valid order with user and courses", async () => {
    // Create a user and courses first
    const user = await UserFactory.create();
    const courses = await CourseFactory.createMany(2);

    const orderData = OrderFactory.generate({
      user: user._id,
      courses: courses.map((course) => course._id),
    });

    const order = await Order.create(orderData);

    expect(order.user.toString()).toBe(user._id.toString());
    expect(order.courses.map((c) => c.toString())).toEqual(
      expect.arrayContaining(courses.map((c) => c._id.toString()))
    );
    expect(order.status).toBe(orderData.status);
    expect(order.paymentMethod).toBe(orderData.paymentMethod);
    expect(order.paymentStatus).toBe(orderData.paymentStatus);
    expect(order.notes).toBe(orderData.notes);
  });

  it("should validate required fields", async () => {
    const invalidOrder = {};

    try {
      await Order.create(invalidOrder);
      fail("Should have thrown validation error");
    } catch (error) {
      expect(error.errors.user).toBeDefined();
      expect(error.errors.courses).toBeDefined();
      expect(error.errors.paymentMethod).toBeDefined();
    }
  });

  it("should validate status enum values", async () => {
    const user = await UserFactory.create();
    const courses = await CourseFactory.createMany(1);

    const orderData = OrderFactory.generate({
      user: user._id,
      courses: courses.map((course) => course._id),
      status: "invalid-status",
    });

    try {
      await Order.create(orderData);
      fail("Should have thrown validation error");
    } catch (error) {
      expect(error.errors.status).toBeDefined();
    }
  });

  it("should validate paymentStatus enum values", async () => {
    const user = await UserFactory.create();
    const courses = await CourseFactory.createMany(1);

    const orderData = OrderFactory.generate({
      user: user._id,
      courses: courses.map((course) => course._id),
      paymentStatus: "invalid-status",
    });

    try {
      await Order.create(orderData);
      fail("Should have thrown validation error");
    } catch (error) {
      expect(error.errors.paymentStatus).toBeDefined();
    }
  });

  it("should set default status to pending", async () => {
    const user = await UserFactory.create();
    const courses = await CourseFactory.createMany(1);

    const orderData = OrderFactory.generate({
      user: user._id,
      courses: courses.map((course) => course._id),
    });
    delete orderData.status;

    const order = await Order.create(orderData);
    expect(order.status).toBe("pending");
  });

  it("should set default paymentStatus to pending", async () => {
    const user = await UserFactory.create();
    const courses = await CourseFactory.createMany(1);

    const orderData = OrderFactory.generate({
      user: user._id,
      courses: courses.map((course) => course._id),
    });
    delete orderData.paymentStatus;

    const order = await Order.create(orderData);
    expect(order.paymentStatus).toBe("pending");
  });
});

describe("Order Model - Save Hook", () => {
  it("should calculate total price correctly", async () => {
    const user = await UserFactory.create();
    const courses = await CourseFactory.createMany(2);

    const orderData = OrderFactory.generate({
      user: user._id,
      courses: courses.map((course) => course._id),
    });

    const order = await Order.create(orderData);
    expect(order.totalPrice).toBe(courses.reduce((acc, course) => acc + course.price, 0));
  });

  it("should update completedAt when status changes to completed", async () => {
    const user = await UserFactory.create();
    const courses = await CourseFactory.createMany(1);

    const orderData = OrderFactory.generateWithoutTimeStamps({
      user: user._id,
      courses: courses.map((course) => course._id),
      status: "pending",
    });
    const order = await Order.create(orderData);
    expect(order.completedAt).toBeUndefined();

    order.status = "completed";
    await order.save();

    expect(order.completedAt).toBeDefined();
  });

  it("should update cancelledAt when status changes to cancelled", async () => {
    const user = await UserFactory.create();
    const courses = await CourseFactory.createMany(1);

    const orderData = OrderFactory.generateWithoutTimeStamps({
      user: user._id,
      courses: courses.map((course) => course._id),
      status: "pending",
    });

    const order = await Order.create(orderData);
    expect(order.cancelledAt).toBeUndefined();

    order.status = "cancelled";
    await order.save();

    expect(order.cancelledAt).toBeDefined();
  });
});

describe("Order Model - Insert Many Hook", () => {
  it("should calculate total price correctly for multiple orders", async () => {
    const user = await UserFactory.create();
    const courses = await CourseFactory.createMany(2);
    const orders = OrderFactory.generateMany(2, {
      user: user._id,
      courses: courses.map((course) => course._id),
    });

    await Order.insertMany(orders);
    const _orders = await Order.find({});
    expect(_orders.length).toBe(2);
    expect(_orders[0].totalPrice).toBe(courses.reduce((acc, course) => acc + course.price, 0));
  });
});


describe("Order Model - Mail Hook", () => {
  it("should create a mail when an order is created", async () => {
    const user = await UserFactory.create();
    const courses = await CourseFactory.createMany(1);

    const orderData = OrderFactory.generate({
      user: user._id,
      courses: courses.map((course) => course._id),
      status: "pending"
    });

    const order = await Order.create(orderData);

    const mail = await Mail.findOne(
      {
        order: order._id,
        status: "pending"
      }
    )

    expect(mail).not.toBe(null)
  })

  it("should not create a mail when an order is being updated/completed", async function() {
    const user = await UserFactory.create();
    const courses = await CourseFactory.createMany(1);

    const orderData = OrderFactory.generate({
      user: user._id,
      courses: courses.map((course) => course._id),
      status: "pending"
    });

    const order = await Order.create(orderData);

    order.status == "completed"
    await order.save()

    const orderMails = await Mail.find({
      order: order._id
    })

    expect(orderMails.length).toBe(1)
  })

  it("should create a mail with status 'cancelled' if order is cancelled", async function () {
    const user = await UserFactory.create();
    const courses = await CourseFactory.createMany(1);

    const orderData = OrderFactory.generate({
      user: user._id,
      courses: courses.map((course) => course._id),
      status: "pending"
    });

    const order = await Order.create(orderData);

    order.status = "cancelled"
    await order.save()

    const mail = await Mail.findOne(
      {
        order: order._id,
        status: "cancelled"
      }
    )

    expect(mail).not.toBe(null)
  })
})


    



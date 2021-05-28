const faker = require('faker');
const fs = require('fs');

// Set locale to use Vietnamese
faker.locale = 'vi';

const randomCategoryList = (n) => {
  if (n <= 0) return [];

  const categoryList = [];

  // loop and push category
  Array.from(new Array(n)).forEach((_, index) => {
    const category = {
      id: index,
      name: faker.commerce.department(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    categoryList.push(category);
  });

  return categoryList;
};

const randomProductList = (categoryList, numberOfProducts) => {
  if (numberOfProducts <= 0) return [];

  const productList = [];
  let id = 0;

  // random data
  for (const category of categoryList) {
    Array.from(new Array(numberOfProducts)).forEach(() => {
      const product = {
        id: id,
        name: faker.commerce.productName(),
        quantity: 1000,
        price: Number.parseFloat(faker.commerce.price()),
        description: faker.commerce.productDescription(),
        imageUrl: faker.image.imageUrl(400, 400),
        categoryId: category.id,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      productList.push(product);

      id += 1;
    });
  }

  return productList;
};

const randomCartList = (n) => {
  if (n <= 0) return [];

  const cartList = [];

  // loop and push category
  Array.from(new Array(n)).forEach((_, index) => {
    const cart = {
      id: index,
      userId: faker.datatype.uuid(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    cartList.push(cart);
  });

  return cartList;
};

const randomOrderList = (cartList, productList, numberOfOrder) => {
  if (numberOfOrder <= 0) return [];

  const orderList = [];
  let id = 0;

  // random data
  for (const cart of cartList) {
    Array.from(new Array(numberOfOrder)).forEach(() => {
      const product = productList[Math.floor(Math.random() * productList.length)];
      const order = {
        id: id,
        quantity: 1,
        cartId: cart.id,
        productId: product.id,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      orderList.push(order);
      id++;
    });
  }

  return orderList;
};

const randomUserList = (n) => {
  if (n <= 0) return [];

  const userList = [];

  Array.from(new Array(n)).forEach((_, index) => {
    const user = {
      id: index,
      userName: faker.internet.userName(),
      password: faker.internet.password(),
      name: faker.name.findName(),
      phoneNumber: faker.phone.phoneNumber(),
      address: faker.address.cityName(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    userList.push(user);
  });

  return userList;
};

// IFFE
(() => {
  // random data
  const categoryList = randomCategoryList(3);
  const productList = randomProductList(categoryList, 3);
  const cartList = randomCartList(3);
  const orderList = randomOrderList(cartList, productList, 3);
  const billList = randomOrderList(orderList, 3);
  const userList = randomUserList(3);

  // prepare db object
  const db = {
    categories: categoryList,
    products: productList,
    carts: cartList,
    orders: orderList,
    bills: billList,
  };

  const us = {
    users: userList,
  };

  // write db object to db.json
  fs.writeFile('db.json', JSON.stringify(db), () => {
    console.log('Generate data successfully =))');
  });

  fs.writeFile('users.json', JSON.stringify(us), () => {
    console.log('Generate user successfully =))');
  });
})();

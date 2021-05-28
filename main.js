const fs = require('fs');
const express = require('express');
const jwt = require('jsonwebtoken');
const jsonServer = require('json-server');
const queryString = require('query-string');

const server = jsonServer.create();
const router = jsonServer.router('db.json');
const userDb = JSON.parse(fs.readFileSync('./users.json', 'UTF-8'));
const middleWares = jsonServer.defaults();
const rootLink = '/api';

server.use(express.urlencoded({ extended: true }));
server.use(express.json());

// Set default middleWares (logger, static, cors and no-cache)
server.use(middleWares);

// Add custom routes before JSON Server router
server.get('/echo', (req, res) => {
  res.jsonp(req.query);
});

// To handle POST, PUT and PATCH you need to use a body-parser
// You can use the one used by JSON Server
server.use(jsonServer.bodyParser);
server.use((req, res, next) => {
  if (req.method === 'POST') {
    req.body.createdAt = Date.now();
    req.body.updatedAt = Date.now();
  } else if (req.method === 'PATCH') {
    req.body.updatedAt = Date.now();
  }

  // Continue to JSON Server router
  next();
});

// Custom output for LIST with pagination
router.render = (req, res) => {
  // Check GET with pagination
  // If yes, custom output
  const headers = res.getHeaders();

  const totalCountHeader = headers['x-total-count'];
  if (req.method === 'GET' && totalCountHeader) {
    const queryParams = queryString.parse(req._parsedUrl.query);

    const result = {
      data: res.locals.data,
      pagination: {
        _page: Number.parseInt(queryParams._page) || 1,
        _limit: Number.parseInt(queryParams._limit) || 10,
        _totalRows: Number.parseInt(totalCountHeader),
      },
    };

    return res.jsonp(result);
  }

  // Otherwise, keep default behavior
  res.jsonp(res.locals.data);
};

// // FOR USER AUTHENTICATION
const SECRET_KEY = '123456789';
const expiresIn = '1d';

// Create a token from a payload
function createToken(payload) {
  return jwt.sign(payload, SECRET_KEY, { expiresIn });
}

// Verify the token
function verifyToken(token) {
  return jwt.verify(token, SECRET_KEY, (err, decode) => (decode !== undefined ? decode : err));
}

// Check if the user exists in database
function findUserIndex({ username, password }) {
  return userDb.users.findIndex((user) => user.username === username && user.password === password);
}

// Register New User
server.post(`${rootLink}/user/register`, (req, res) => {
  console.log('register endpoint called; request body:');
  console.log(req.body);
  const { username, password, name, phoneNumber, address } = req.body;

  if (findUserIndex({ username, password }) != -1) {
    const status = 401;
    const message = 'username and password already exist';
    res.status(status).json({ status, message });
    return;
  }

  fs.readFile('./users.json', (err, data) => {
    if (err) {
      const status = 401;
      const message = err;
      res.status(status).json({ status, message });
      return;
    }

    // Get current users data
    var data = JSON.parse(data.toString());

    // Get the id of last user
    var last_item_id = data.users[data.users.length - 1].id;

    const user_data = {
      id: last_item_id + 1,
      username: username,
      password: password,
      name: name || null,
      phoneNumber: phoneNumber || null,
      address: address || null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    //Add new user
    data.users.push(user_data); //add some data
    var writeData = fs.writeFile('./users.json', JSON.stringify(data), (err, result) => {
      // WRITE
      if (err) {
        const status = 401;
        const message = err;
        res.status(status).json({ status, message });
        return;
      }
    });
  });

  const status = 200;
  const message = 'Register successfully';
  res.status(status).json({ status, message });
});

// Login to one of the users from ./users.json
server.post(`${rootLink}/user/login`, (req, res) => {
  console.log('login endpoint called; request body:');
  console.log(req.body);
  const { username, password } = req.body;
  if (findUserIndex({ username, password }) === -1) {
    const status = 401;
    const message = 'Incorrect username or password';
    res.status(status).jsonp({ status, message });
    return;
  }

  // Get user
  const user_info = userDb.users[findUserIndex({ username, password })];
  const user_id = user_info['id'];
  const user_fullname = user_info['name'];
  const user_phone = user_info['phoneNumber'];
  const user_address = user_info['address'];
  console.log('User info: ' + user_info);

  const access_token = createToken({ username, password });
  console.log('Access Token:' + access_token);

  res.status(200).json({ access_token, user_id, user_fullname, user_phone, user_address });
});

server.use((req, res, next) => {
  if (req.originalUrl.includes('/carts') || req.originalUrl.includes('/orders')) {
    if (
      req.headers.authorization === undefined ||
      req.headers.authorization.split(' ')[0] !== 'Bearer'
    ) {
      const status = 401;
      const message = 'Error in authorization format';
      res.status(status).json({ status, message });
      return;
    }
    try {
      let verifyTokenResult;
      verifyTokenResult = verifyToken(req.headers.authorization.split(' ')[1]);

      if (verifyTokenResult instanceof Error) {
        const status = 401;
        const message = 'Access token not provided';
        res.status(status).json({ status, message });
        return;
      }
      next();
    } catch (err) {
      const status = 401;
      const message = 'Error access token is revoked';
      res.status(status).json({ status, message });
    }
  } else {
    next();
  }
});

// Use default router
server.use(rootLink, router);

// Start server
// const PORT = process.env.PORT || 3000;
server.listen(4000, () => {
  console.log('JSON Server Auth is running');
});

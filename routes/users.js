/** @format */

var express = require('express');
var router = express.Router();
const bcrypt = require('bcryptjs');
const { db } = require('../mongo');
const { uuid } = require('uuidv4');
const jwt = require('jsonwebtoken');

/* GET users listing. */
router.get('/', function (req, res, next) {
  res.send('respond with a resource');
});
const createUser = async (email, passwordHash) => {
  const collection = await db().collection('Users');

  const user = {
    email: email,
    password: passwordHash,
    id: uuid(),
  };
  try {
    await collection.insert(user);
    return true;
  } catch {
    console.error();
    return false;
  }
};
router.post('/register', async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;
    console.log(email, password);
    const saltRounds = 5;
    const salt = await bcrypt.genSalt(saltRounds);
    console.log(salt);
    const passwordHash = await bcrypt.hash(password, salt);
    console.log(passwordHash);
    const user = {
      email: email,
      password: passwordHash,
      id: uuid(), // uid stands for User ID. This will be a unique string that we will can to identify our user
    };
    console.log(user);

    const userJoin = await createUser(email, passwordHash);
    console.log(userJoin);
    res.status(200).json({ success: true, message: 'user added' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: e });
  }
});

router.post('/login', async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;

    const findUser = await db()
      .collection('Users')
      .findOne({ email: email });

    if (findUser) {
      const confirmUser = await bcrypt.compare(
        password,
        findUser.password
      );
      const userData = {
        Date: new Date(),
        userId: findUser.id,
        scope: findUser.email.includes('codeimmersives.com')
          ? 'admin'
          : 'user',
      };
      const exp = Math.floor(Date.now() / 1000) + 60 * 60;
      const payload = {
        userData,
        exp,
      };
      const jwtSecretKey = process.env.JWT_SECRET_KEY;
      const token = jwt.sign(payload, jwtSecretKey);
      console.log(token);
      res.status(200).json({ success: true, token: token });
      if (!confirmUser) {
        console.error();
        res
          .status(500)
          .json({ success: false, message: 'User does not exist' });
      }
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: e.toString() });
  }
});

module.exports = router;

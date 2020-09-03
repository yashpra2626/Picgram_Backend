const express =require('express');
const router = express.Router();
const {check}= require('express-validator');
const userController=require('../controllers/users-controller');

router.get('/',userController.getUsers);

router.post('/signup',
          [check('name').not().isEmpty(),
           check('email').normalizeEmail().isEmail(),
           check('password').isLength({min:5,max:9})  ]
          ,userController.signUp);

router.post('/login',userController.login);


module.exports=router;
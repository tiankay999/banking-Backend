const{ DataTypes} = require('sequelize');
const{sequelize}= require('../config/database');

const Admin=sequelize .define('admin',{
    id:{
        type:DataTypes.INTEGER,
        autoIncrement:true,
        primaryKey:true
    },
    name:{
        type:DataTypes.STRING,
        allowNull:false},
        email:{
            type:DataTypes.STRING,
            allowNull:false,
            unique:true,
            validate:{isEmail:true
        }
        },
        password:{
            type:DataTypes.STRING,
            allowNull:false,
            validate:{minLength:6}
        }

    });
    

module.exports=Admin;
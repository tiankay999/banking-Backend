const { DataTypes}= require ('sequelize');
const {sequelize}=  require('../config/database');

const Transaction = sequelize.define('transaction',{
    id:{
        type:DataTypes.INTEGER,
        autoIncrement:true,
        primaryKey:true},
   type:{
        type:DataTypes.STRING,
        allowNull:false,
        },
    uid:{
        type:DataTypes.INTEGER,
        allowNull:false,
        Unique:true,
    },
    amount:{
        type:DataTypes.FLOAT,
        allowNull:false,
        defaultValue:0.0    
    }},);

    module.exports= Transaction;
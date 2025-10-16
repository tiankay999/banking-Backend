const { DataTypes}= require ('sequelize');
const {sequelize}=  require('../config/database');

const Wallet = sequelize.define('Wallet',{
    id:{
        type:DataTypes.INTEGER,
        autoIncrement:true,
        primaryKey:true,},
    uid:{
        type:DataTypes.INTEGER,
        allowNull:false,
        Unique:true,
    },
    balance:{
        type:DataTypes.FLOAT,
        allowNull:false,
        defaultValue:0.0    
    }},);

    module.exports= Wallet;
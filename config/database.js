const {Sequelize} = require ('sequelize');

const sequelize = new Sequelize('KwesiArthurDB','root','',{
    host: 'localhost',
    dialect: 'mysql',
    Port: 3306,
});

module.exports={sequelize};
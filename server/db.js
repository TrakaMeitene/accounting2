import { createRequire } from "module"
const require = createRequire(import.meta.url)
const mariadb = require('mariadb');
import 'dotenv/config'


const pool = mariadb.createPool({
    host: process.env.DB_HOST, 
    user: process.env.DB_USER, 
    password: process.env.DB_PASSWORD,
    //connectionLimit: 5000,
    database: process.env.DB_NAME,
    acquireTimeout:600,
});


pool.getConnection()
.then(conn => {
    conn.query(`SELECT * from ${process.env.DB_NAME}.invoices`)
      .then((rows) => {
        console.log("datubaze sasniegta")
        conn.release() 
        conn.end()
      })
      .catch(err => {
        //handle error
        console.log(err); 
      })
  }).catch(err => {
    console.log("not connected")
  });


 export default pool;

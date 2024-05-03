import { createRequire } from "module"
const require = createRequire(import.meta.url)
const express = require('express');
const router = express.Router();
var bodyParser = require('body-parser')
import DescopeClient from '@descope/node-sdk';
const cookieParser = require('cookie-parser');
router.use(cookieParser());

import pool from "../db.js";

router.use(function (req, res, next) {
  res.header("Content-Type", "application/json");
  res.header("Access-Control-Allow-Origin", "http://localhost:3000"); // update to match the domain you will make the request from
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Authorization, Accept");
  res.header("Access-Control-Allow-Methods", "POST, GET, PUT, DELETE");
  res.header("Access-Control-Allow-Credentials", true)
  next();
});
const descopeClient = DescopeClient({ projectId: process.env.PROJECTID, managementKey: process.env.MGKEY });

router.use(bodyParser.json())

router.post("/sign", async (req, res) => {

  const loginId = req.body.email
  const uri = "http://localhost:3000"
  const deliveryMethod = "email"
  //    signUpOptions (SignUpOptions): this allows you to configure behavior during the authentication process.
  const signUpOptions = {
    "customClaims": { "claim": "Value1" },
    "templateOptions": { "option": "Value1" }
  }

  const resp = await descopeClient.magicLink.signUpOrIn[deliveryMethod](loginId, uri, signUpOptions);
  let data = await descopeClient.management.user.load(loginId)

  if (!re.ok) {
    console.log("Failed to initialize signUpOrIn flow")
    res.send(resp.error)
  }
  else {
    res.send({ message: "success", user: data.data.picture })
  }

})

router.post("/social", async (req, res) => {
  try {
    const provider = "facebook"
    const redirectURL = "http://localhost:3000/"
    const loginOptions = {
      "stepup": false,
      "mfa": false,
      "customClaims": { "claim": "Value1" },
      "templateOptions": { "option": "Value1" }
    }
    const re = await descopeClient.oauth.start[provider](redirectURL, loginOptions);
    console.log(re)
    if (re.ok) {
      res.send(re.data.url)
    }
  } catch (err) {
    console.log(err)
  }
})

router.post("/socverify", async (req, res) => {
  const code = req.body.code

  if (req.cookies.session) {
    return res.send({ message: "success" })
  }

  const response = await descopeClient.oauth.exchange(code);

  if (!response.ok) {
    console.log("Failed to finish oauth")
  }
  else {
    console.log("Successfully finished oauth.")
    res.cookie('user', response?.data?.user, { maxAge: 90000000, httpOnly: true, secure: true, sameSite: "none" })
    res.cookie('session', response?.data?.sessionJwt, { maxAge: 90000000, httpOnly: true, secure: true, sameSite: "none" })

    res.send({ message: "success" })
  }
})

router.post("/verify", async (req, res) => {
  const token = req.body.token

  const resp = await descopeClient.magicLink.verify(token)

  if (req.cookies.session) {
    res.send({ message: "success" })
  }

  if (!resp.ok) {
    console.log("Failed to verify magic link token")
  }
  else {
    console.log("Successfully verified magic link token")
    res.cookie('user', resp?.data?.user, { maxAge: 90000000, httpOnly: true, secure: true, sameSite: "none" })
    res.cookie('session', resp?.data?.sessionJwt, { maxAge: 90000000, httpOnly: true, secure: true, sameSite: "none" })

    res.send({ message: "success" })
  }
})

router.get("/", async (req, res) => {

  try {
    const user = req.cookies.user.userId

    const result = await pool.query('SELECT * from invoices where userId=?', [user])
    res.send(result)
  }
  catch (err) {
    console.trace(err)
  }
})

router.get("/forminit/:selection", async (req, res) => {

  try {
    const id = req.params.selection

    const user = req.cookies.user.userId
    const result = await pool.query('SELECT * from invoices where userId=? and id=?', [user, id])
    const products = await pool.query('SELECT * from products where invoiceId=?', [id])
    result.push(products)

    res.send(result)

  } catch (err) {

  }
})

router.post("/create", async (req, res) => {
  let errorMsg = { message: "Kaut kas nogāja greizi. Mēģini vēlreiz", status: "error" }
  try {
    const data = req.body.forma
    const user = req.cookies.user.userId
    //create gadijums 
    if (!data.selection) {
      let invoice = await pool.query('INSERT into invoices ( userId, comments, company, adress, bank, date, documentNr, email, payd, paytill, phone, total, registration ) values (?, ?, ?,?,?,?,?,?,?,?,?, ?, ? )', [user, data.Comment, data.Company, data.adress, data.bank, new Date(data.date), data.documentNr, data.email, data.payd, new Date(data.paytill), data.phone, data.total, data.CompanyReg])

      let products = ""

      for (let i = 0; i < data.products?.length; i++) {
        products = await pool.query("INSERT into products (invoiceId, name, unit, price, count) values (?,?,?,?,?) ", [invoice.insertId, data.products[i].name, data.products[i].unit, data.products[i].price, data.products[i].count])
      }
      if (products.affectedRows > 0 || invoice.affectedRows > 0) {
        res.status(200).send({ message: "Dati saglabāti veiksmīgi", status: "success" })
      } else {
        res.send(errorMsg)
      }
    }
  } catch (err) {
    res.status(500).send(err)
    console.trace(err)
  }
})

router.post("/update", async (req, res) => {
  let errorMsg = { message: "Kaut kas nogāja greizi. Mēģini vēlreiz", status: "error" }

  try {
    const data = req.body.forma
    const user = req.cookies.user.userId
    let products = ""

    const update = await pool.query("UPDATE invoices SET comments=?, company=?, adress=?, bank=?, date=?, documentNr=?, email=?, payd=?, paytill=?, phone=?, total=?, registration=?  WHERE id=?", [data.Comment, data.Company, data.adress, data.bank, new Date(data.date), data.documentNr, data.email, data.payd, new Date(data.paytill), data.phone, data.total, data.CompanyReg, data.selection])

    //check for deleted products
    const allproducts = await pool.query('SELECT * from products where invoiceId=?', [data.products[0].invoiceId])
    const allproductids= []
    const invoiceprod = []

    allproducts.map(x=> allproductids.push(x.id))
    data.products.map(x=> invoiceprod.push(x.id))
    var checkfordeleted = allproductids.filter(function(item) {
      return !invoiceprod.includes(item)
    })
    if(checkfordeleted.length >0){
   await pool.query('DELETE from products where id IN (?)', [checkfordeleted])
    }

    for (let i = 0; i < data.products.length; i++) {
      if (data.products[i]?.id) {
        products = await pool.query("UPDATE products SET name=?, unit=?, price=?, count=? WHERE id=?", [data.products[i].name, data.products[i].unit, data.products[i].price, data.products[i].count, data.products[i]?.id])
        products.affectedRows > 0 ? res.status(200).send({ message: "Dati saglabāti veiksmīgi", status: "success" }) : res.send(errorMsg)
      } else {
        products = await pool.query("INSERT into products (invoiceId, name, unit, price, count) values (?,?,?,?,?) ", [data.selection, data.products[i].name, data.products[i].unit, data.products[i].price, data.products[i].count])
        products.affectedRows > 0 ? res.status(200).send({ message: "Dati saglabāti veiksmīgi", status: "success" }) : res.send(errorMsg)
        }
    }
    
  }
  catch (err) {
    console.log(err)
  }
})

router.get("/user", async (req, res) => {
  const user = req.cookies.user
  res.send(user?.picture)
})


router.delete('/deleteinvoice', async (req, res) => {
  const id = req.query.id
  console.log(id)
  const result = await pool.query("DELETE from invoices where id=? ", [id])
  if (result.affectedRows >= 1) {
    res.send("ok")
  } else {
    res.send("error")
  }
})

router.get("/logout", async (req, res) => {
  res.clearCookie("session")
  res.clearCookie("user")
  res.end("logout")

})

export default router;
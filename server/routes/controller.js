import { createRequire } from "module"
const require = createRequire(import.meta.url)
const express = require('express');
const router = express.Router();
var bodyParser = require('body-parser')
import DescopeClient from '@descope/node-sdk';
const cookieParser = require('cookie-parser');
router.use(cookieParser());
import pool from "../db.js";
var PdfPrinter = require('pdfmake');
var fs = require('fs');
router.use('/uploads', express.static('uploads'))
const multer = require("multer");


const upload = multer({
  dest: "uploads",
  limits: { fileSize: 2000000 },
  files: 2,
  filename: function (req, file, cb) {
    // this overwrites the default multer renaming callback
    // and simply saves the file as it is
    cb(null, file.originalname),
      cb(new Error("File is too big"))

  }
  // you might also want to set some limits: https://github.com/expressjs/multer#limits
});

var fonts = {
  Roboto: {
    //normal: 'fonts/Parisienne-Regular.ttf',
    //normal: 'fonts/Lovelo Line Light.otf',
    normal: "fonts/Inter-VariableFont_slnt,wght.ttf"
  }
};

var printer = new PdfPrinter(fonts);

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
try{
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
} catch(err){
  res.send(err)
  console.trace(err)
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
  try{
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
}
catch(err){
  console.trace(err)

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
console.trace(err)
res.send(err)
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
    const allproductids = []
    const invoiceprod = []

    allproducts.map(x => allproductids.push(x.id))
    data.products.map(x => invoiceprod.push(x.id))
    var checkfordeleted = allproductids.filter(function (item) {
      return !invoiceprod.includes(item)
    })
    if (checkfordeleted.length > 0) {
      await pool.query('DELETE from products where id IN (?)', [checkfordeleted])
    }

    for (let i = 0; i < data.products.length; i++) {
      if (data.products[i].id) {
        products = await pool.query("UPDATE products SET name=?, unit=?, price=?, count=? WHERE id=?", [data.products[i].name, data.products[i].unit, data.products[i].price, data.products[i].count, data.products[i]?.id])
      } else {
        products = await pool.query("INSERT into products (invoiceId, name, unit, price, count) values (?,?,?,?,?) ", [data.selection, data.products[i].name, data.products[i].unit, data.products[i].price, data.products[i].count])
      }

    }
    products.affectedRows > 0 ? res.status(200).send({ message: "Dati saglabāti veiksmīgi", status: "success" }) : res.send(errorMsg)

  }
  catch (err) {
    console.log(err)
  }
})

router.get("/user", async (req, res) => {
  const user = req.cookies.user
  res.send(user?.picture)
})

router.post("/userdata", 
  upload.single("img"), async (req, res) => {
  
  let errorMsg = { message: "Kaut kas nogāja greizi. Mēģini vēlreiz", status: "error" }

  const user = req.cookies.user.userId
  const data = req.body

  const checkifexists = await pool.query("SELECT * from usersettings where userid=?", [user])

  let rows = "name=?, surname=?, email=?, personalnr=?, adress=?, bank=?"
  const dependencies = [data.name, data.surname, data.email, data.personalnr, data.adress, data.bank]


  if (checkifexists.length === 1) {
    if(req.file){
      rows = rows.concat(", file=?")
      dependencies.splice(6, 0, '/uploads/' + req.file.filename)
    }
    const userupdate = await pool.query(`UPDATE usersettings SET ${rows}`, dependencies)
    return userupdate.affectedRows > 0 ? res.status(200).send({ message: "Dati saglabāti veiksmīgi", status: "success" }) : res.send(errorMsg)

  }
  if(req.file){
    rows = rows.concat(", file=?, userid=?")
    dependencies.splice(6, 0, '/uploads/' + req.file.filename, user)
  }
  const userinsert = await pool.query(`INSERT into usersettings (${rows}) values (?,?,?,?,?, ?,?) `, [dependencies])
  userinsert.affectedRows > 0 ? res.status(200).send({ message: "Dati saglabāti veiksmīgi", status: "success" }) : res.send(errorMsg)
})

router.get("/getuserdata", async (req, res) => {
  try {
    const user = req.cookies.user.userId
    const getuser = await pool.query("SELECT * from usersettings where userid=?", [user])
    res.send(getuser)
  }
  catch (err) {
    res.send(err)
    console.log(err)
  }
})


router.delete('/deleteinvoice', async (req, res) => {
  const id = req.query.itemtoremove

  const result = await pool.query("DELETE from invoices where id=? ", [id])
  if (result.affectedRows >= 1) {
    res.send("ok")
  } else {
    res.send("error")
  }
})

router.get("/createpdf/:selection", async (req, res) => {
  const id = req.params.selection
  const user = req.cookies.user.userId

  const invoice = await pool.query('SELECT * from invoices where id=?', [id])
  const usersetings = await pool.query('SELECT * from usersettings where userid=?', [user])
  const products = await pool.query('SELECT * from products where invoiceId=?', [id])

  const tabledata = []

  var header = [{ text: 'Nosaukums', style: 'tableHeader' }, { text: 'Cena', style: 'tableHeader' }, { style: 'tableHeader', text: 'Skaits', width: '40px' }, { text: 'Mērvienība', style: 'tableHeader' }, { text: 'Kopā', style: 'tableHeader' }];

  tabledata.push(header)
  products.map((x, i) => {
    tabledata.push([products[i].name, Number(products[i].price).toFixed(2).toString() + " EUR", String(products[i].count), products[i].unit, Number(products[i].price * products[i].count).toFixed(2).toString() + " EUR"])
  })


  var docDefinition = {
    content: [
      {
      columns: [],
    },
      {
        table: {
          widths: [200, 200],
          headerRows: 2,

          body: [
            [{ text: "Rēķina numurs", style: 'tableHeader' }, invoice[0].documentNr],
            ["Rēķina datums", new Date(invoice[0].paytill).toLocaleDateString("de-DE")],
            ["Rēkina apmaksas termiņš", new Date(invoice[0].paytill).toLocaleDateString("de-DE")],
            ["Klients", invoice[0].company],
            ["Reģistrācijas numurs", invoice[0].registration],
            ["Adrese", invoice[0].adress]
          ]
        },
        layout: 'noBorders',
        margin: [0, 20, 20, 20]
    },
      { text: 'Produkti/pakalpojumi', fontSize: 14, normal: true, margin: [0, 20, 0, 8] },
      {
        table: {
          widths: [150, "auto", "auto", 100, 90],
          style: 'tableExample',
          headerRows: 1,
          body:
            tabledata.map(x => x)
        },
        layout: 'lightHorizontalLines',
      },
      {
        table: {
          body:
            [
              ["", ""],
              ["Summa apmaksai", Number(invoice[0].total).toFixed(2).toString() + " EUR"],
            ]
        },
        margin: [300, 20, 0, 0],
        alignment: 'right',
        layout: 'noBorders',

      },
      { text: 'Norēķinu rekvizīti', fontSize: 14, normal: true, margin: [0, 20, 0, 8] },

      {
        table: {
          widths: [200, 200],
          style: 'tableExample',
          fontSize: '12px',
          headerRows: 1,
          body: [
            ["Piegādātājs", usersetings[0].name + usersetings[0].surname],
            ["Reģistrācijas numurs", usersetings[0].personalnr],
            ["Adrese", usersetings[0].adress],
            ["Bankas numurs", usersetings[0].bank]
          ]
        },
        layout: 'noBorders',
        margin: [0, 20, 20, 20]

      },
      { text: 'Dokuments ir sagatavots elektroniski un ir derīgs bez paraksta.', fontSize: 9, normal: true, margin: [0, 20, 0, 8] },
    ]
};

if(usersetings[0].file.length > 1){
  docDefinition?.content[0].columns.push(
    {
      image:  `.${usersetings[0].file}`  ,
      width: 200
    }
  )
}

const pdfDoc = printer.createPdfKitDocument(docDefinition);
res.contentType('application/pdf');
pdfDoc.pipe(res);
pdfDoc.end();
})

router.get("/logout", async (req, res) => {
  res.clearCookie("session")
  res.clearCookie("user")
  res.end("logout")

})

export default router;
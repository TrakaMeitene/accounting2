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
const path = require('node:path');
var nodemailer = require('nodemailer');
import moment from "moment"

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
    normal: "fonts/Inter-VariableFont_slnt,wght.ttf"
  }
};

var printer = new PdfPrinter(fonts);

router.use(function (req, res, next) {
  res.header("Content-Type", "application/json");
  res.header("Access-Control-Allow-Origin", process.env.ORIGINURL); // update to match the domain you will make the request from
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Authorization, Accept");
  res.header("Access-Control-Allow-Methods", "POST, GET, PUT, DELETE");
  res.header("Access-Control-Allow-Credentials", true)
  next();
});


const descopeClient = DescopeClient({ projectId: process.env.PROJECTID, managementKey: process.env.MGKEY });

router.use(bodyParser.json())

router.post("/sign", async (req, res) => {
  try {
    const loginId = req.body.email
    const uri = process.env.HOSTNAME
    const deliveryMethod = "email"
    //    signUpOptions (SignUpOptions): this allows you to configure behavior during the authentication process.
    const signUpOptions = {
      "customClaims": { "claim": "Value1" },
      "templateOptions": { "option": "Value1" }
    }
    const resp = await descopeClient.magicLink.signUpOrIn[deliveryMethod](loginId, uri, signUpOptions);
    let data = await descopeClient.management.user.load(loginId)

    if (!resp.ok) {
      console.log("Failed to initialize signUpOrIn flow")
    }
    else {
      res.send({ message: "success", user: data.data.picture })
    }
  } catch (err) {
    res.send(err)
    console.trace(err)
  }

})

router.post("/social", async (req, res) => {
  try {
    const provider = "facebook"
    const redirectURL = process.env.HOSTNAME
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

  if (response.ok) {
    res.cookie('user', response?.data?.user, { maxAge: 90000000, httpOnly: true, secure: true, sameSite: "none" })
    res.cookie('session', response?.data?.sessionJwt, { maxAge: 90000000, httpOnly: true, secure: true, sameSite: "none" })

    res.send({ message: "success" })
  }
})

router.get("/check", async (req, res) => {
  if (req.cookies.session) {
    return res.send({ message: "success" })
  }
})

router.post("/verify", async (req, res) => {
  try {
    const token = req.body.token

    if (req.cookies.session) {
      return res.send({ message: "success" })
    }

    const resp = await descopeClient.magicLink.verify(token)

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
  catch (err) {
    console.trace(err)
  }
})

router.get("/", async (req, res) => {

  try {
    const user = req.cookies.user?.userId
    const result = await pool.query('SELECT * from invoices where userId=?', [user])
    res.send(result.sort(function (a, b) { return b.date - a.date }))
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
    const data = req.body.data
    const user = req.cookies.user.userId
    //create gadijums 
    if (!data.selection) {
      let invoice = await pool.query('INSERT into invoices ( userId, comments, company, adress, bank, date, documentNr, email, payd, paytill, phone, total, registration ) values (?, ?, ?,?,?,?,?,?,?,?,?, ?, ? )', [user, data.comment, data.company, data.adress, data.bank, new Date(data.date), data.documentnr, data.email, data.payd, new Date(data.paytill), data.phone, data.total, data.companyreg])

      let products = ""

      for (let i = 0; i < data.products?.length; i++) {
        products = await pool.query("INSERT into products (invoiceId, name, unit, price, count) values (?,?,?,?,?) ", [invoice.insertId, data.products[i].name || "", data.products[i].unit || "", data.products[i].price || 0.00, data.products[i].count || 0])
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
    const data = req.body.data
    const user = req.cookies.user.userId
    let products = ""

    const update = await pool.query("UPDATE invoices SET comments=?, company=?, adress=?, bank=?, date=?, documentNr=?, email=?, payd=?, paytill=?, phone=?, total=?, registration=?  WHERE id=?", [data.comment, data.company, data.adress, data.bank, new Date(data.date), data.documentnr, data.email, data.payd, new Date(data.paytill), data.phone, data.total, data.companyreg, data.selection])
    const allproducts = await pool.query('SELECT * from products where invoiceId=?', [data.products[0].invoiceId])
    const allproductids = []
    const invoiceprod = []

    allproducts.map(x => allproductids.push(x.id))
    data.products.map(x => invoiceprod.push(x.id))
    //check for deleted products
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
    res.send(err)
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

    const user = req.cookies.user?.userId
    const data = req.body
    const checkifexists = await pool.query("SELECT * from usersettings where userid=?", [user])

    let rows = "name=?, surname=?, email=?, personalnr=?, adress=?, bank=?"
    const dependencies = [data.name, data.surname, data.email, data.personalnr, data.adress, data.bank]

    if (checkifexists.length === 1) {
      if (req.file) {
        rows = rows.concat(", file=?")
        dependencies.splice(6, 0, '/uploads/' + req.file?.filename)
      }
      const userupdate = await pool.query(`UPDATE usersettings SET ${rows}`, dependencies)
      return userupdate.affectedRows > 0 ? res.status(200).send({ message: "Dati saglabāti veiksmīgi", status: "success" }) : res.send(errorMsg)

    } else {
      dependencies.splice(7, 0, req.file ? '/uploads/' + req.file.filename : " ", user)

    }

    const userinsert = await pool.query(`INSERT into usersettings (name, surname, email, personalnr, adress, bank, file, userid) values (?,?,?,?,?,?,?,?) `, dependencies)
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

router.post('/deleteinvoice', async (req, res) => {
  const id = req.body.itemtoremove
  const user = req.cookies.user.userId
  const result = await pool.query("DELETE from invoices where id=? and userId=?", [id, user])
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
            [{ text: "Rēķina numurs", style: 'tableHeader' }, invoice[0]?.documentNr],
            ["Rēķina datums", new Date(invoice[0]?.paytill).toLocaleDateString("de-DE")],
            ["Rēkina apmaksas termiņš", new Date(invoice[0]?.paytill).toLocaleDateString("de-DE")],
            ["Klients", invoice[0]?.company],
            ["Reģistrācijas numurs", invoice[0]?.registration],
            ["Adrese", invoice[0]?.adress]
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
              ["Summa apmaksai", Number(invoice[0]?.total).toFixed(2).toString() + " EUR"],
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
            ["Piegādātājs", usersetings.length > 0 ? usersetings[0]?.name + " " + usersetings[0]?.surname : ""],
            ["Reģistrācijas numurs", usersetings.length > 0 ? usersetings[0]?.personalnr : ""],
            ["Adrese", usersetings.length > 0 ? usersetings[0]?.adress : ""],
            ["Bankas numurs", usersetings.length > 0 ? usersetings[0]?.bank : ""]
          ]
        },
        layout: 'noBorders',
        margin: [0, 20, 20, 20]

      },
      { text: 'Dokuments ir sagatavots elektroniski un ir derīgs bez paraksta.', fontSize: 9, normal: true, margin: [0, 20, 0, 8] },
    ]
  };

  if (usersetings[0]?.file?.length > 1) {
    docDefinition?.content[0].columns.push(
      {
        image: `.${usersetings[0].file}`,
        fit: [150, 150],
      }
    )
  }

  const pdfDoc = printer.createPdfKitDocument(docDefinition);
  res.contentType('application/pdf');
  pdfDoc.pipe(res)
  pdfDoc.end();
})

router.post('/sendmail', async (req, res) => {
  try {
    let email = req.body.email
    let text = req.body.text

    let date = new Date()

    var transporter = nodemailer.createTransport({
      host: 'smtp.zoho.eu', 
      port: '465', 
      secure: true,
      auth: {
        user: 'sandra@frogit.lv', 
        pass: process.env.EMAIL_PASS 
      }
    });

    var mailOptions = {
      from: "sandra@frogit.lv", 
      to: 'sandra@frogit.lv', 
      subject: 'Ziņa no rēķini pats',
      text: `
Ziņa no ${email} : ${text}

          ${date}`
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        res.send({ message: error, status: "error" })
      } else {
        res.send({ message: "ok" })
      }
    })
  }
  catch (err) {
    res.status(500).send(err)
    console.trace(err)
  }
})

router.get("/e-invoice/:selection",async (req, res) => {
  const id = req.params.selection
  const data= await pool.query('SELECT * from invoices where id=?', [id])
  const user = req.cookies.user.userId

  const usersetings = await pool.query('SELECT * from usersettings where userid=?', [user])
  const products = await pool.query('SELECT * from products where invoiceId=?', [id])

  let xmlstr= (`
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2" xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2" xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
<cbc:CustomizationID>urn:cen.eu:en16931:2017</cbc:CustomizationID>
<cbc:ProfileID>urn:fdc:peppol.eu:2017:poacc:billing:01:1.0</cbc:ProfileID>
<cac:AccountingSupplierParty>
<cac:Party>
<cac:PartyIdentification>
<cbc:ID>${usersetings[0]?.personalnr}</cbc:ID>
</cac:PartyIdentification>
<cac:PartyName>
<cbc:Name>${ usersetings[0]?.name + " " + usersetings[0]?.surname }</cbc:Name>
</cac:PartyName>
<cac:PostalAddress>
<cbc:StreetName>${usersetings[0]?.adress}</cbc:StreetName>
<cbc:CityName/>
<cbc:PostalZone/>
<cac:Country>
<cbc:IdentificationCode>LV</cbc:IdentificationCode>
</cac:Country>
</cac:PostalAddress>
<cac:PartyLegalEntity>
<cbc:RegistrationName>${ usersetings[0]?.name + " " + usersetings[0]?.surname }</cbc:RegistrationName>
<cbc:CompanyID>${usersetings[0]?.personalnr}</cbc:CompanyID>
</cac:PartyLegalEntity>
</cac:Party>
</cac:AccountingSupplierParty>
<cac:AccountingCustomerParty>
<cac:Party>
<cac:PartyName>
<cbc:Name>${data[0].company}</cbc:Name>
</cac:PartyName>
<cac:PostalAddress>
<cbc:StreetName>${data[0].adress}</cbc:StreetName>
<cbc:CityName/>
<cbc:PostalZone/>
<cac:Country>
<cbc:IdentificationCode>LV</cbc:IdentificationCode>
</cac:Country>
</cac:PostalAddress>
<cac:PartyLegalEntity>
<cbc:RegistrationName>${data[0].company}</cbc:RegistrationName>
<cbc:CompanyID>${data[0].registration}</cbc:CompanyID>
</cac:PartyLegalEntity>
</cac:Party>
</cac:AccountingCustomerParty>
<cac:PaymentMeans>
<cbc:PaymentMeansCode>30</cbc:PaymentMeansCode>
<cbc:PaymentID>${data[0].id}</cbc:PaymentID>
<cac:PayeeFinancialAccount>
<cbc:ID>${usersetings[0]?.bank}</cbc:ID>
</cac:PayeeFinancialAccount>
</cac:PaymentMeans>
<cac:TaxTotal>
<cbc:TaxAmount currencyID="EUR">0.00</cbc:TaxAmount>
<cac:TaxSubtotal>
<cbc:TaxableAmount currencyID="EUR">${data[0].total.toFixed(2)}</cbc:TaxableAmount>
<cbc:TaxAmount currencyID="EUR">0.00</cbc:TaxAmount>
<cac:TaxCategory>
<cbc:ID>O</cbc:ID>
<cbc:TaxExemptionReasonCode>VATEX-EU-O</cbc:TaxExemptionReasonCode>
<cbc:TaxExemptionReason>Not subject to VAT</cbc:TaxExemptionReason>
<cac:TaxScheme>
<cbc:ID>VAT</cbc:ID>
</cac:TaxScheme>
</cac:TaxCategory>
</cac:TaxSubtotal>
</cac:TaxTotal>
<cac:LegalMonetaryTotal>
<cbc:LineExtensionAmount currencyID="EUR">${data[0].total.toFixed(2)}</cbc:LineExtensionAmount>
<cbc:TaxExclusiveAmount currencyID="EUR">${data[0].total.toFixed(2)}</cbc:TaxExclusiveAmount>
<cbc:TaxInclusiveAmount currencyID="EUR">${data[0].total.toFixed(2)}</cbc:TaxInclusiveAmount>
<cbc:PayableAmount currencyID="EUR">${data[0].total.toFixed(2)}</cbc:PayableAmount>
</cac:LegalMonetaryTotal>

${products.map(x=> `
  <cac:InvoiceLine>
<cbc:ID>${x.id}</cbc:ID>
<cbc:Note></cbc:Note>
<cbc:InvoicedQuantity unitCode="MTR">${x.count}</cbc:InvoicedQuantity>
<cbc:LineExtensionAmount currencyID="EUR">${x.price}</cbc:LineExtensionAmount>
<cac:Item>
<cbc:Name>${x.name}</cbc:Name>
<cac:ClassifiedTaxCategory>
<cbc:ID>O</cbc:ID>
<cac:TaxScheme>
<cbc:ID>VAT</cbc:ID>
</cac:TaxScheme>
</cac:ClassifiedTaxCategory>
</cac:Item>
<cac:Price>
<cbc:PriceAmount currencyID="EUR">${(x.price * x.count).toFixed(2)}</cbc:PriceAmount>
</cac:Price>
</cac:InvoiceLine>
`).join('')}
</Invoice>
`)
res.send(xmlstr)
  } )

router.get("/logout", async (req, res) => {
  res.clearCookie("session")
  res.clearCookie("user")
  res.end("logout")

})

export default router;
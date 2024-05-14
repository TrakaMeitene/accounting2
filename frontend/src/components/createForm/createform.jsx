import React, { useState, useEffect, useRef } from "react"
import "./createform.css"
import { MdOutlineNavigateNext } from "react-icons/md";
import { InputText } from "primereact/inputtext";
import { InputNumber } from 'primereact/inputnumber';
import { RadioButton } from 'primereact/radiobutton';
import { Calendar } from 'primereact/calendar';
import { addLocale } from 'primereact/api';
import 'primereact/resources/primereact.min.css';
import { Button } from 'primereact/button';
import { MdDelete } from "react-icons/md";
import { Tooltip } from 'primereact/tooltip';

import Product from "./product";
import { useForm } from "react-hook-form"
import axios from 'axios';

export default function CreateForm({ close, selection }) {
    const [anim, setanim] = useState(false)
    const [newproducts, setnewproducts] = useState(1)

    const [hiddenindex, setHidden] = useState([])
    const [date, setDate] = useState(null);
    const [datetill, setDatetill] = useState(null);
    const { handleSubmit } = useForm();
    const [products, setProducts] = useState([])
    const [summ, setSumm] = useState(0.00)
    const [payd, setPayd] = useState("Neapmaksāts")
    const [initdata, setInitdata] = useState({})
    const [forma, setform] = useState({ documentNr: "", bank: "", phone: "", email: "", Company: "", CompanyReg: "", adress: "", Comment: "" })

    addLocale('lv', {
        firstDayOfWeek: 1,
        showMonthAfterYear: true,
        dayNames: ['Pirmdiena', 'Otrdiena', 'Trešdiena', 'Ceturtdiena', 'Piektdiena', 'sestdiena', 'Svētdiena'],
        dayNamesShort: ['P', 'O', 'Tr', 'C', 'Pk', 'S', 'Sv'],
        dayNamesMin: ['P', 'O', 'T', 'C', 'Pk', 'S', 'Sv'],
        monthNames: ['Janvāris', 'Februāris', 'Marts', 'Aprīlis', 'Maijs', 'Jūnijs', 'Jūlijs', 'Augusts', 'Septembris', 'Oktobris', 'Novembris', 'Decembris'],
        monthNamesShort: ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'],
        today: 'Šodien',
        clear: 'Notīrīt'
    });

    useEffect(() => {
        if (selection) {
            init()
        }
        //eslint-disable-next-line
    }, [selection])

    const init = () => {

        axios.get(`http://localhost:3300/forminit/${selection.id}`, { withCredentials: true })
            .then(response => {
                setInitdata(response.data)
                setDate(new Date(response.data[0].date))
                setDatetill(new Date(response.data[0].paytill))
                setPayd(response.data[0].payd)
                setnewproducts(response.data[1]?.length)

                setform({ documentNr: response.data[0].documentNr, bank: response.data[0].bank, Comment: response.data[0].comments, Company: response.data[0].company, CompanyReg: response.data[0].registration, adress: response.data[0].adress, email: response.data[0].email, phone: response.data[0].phone, total: response.data[0].total })
            })
    }

    const closing = (isDirty) => {
        console.log(isDirty === "")
        setanim(true)
        setTimeout(() => {
            close(isDirty === "" ? isDirty : undefined)
        }, 400)
    }


    const addproduct = (e) => {
        e.preventDefault()
        setnewproducts(newproducts + 1)
    }

    const removeitem = (ind) => {
        setHidden([...hiddenindex, ind])
        if (initdata[1]) {
            initdata[1].splice(ind, 1);
        } else {
            products.splice(ind, 1)
        }
        totalsumm()
    }


    const namechange = (name, ind) => {
        for (let i = 0; i < initdata[1]?.length; i++) {
            if (i === ind) {
                initdata[1][i].name = name
            }
        }
        if (products.length === 0) {
            setProducts([{ "ind": ind, "name": name }])
        } else {
            products.forEach(x => {
                if (x.ind === ind) { x.name = name } else {
                    setProducts(products => [...products, { "ind": ind, "name": name }])
                }
            })
        }
    }

    const pricechange = (price, ind) => {
        for (let i = 0; i < initdata[1]?.length; i++) {
            if (i === ind) {
                initdata[1][i].price = price
            }
        }
        totalsumm()

        if (products.length === 0) {
            setProducts([{ "ind": ind, "price": price }])
        } else {
            products.forEach(x => {
                if (x.ind === ind) { x.price = price } else {
                    setProducts(products => [...products, { "ind": ind, "price": price }])
                }
            })
        }
    }

    const countchange = (count, ind) => {
        for (let i = 0; i < initdata[1]?.length; i++) {
            if (i === ind) {
                initdata[1][i].count = count
            }
        }
        products.forEach(x => { if (x.ind === ind) { x.count = count } })
        totalsumm()
    }

    const unitchange = (unit, ind) => {
        for (let i = 0; i < initdata[1]?.length; i++) {
            if (i === ind) {
                initdata[1][i].unit = unit
            }
        }

        products.forEach(x => { if (x.ind === ind) { x.unit = unit } })
        totalsumm()
    }

    const totalsumm = () => {
        const unique = products.filter((a, i) => products.findIndex((s) => a.ind === s.ind) === i)

        setProducts(unique)

        let set = []
        for (let i = 0; i < unique.length; i++) {
            if (!unique[i].price) {
                unique[i].price = 0.00
            }
            if (!unique[i].count) {
                unique[i].count = 0
            }

            set.push(Number((unique[i]?.price * unique[i]?.count).toFixed(2)))
        }
        if (selection) {
            for (let i = 0; i < initdata[1]?.length; i++) {
                set.push(initdata[1][i].count * initdata[1][i].price).toFixed(2)
            }
        }
        const summ = set.reduce((value, a) => value + a, 0.00)

        setSumm(summ)

    }

    const onSubmit = (data) => {
        for (let i = 0; i < products?.length; i++) {
            if (products[i]?.ind > initdata[1]?.length - 1) {
                initdata[1].push(products[i])
            }
        }
        forma.products = initdata[1] ? initdata[1] : products
        forma.payd = payd
        forma.date = date
        forma.paytill = datetill
        forma.total = summ
        if (selection) {
            forma.selection = selection.id
        }

        let route = selection ? "update" : "create"

        axios.post(`http://localhost:3300/${route}`, { forma }, { withCredentials: true })
            .then((response) => {
                if(response.data.status === "success"){
                    closing("isDirty") 
                }
            })
    }



    return (
        <>

            <div className={anim === true ? "create out" : "create in"}>
                <div className="createHeader" onClick={closing}> <MdOutlineNavigateNext color="#876FF3FF" size={25} className="transform" />Atpakaļ</div>
                <h1 className="text black">Jauns rēķins</h1>

                <form onSubmit={handleSubmit(onSubmit)} className="form" >
                    <div className="flex-row">
                        <span className="inrow">
                            <label htmlFor="documentNr">Dokumenta numurs</label>
                            <InputText className="p-inputtext-sm" style={{ width: 200 }} id="documentNr" value={forma.documentNr} onChange={(e) => setform({ ...forma, documentNr: e.target.value })} />
                        </span>
                        <span className="inrow">
                            <label htmlFor="buttondisplay" className="font-bold block mb-2">
                                Datums
                            </label>

                            <Calendar className="p-inputtext-sm" id="buttondisplay" locale="lv" value={date} onChange={(e) => setDate(e.value)} showIcon dateFormat="dd.mm.yy" />
                        </span>
                    </div>

                    <label htmlFor="comment">Komentāri </label>
                    <InputText className="p-inputtext-sm" style={{ width: 700 }} id="comment" value={forma.Comment} onChange={(e) => setform({ ...forma, Comment: e.target.value })} />

                    <h2 >Partneris</h2>
                    <hr />
                    <div className="flex-row">
                        <span className="inrow">
                            <label htmlFor="company">Nosaukums</label>
                            <InputText className="p-inputtext-sm" style={{ width: 200 }} id="company" value={forma.Company} onChange={(e) => setform({ ...forma, Company: e.target.value })} />
                        </span>
                        <span className="inrow">
                            <label htmlFor="companyReg">Reģistrācijas numurs</label>
                            <InputText className="p-inputtext-sm" style={{ width: 300 }} id="companyReg" value={forma.CompanyReg} onChange={(e) => setform({ ...forma, CompanyReg: e.target.value })} />
                        </span>
                    </div>
                    <h2 >Maksājuma dati</h2>
                    <hr />
                    <div className="flex-auto">
                        <span>
                            <label htmlFor="paytill">Maksājuma termiņš</label>
                            <Calendar id="paytill" locale="lv" value={datetill} onChange={(e) => setDatetill(e.value)} showIcon dateFormat="dd.mm.yy" />
                        </span>
                    </div>
                    <div className="flex-row">
                        <span className="inrow">
                            <label htmlFor="companybank">Klienta bankas konts</label>
                            <InputText className="p-inputtext-sm" style={{ width: 200 }} id="companybank" value={forma.bank} onChange={(e) => setform({ ...forma, bank: e.target.value })} />
                        </span>
                        <span className="inrow">
                            <label htmlFor="companyadress">Juridiskā adrese</label>

                            <InputText className="p-inputtext-sm" style={{ width: 300 }} id="companyadress" value={forma.adress} onChange={(e) => setform({ ...forma, adress: e.target.value })} />
                        </span>
                    </div>
                    <div className="flex-row">
                        <span className="inrow">
                            <label htmlFor="email">E-pasts </label>
                            <InputText className="p-inputtext-sm" type="email" style={{ width: 250 }} id="email" value={forma.email} onChange={(e) => setform(forma => ({ ...forma, email: e.target.value }))} />
                        </span>
                        <span className="inrow">
                            <label htmlFor="phone">Tālrunis</label>
                            <InputText className="p-inputtext-sm" style={{ width: 200 }} id="phone" value={forma.phone} onChange={(e) => setform({ ...forma, phone: e.target.value })} />
                        </span>
                    </div>

                    <h2>Produkti un pakalpojumi</h2>
                    <hr />
                    <Tooltip target=".delete" className="delete-tooltip" />

                    {
                        [...Array(newproducts)].map((v, i) =>
                            !hiddenindex?.includes(i) &&
                            <div className="flex-row" key={i} index={i} >
                                <Product
                                    key={i}
                                    ind={i}
                                    price={pricechange}
                                    count={countchange}
                                    unit={unitchange}
                                    name={namechange}
                                    value={initdata[1]}
                                /><MdDelete
                                    data-pr-tooltip="Dzēst produktu/pakalpojumu"
                                    data-pr-position="top"
                                    size={25}
                                    className="delete"

                                    tooltipoptions={{ className: "delete-tooltip" }}
                                    onClick={() => removeitem(i)} /></div>)
                    }
                    <br />
                    <Button label="Pievienot produktu/pakalpojumu" onClick={addproduct} severity="secondary" outlined />
                    <br />
                    <div className="flex-auto">
                        <br />
                        <label htmlFor="total">Darījuma summa</label>
                        <hr />
                        <InputNumber className="p-inputtext-sm" currency="EUR" mode="currency" id="total" value={summ ? summ : forma.total} disabled />
                    </div>
                    <br />
                    <div className="flex-auto row2">
                        <span className="margin">
                            <label htmlFor="payd" className="ml-2">Apmaksāts</label>
                            <RadioButton inputId="payd" name="payd" value={0} checked={payd === 0} onChange={(e) => setPayd(e.value)} />
                        </span>
                        <span className="margin">
                            <label htmlFor="payd-not" className="ml-2">Nepmaksāts</label>
                            <RadioButton inputId="payd-not" name="payd" value={1} checked={payd === 1} onChange={(e) => setPayd(e.value)} />
                        </span>
                    </div>
                    <div className="flex-row row2">

                        <Button label="IZVEIDOT" type="submit" />
                        <Button label="ATCELT" type="button" severity="secondary" outlined onClick={closing} />
                    </div>
                </form >
            </div >

        </>
    )
}
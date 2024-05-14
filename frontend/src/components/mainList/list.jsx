import React, { useState, useEffect, useRef } from "react";
import moment from 'moment';
import { Paginator } from 'primereact/paginator';
import axios from "axios"
import { MdOutlineEuro } from "react-icons/md";
import { MdOutlineNavigateNext } from "react-icons/md";
import CreateForm from "../createForm/createform";

export default function List({ mode }) {
    const [first, setFirst] = useState(0);
    const [rows, setRows] = useState(5);
    const [page, setPage] = useState(0)
    const [selection, setSelection] = useState({})
    const [isEdit, setIsEdit] = useState(false)
    const [open, setOpen] = useState(false)
    const [data, setData] = useState([])
    const toast = useRef(null);
const [file, setfile] = useState()

    useEffect(() => {
        getData()
    })

    const getData = () => {
        axios.get("http://localhost:3300/", { withCredentials: true })
            .then(response => setData(response.data))
    }

    const onPageChange = (event) => {
        setFirst(event.first);
        setRows(event.rows);
        setPage(event.page)
    };

    const opencraeteform = () => {
        setOpen(true)
    }

    const closecraeteform = (isDirty) => {
        setOpen(false)
        setIsEdit(false)
        getData()
        console.log(isDirty)
        if (isDirty) {
            showSuccess()
        }
    }

    const result = data.reduce((resultArray, item, index) => {
        const chunkIndex = Math.floor(index / rows)

        if (!resultArray[chunkIndex]) {
            resultArray[chunkIndex] = [] // start a new chunk
        }

        resultArray[chunkIndex].push(item)

        return resultArray
    }, [])


    const select = (item) => {
        setSelection(item)
        setOpen(true)
        setIsEdit(true)
    }

    const removeitem = (item) => {
        const id = item.id
        axios.delete("http://localhost:3300/deleteinvoice", { params: { id } }, { withCredentials: true })
            .then(response => {
                if (response.data === "ok") {
                    getData()
                    showSuccess()
                }
            })

    }

    const showSuccess = () => {
        toast.current.show({ severity: 'success', summary: 'Dati apstrādāti veiksmīgi!', life: 3000 });
    }

    const getpdf = (item) => {
        axios.get(`http://localhost:3300/createpdf/${item.id}`, { withCredentials: true, responseType: 'arraybuffer' })
            .then(response => { 
                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', 'data.pdf');
                document.body.appendChild(link);
                link.click();
                console.log(url)
})
    }

    return (
        <><div className="header">
            <h1 className={mode ? "text" : "text black"}>Rēķini</h1>
            <button className="new" onClick={opencraeteform}><div>+</div>Pievienot jaunu</button>
        </div>

            <div className="table" >
                {result[page]?.map((x, index) => <div className="flex" key={index}><div className={mode ? "tr" : "tr light"} onClick={() => select(x)}>
                    <span className="td" id="first">#{x.documentNr.substring(0, 10) + "..."}</span>
                    <span className="td">{moment(x.date).format("DD/MM/YYYY")}</span>
                    <span className="td">{x.company.substring(0, 10) + "..."}</span>
                    <span className="td">{x.total?.toFixed(2)} <MdOutlineEuro /></span>
                    <span className="td"> <div className={x.payd === 1 ? "paid" : "pending"}>{x.payd === 1 ? "Apmaksāts" : "Neapmaksāts"}</div></span>
                    <MdOutlineNavigateNext color="#876FF3FF" size={25} className="arrow" />
                </div>

                    <button
                        size={25}
                        className="delete-listitem"
                        color="red"
                        onClick={() => removeitem(x)}
                    >dzēst</button>

<span onClick={()=>getpdf(x)}>pdf</span>

                </div>)
                }

            </div>
            <Paginator first={first} rows={rows} totalRecords={data.length} rowsPerPageOptions={[2, 5, 10]} onPageChange={onPageChange} id="page" className={mode ? "p-paginator" : "white-paginator"} />
            {open && <CreateForm close={closecraeteform} selection={isEdit ? selection : undefined} />}
        </>
    )
}
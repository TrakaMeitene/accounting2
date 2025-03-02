import React, { useState, useEffect, useRef } from "react";
import moment from 'moment';
import { Paginator } from 'primereact/paginator';
import axios from "axios"
import { MdOutlineEuro } from "react-icons/md";
import { MdOutlineNavigateNext } from "react-icons/md";
import CreateForm from "../createForm/createform";
import { GrDocumentPdf } from "react-icons/gr";
import { MdDelete } from "react-icons/md";
import { Toast } from 'primereact/toast';
import { Tooltip } from 'primereact/tooltip';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { BsFiletypeXml } from "react-icons/bs";

export default function List({ mode, signedin }) {
    const [first, setFirst] = useState(0);
    const [rows, setRows] = useState(5);
    const [page, setPage] = useState(0)
    const [selection, setSelection] = useState({})
    const [isEdit, setIsEdit] = useState(false)
    const [open, setOpen] = useState(false)
    const [data, setData] = useState([])
    const toast = useRef(null);
    const [visible, setVisible] = useState(false);
    const [itemtoremove, setremove] = useState(0)
    const [filtervalue, setFiltervalue] = useState(-1);


    useEffect(() => {
        getData()
    }, [visible, signedin])

    const getData = () => {
      axios.get(process.env.REACT_APP_API_URL + "/", { withCredentials: true })
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

        if (isDirty === "isDirty") {
            showSuccess()
        }
    }
let set = data.filter(x=> x.payd === filtervalue ??  x.payd === filtervalue )
    if(filtervalue == -1){
        set = data
    }

  const result = set.reduce((resultArray, item, index) => {
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

    const openmodal = (item) => {
        setremove(item.id)
        show()

    }

    const showSuccess = () => {
        toast.current.show({ severity: 'success', summary: 'Dati apstrādāti veiksmīgi!', life: 3000 });
    }

    const removeitem = () => {
        setVisible(false)
        axios.post(process.env.REACT_APP_API_URL+ "/deleteinvoice", {itemtoremove} , { withCredentials: true })
            .then(response => {
                if (response.data === "ok") {
                    getData()
                    showSuccess()
                }
            })
    }

    const getpdf = (item) => {
        axios.get(process.env.REACT_APP_API_URL + `/createpdf/${item.id}`, { withCredentials: true, responseType: 'arraybuffer' })
            .then(response => {
                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `${item.documentNr}.pdf`);
                document.body.appendChild(link);
                link.click();
            })
    }
    const footerContent = (
        <div>
            <Button label="Nē" icon="pi pi-times" onClick={() => setVisible(false)} className="p-button-text" />
            <Button label="Jā" icon="pi pi-check" onClick={removeitem} autoFocus />
        </div>
    );


    const getxml = (item) => {
        axios.get(process.env.REACT_APP_API_URL + `/e-invoice/${item.id}`, { withCredentials: true, responseType: 'arraybuffer'  })
            .then(response => {
                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `fails.xml`);
                document.body.appendChild(link);
                link.click();
            })
        }

    const show = () => {
        setVisible(true);
    };
    const options = [{name: "Apmaksāts", value: 0}, {name: "Neapmaksāts", value: 1}, {name: "Visi", value: -1}];


    return (

        <>
            <Toast ref={toast} />

            <div className="header">
                <h1 className={mode ? "text" : "text black"}>Rēķini</h1>
       <div className="flex ">
                <button className="new" onClick={opencraeteform}><div>+</div>Pievienot jaunu</button>
                <Dropdown value={filtervalue} onChange={(e) => setFiltervalue(e.value)} options={options} optionLabel="name" 
                placeholder="Filtrs" className={`w-full md:w-8rem `} />
                </div>
            </div>

            {result.length > 0 ? <div className="table" >
                {result[page]?.map((x, index) => <div className="flex" key={index}><div className={mode ? "tr" : "tr light"} onClick={() => select(x)}>
                    <span className="td" id="first">#{x.documentNr.substring(0, 24) + "..."}</span>
                    <span className="td">{moment(x.date).format("DD/MM/YYYY")}</span>
                    <span className="td">{x.company.substring(0, 24) + "..."}</span>
                    <span className="td">{x.total?.toFixed(2)} <MdOutlineEuro /></span>
                    <span className="td"> <div className={x.payd === 0 ? "paid" : "pending"}>{x.payd === 0 ? "Apmaksāts" : "Neapmaksāts"}</div></span>
                    <MdOutlineNavigateNext color="#876FF3FF" size={25} className="arrow" />
                </div>
                    <Tooltip target=".pdf" mouseTrack mouseTrackLeft={10}>Lejupielādēt rēķinu</Tooltip>

                    <GrDocumentPdf className="pdf" onClick={() => getpdf(x)} size={30} color={mode ? "white" : "black"} style={{ marginLeft: 20, cursor: "pointer" }} />
                    <BsFiletypeXml className="pdf" onClick={() => getxml(x)} size={30} color={mode ? "white" : "black"} style={{ marginLeft: 20, cursor: "pointer" }} />

                    <Tooltip target=".delete" mouseTrack mouseTrackLeft={10}>Dzēst ierakstu</Tooltip>

                    <MdDelete
                        size={25}
                        color="hsl(23, 95%, 52%)"
                        onClick={() => {
                            setVisible(true)
                            openmodal(x)
                        }}
                        style={{ cursor: "pointer", marginLeft: 10 }}
                        tooltip="Enter your username"
                        className="delete"
                    />


                </div>)
                }

            </div> : <div className={mode ? "nodata white" : "nodata black"}>Nav datu</div>}

            <Paginator first={first} rows={rows} totalRecords={data.length} rowsPerPageOptions={[2, 5, 10]} onPageChange={onPageChange} id="page" className={mode ? "p-paginator" : "white-paginator"} />
            {open && <CreateForm close={closecraeteform} selection={isEdit ? selection : undefined} />}
            <Dialog  visible={visible} position={"center"} style={{ width: '50vw' }} onHide={() => { if (!visible) return; setVisible(false); }} footer={footerContent} draggable={false} resizable={false}>
                <p className="m-0">
                   Esat drošs, ka vēlaties neatgriezeniski dzēst ierakstu? 
                </p>
            </Dialog>
        </>
    )
}
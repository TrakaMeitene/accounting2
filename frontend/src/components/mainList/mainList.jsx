import React, { useEffect, useState, useRef } from "react"
import "./mainList.css"
import axios from 'axios';
import { FaMoon } from "react-icons/fa";
import { IoMdSunny } from "react-icons/io";
import { MdOutlineEuro } from "react-icons/md";
import { MdOutlineNavigateNext } from "react-icons/md";
import CreateForm from "../createForm/createform";
import { OverlayPanel } from 'primereact/overlaypanel'
import { Avatar } from 'primereact/avatar';
import { FiLogOut } from "react-icons/fi";
import { CgProfile } from "react-icons/cg";
import { Menu } from 'primereact/menu';
import moment from 'moment';
import { Paginator } from 'primereact/paginator';
import { MdDelete } from "react-icons/md";
import { Tooltip } from 'primereact/tooltip';
import { Toast } from 'primereact/toast';


export default function MainList({ user }) {
    const [data, setData] = useState([])
    const [mode, setMode] = useState(true)
    const [open, setOpen] = useState(false)
    const op = useRef(null);
    const [picture, setPicture] = useState("")
    const [first, setFirst] = useState(0);
    const [rows, setRows] = useState(5);
    const [page, setPage] = useState(0)
    const [selection, setSelection] = useState({})
    const [isEdit, setIsEdit] = useState(false)
    const toast = useRef(null);

    const onPageChange = (event) => {
        setFirst(event.first);
        setRows(event.rows);
        setPage(event.page)
    };

    const items = [
        {
            label: 'Profils',
            icon: <CgProfile />
        },
        {
            label: 'Izrakstīties',
            icon: <FiLogOut />,
            command: () => {
                handleLogout()
            }
        }
    ];

    useEffect(() => {
        getData()
        if (mode) {
            document.body.style.backgroundColor = "hsl(233, 30%, 11%)"
            document.getElementById("page").style.backgroundColor = "hsl(236, 30%, 17%)"
        } else {
            document.body.style.backgroundColor = "hsl(252, 45%, 98%)"
            document.getElementById("page").style.backgroundColor = "hsl(252, 45%, 98%)"

        }
        getuser()
    }, [mode])


    const showSuccess = () => {
        toast.current.show({ severity: 'success', summary: 'Dati apstrādāti veiksmīgi!', life: 3000 });
    }

    const getData = () => {
        axios.get("http://localhost:3300/", { withCredentials: true })
            .then(response => setData(response.data))
    }

    const getuser = () => {
        axios.get("http://localhost:3300/user", { withCredentials: true })
            .then(response => setPicture(response.data))
    }

    const modechange = () => {
        setMode(!mode)

    }

    const opencraeteform = () => {
        setOpen(true)
    }

    const closecraeteform = (isDirty) => {
        setOpen(false)
        setIsEdit(false)
        getData()
        if(isDirty){
            showSuccess()
        }
    }

    const handleLogout = () => {
        axios.get("http://localhost:3300/logout", { withCredentials: true })
            .then(response => window.location.replace("/")
            )
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
            .then(response => { if (response.data === "ok") {
                 getData() 
                 showSuccess()
                } })

    }



    return (
        <>
            <Toast ref={toast} />

            <section>

                <div className="leftContainer">
                    <div className="image">
                        "test"
                    </div>
                    <div className="moon" onClick={modechange}>{mode === true ? <FaMoon color="white" size={20} /> : <IoMdSunny color="white" size={20} />}</div>
                    <Avatar image={picture} className="mr-2 signout" size="large" shape="circle" onClick={(e) => op.current.toggle(e)} />
                    <OverlayPanel ref={op}>
                        <Menu model={items} />
                    </OverlayPanel>

                </div>

                <div className="header">
                    <h1 className={mode ? "text" : "text black"}>Rēķini</h1>
                    <button className="new" onClick={opencraeteform}><div>+</div>Pievienot jaunu</button>
                </div>

                <div className="table" >
                    {result[page]?.map((x, index) => <div className="flex" key={index}><div className={mode ? "tr" : "tr light"} onClick={() => select(x)}>
                        <span className="td">#{x.documentNr.substring(0, 10) + "..."}</span>
                        <span className="td">{moment(x.date).format("DD/MM/YYYY")}</span>
                        <span className="td">{x.company.substring(0, 10) + "..."}</span>
                        <span className="td">{x.total?.toFixed(2)} <MdOutlineEuro /></span>
                        <span className="td"> <div className={x.statuss === 1 ? "paid" : "pending"}>{x.statuss === 1 ? "Apmaksāts" : "Neapmaksāts"}</div></span>
                        <MdOutlineNavigateNext color="#876FF3FF" size={25} />

                    </div>

                        <button
                            size={25}
                            className="delete-listitem"
                            color="red"
                            onClick={() => removeitem(x)}
                        >dzēst</button>


                    </div>)
                    }

                </div>
                <Paginator first={first} rows={rows} totalRecords={data.length} rowsPerPageOptions={[2, 5, 10]} onPageChange={onPageChange} id="page" />

            </section>
            {open && <CreateForm close={closecraeteform} selection={isEdit ? selection : undefined} />}
        </>
    )
}
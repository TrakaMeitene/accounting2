import React, { useEffect, useState, useRef } from "react"
import axios from "axios"
import { InputText } from "primereact/inputtext";
import { Button } from 'primereact/button';
import { MdOutlineNavigateNext } from "react-icons/md";
import { Toast } from 'primereact/toast';
import { Image } from 'primereact/image';
import "./profile.css"
import Errorpage from "../errorpage/errorpage";

export default function Profile({ mode }) {
    const [userdata, setUserdata] = useState({ name: "", surname: "", email: "", personalnr: "", adress: "", bank: "" })
    const toast = useRef(null);
    const [file, setFile] = useState("")
    const [image, setImage] = useState("")

    useEffect(() => {
        getuserdata()
        if (mode) {
            document.body.style.backgroundColor = "hsl(233, 30%, 11%)"
        } else {
            document.body.style.backgroundColor = "hsl(252, 45%, 98%)"
        }
    }, [mode])

    const getuserdata = () => {
        axios.get("http://localhost:3300/getuserdata", { withCredentials: true })
            .then((response) => {
                setUserdata(response.data[0])
                setImage(response.data[0].file.length >1 ? `http://localhost:3300${response.data[0].file}` : "")
            })
    }

    if(!userdata)
    return <Errorpage mode={mode}/>

    const showSuccess = () => {
        toast.current.show({ severity: 'success', summary: 'Dati apstrādāti veiksmīgi!', life: 3000 });
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        const formData = new FormData();
        formData.append('img', file)
        formData.append('name', userdata.name)
        formData.append('surname', userdata.surname)
        formData.append('email', userdata.email)
        formData.append('personalnr', userdata.personalnr)
        formData.append('adress', userdata.adress)
        formData.append('bank', userdata.bank)

        axios.post("http://localhost:3300/userdata", formData, { withCredentials: true, headers: { "Content-Type": "multipart/form-data" } })
            .then(response => {
                if (response.data.status === "success") {
                    showSuccess()
                }
            })
    }

    const back = () => {
        window.location.replace("/" + window.location.search)
    }

    const handleChangeimage = (e) => {
        setFile(e.target.files[0])
        setImage(URL.createObjectURL(e.target.files[0]))
    }

    return (
        <>
            <Toast ref={toast} />

            <div className="profile">
                <div onClick={back} className={mode ? " createHeader white" : "createHeader black"}> <MdOutlineNavigateNext color="#876FF3FF" size={25} className="transform" />Atpakaļ</div>

                <h1 className={mode ? "text white" : "text black"}>Lietotāja informācija</h1>
                <form onSubmit={handleSubmit} >
                    <div className="flex-row">
                        <span>
                            <label htmlFor="documentNr" className={mode ? "white" : "black"}>Lietotāja vārds</label>
                            <InputText className="p-inputtext-sm" style={{ width: 250 }} id="name" defaultValue={userdata.name} onChange={(e) => setUserdata({ ...userdata, name: e.target.value })} />
                        </span>
                        <span>
                            <label htmlFor="documentNr" className={mode ? "white" : "black"}>Lietotāja uzvārds</label>
                            <InputText className="p-inputtext-sm" style={{ width: 250 }} id="surname" defaultValue={userdata.surname} onChange={(e) => setUserdata({ ...userdata, surname: e.target.value })} />
                        </span>

                    </div>
                    <div className="flex-row">
                        <span>
                            <label htmlFor="documentNr" className={mode ? "white" : "black"} >E-pasta adrese</label>
                            <InputText className="p-inputtext-sm" style={{ width: 250 }} id="documentNr" defaultValue={userdata.email} onChange={(e) => setUserdata({ ...userdata, email: e.target.value })} />
                        </span>
                        <span>
                            <label htmlFor="documentNr" className={mode ? "white" : "black"}>Personas kods</label>
                            <InputText className="p-inputtext-sm" style={{ width: 250 }} id="documentNr" defaultValue={userdata.personalnr} onChange={(e) => setUserdata({ ...userdata, personalnr: e.target.value })} />
                        </span>

                    </div>
                    <div className="flex-row">
                        <span>
                            <label htmlFor="documentNr" className={mode ? "white" : "black"}>Adrese</label>
                            <InputText className="p-inputtext-sm" style={{ width: 250 }} id="documentNr" defaultValue={userdata.adress} onChange={(e) => setUserdata({ ...userdata, adress: e.target.value })} />
                        </span>
                        <span>
                            <label htmlFor="documentNr" className={mode ? "white" : "black"}>Bankas konts</label>
                            <InputText className="p-inputtext-sm" style={{ width: 250 }} id="documentNr" defaultValue={userdata.bank} onChange={(e) => setUserdata({ ...userdata, bank: e.target.value })} />
                        </span>

                    </div>
                    <div className="upload">
                        <Image src={ image ? image : "broken-image.png"} alt="Image" width="100" height="80" style={{ marginRight: 20 }} preview />

                        <div className="p-button p-component">
                            <label htmlFor="img" className="btn p-button-label">IZVĒLĒTIES FAILU</label>
                            <input type="file" id="img" name="img" accept="image/*" onChange={handleChangeimage} hidden />
                        </div>
                    </div>
                    <Button label="SAGLABĀT" type="submit" />
                </form >

            </div>
        </>
    )
}
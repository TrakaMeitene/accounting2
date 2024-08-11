import React, { useEffect, useState, useRef } from "react"
import axios from "axios"
import { InputText } from "primereact/inputtext";
import { Button } from 'primereact/button';
import { MdOutlineNavigateNext } from "react-icons/md";
import { Toast } from 'primereact/toast';
import { Image } from 'primereact/image';
import "./profile.css"
import Errorpage from "../errorpage/errorpage";
import { useForm,  useFieldArray   } from "react-hook-form"
import { Message } from 'primereact/message';

export default function Profile({ mode}) {
    const [userdata, setUserdata] = useState({ "name": "", surname: "", email: "", personalnr: "", adress: "", bank: "" })
    const toast = useRef(null);
    const [file, setFile] = useState("")
    const [image, setImage] = useState("")
    const { register, handleSubmit, formState: { errors }, reset} = useForm({})
  

  
    useEffect(() => {
        getuserdata()
        if (mode) {
            document.body.style.backgroundColor = "hsl(233, 30%, 11%)"
        } else {
            document.body.style.backgroundColor = "hsl(252, 45%, 98%)"
        }
    }, [mode])

    useEffect(()=>{
        if(userdata){
            reset(userdata)
        }
    }, [userdata])

    const getuserdata = () => {
        axios.get(process.env.REACT_APP_API_URL + "/getuserdata", { withCredentials: true })
            .then((response) => {
                if(response.data.length > 0){
                setUserdata(response.data[0])
                setImage(response.data[0]?.file?.length >1 ? process.env.REACT_APP_API_URL +`${response.data[0].file}` : "")
            }})
    }

    if(!userdata)
    return <Errorpage mode={mode}/>

    const showSuccess = () => {
        toast.current.show({ severity: 'success', summary: 'Dati apstrādāti veiksmīgi!', life: 3000 });
    }

    const save = ( data) => {

         const formData = new FormData();
        formData.append('img', file)
        formData.append('name', data.name )
        formData.append('surname', data.surname)
        formData.append('email', data.email)
        formData.append('personalnr', data.personalnr)
        formData.append('adress', data.adress)
        formData.append('bank', data.bank)

        axios.post(process.env.REACT_APP_API_URL + "/userdata", formData, { withCredentials: true, headers: { "Content-Type": "multipart/form-data" } })
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

    const worb = mode ? "white" : "black"

    const onerror =(errors)=> { console.log(errors)}

    
    return (
        <>
            <Toast ref={toast} />

            <div className="profile">
                <Button type="button" severity="secondary" outlined onClick={back} className={mode ? " createHeader white" : "createHeader black"}> <MdOutlineNavigateNext color="#876FF3FF" size={25} className="transform" />Atpakaļ</Button>

                <h1 className={`${worb}`}>Lietotāja informācija</h1>
                <form className="profile-form" onSubmit={handleSubmit(save, onerror)} >
                        <span className="grid-item">
                            <label htmlFor="documentNr" className={`${worb} `}>Lietotāja vārds</label>
                            <InputText className={`p-inputtext-sm ${errors.name && 'p-invalid mr-2'}`}style={{ width: 250 }} id="name"  defaultValue={userdata.name}  {...register("name", { required: true})} />

                       {errors?.name && <Message severity="error" text="Aizpildiet lauku!" />}

                        </span>
                        <span className="grid-item">
                            <label htmlFor="documentNr" className={`${worb}`}>Lietotāja uzvārds</label>
                            <InputText className="p-inputtext-sm" style={{ width: 250 }} id="surname" defaultValue={userdata.surname} {...register("surname", { required: true } )}/>
                            {errors?.surname && <Message severity="error" text="Aizpildiet lauku!" />}

                        </span>

                        <span className="grid-item">
                            <label htmlFor="documentNr" className={`${worb}`} >E-pasta adrese</label>
                            <InputText className="p-inputtext-sm" style={{ width: 250 }} id="documentNr" defaultValue={userdata.email} {...register("email", { required: true } )} />
                            {errors?.email && <Message severity="error" text="Aizpildiet lauku!" />}

                        </span>
                        <span className="grid-item">
                            <label htmlFor="documentNr" className={`${worb}`}>Personas kods</label>
                            <InputText className="p-inputtext-sm" style={{ width: 250 }} id="documentNr" defaultValue={userdata.personalnr} {...register("personalnr",  { required: true }) }/>
                            {errors?.personalnr && <Message severity="error" text="Aizpildiet lauku!" />}

                        </span>

                        <span className="grid-item">
                            <label htmlFor="documentNr" className={`${worb}`}>Adrese</label>
                            <InputText className="p-inputtext-sm" style={{ width: 250 }} id="documentNr" defaultValue={userdata.adress} {...register("adress", { required: true } )} />
                            {errors?.adress && <Message severity="error" text="Aizpildiet lauku!" />}

                        </span>
                        <span className="grid-item">
                            <label htmlFor="documentNr" className={`${worb}`}>Bankas konts</label>
                            <InputText className="p-inputtext-sm" style={{ width: 250 }} id="documentNr" defaultValue={userdata.bank} {...register("bank", { required: true } )} />
                            {errors?.bank && <Message severity="error" text="Aizpildiet lauku!" />}
                        </span>

                    <div className="upload grid-item">
                        {image ? <Image src={ image ? image : "broken-image.png"} alt="Image" width="100" height="80" style={{ marginRight: 20 }} preview /> : <i className="pi pi-image mt-3 p-5" style={{ fontSize: '5em', borderRadius: '50%', backgroundColor: 'var(--surface-b)', color: 'var(--surface-d)' }}></i>}


                        <div className="p-button p-component">
                            <label htmlFor="img" className="btn p-button-label">IZVĒLĒTIES FAILU</label>
                            <input type="file" id="img" name="img" accept="image/*" onChange={handleChangeimage} hidden />
                        </div>
                    </div>
                    <span className="grid-item2">
                    <Button label="SAGLABĀT" type="submit" />
                    </span>
                </form >

            </div>
        </>
    )
}
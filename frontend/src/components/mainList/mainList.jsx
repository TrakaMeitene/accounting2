import React, { useEffect, useState, useRef } from "react"
import "./mainList.css"
import axios from 'axios';
import { FaMoon } from "react-icons/fa";
import { IoMdSunny } from "react-icons/io";
import { OverlayPanel } from 'primereact/overlaypanel'
import { Avatar } from 'primereact/avatar';
import { FiLogOut } from "react-icons/fi";
import { CgProfile } from "react-icons/cg";
import { Menu } from 'primereact/menu';
import { Tooltip } from 'primereact/tooltip';
import { InputText } from "primereact/inputtext";
import { Button } from 'primereact/button';
import { useForm } from "react-hook-form"
import { IoClose } from "react-icons/io5";

import { Toast } from 'primereact/toast';
import Profile from "../profile/profile";

import List from "./list";
import logo from "../../assets/rekinilogosmall.png"
import { FiMessageCircle } from "react-icons/fi";
import { InputTextarea } from "primereact/inputtextarea";

export default function MainList() {
    const [mode, setMode] = useState(false)
    const op = useRef(null);
    const [picture, setPicture] = useState("")
    const [signedin, setSigned] = useState(false)
    const [openchat, setopenchat] = useState(false)
    const { register, handleSubmit, formState: { errors }, reset } = useForm({})

    const toast = useRef(null);
    const query = new URLSearchParams(window.location.search);
    const token = query.get('t')
    const code = query.get("code")

    useEffect(() => {
        if (token !== null) {
            verify()
        }
        if (code !== null) {
            socverify()
        }
        // eslint-disable-next-line
    }, [token, code, signedin])


    const socverify = () => {
        const data = { "code": code }
        axios.post(process.env.REACT_APP_API_URL + "/socverify", data, { withCredentials: true })
            .then((response) => {
                setSigned(true)
            })
    }

    const verify = () => {
        const data = { "token": token }

        axios.post(process.env.REACT_APP_API_URL + "/verify", data, { withCredentials: true })
            .then(response => setSigned(true)
            )

    }


    const items = [
        {
            label: 'Profils',
            icon: <CgProfile />,
            command: () => {
                window.location.replace("/profile/" + window.location.search)
            }
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
        if (mode) {
            document.body.style.backgroundColor = "hsl(233, 30%, 11%)"
        } else {
            document.body.style.backgroundColor = "hsl(252, 45%, 98%)"
        }
        getuser()
    }, [mode, signedin])

    const getuser = () => {

        axios.get(process.env.REACT_APP_API_URL + "/user", { withCredentials: true })
            .then(response => setPicture(response.data))
    }


    const modechange = () => {
        setMode(!mode)
    }

    const handleLogout = () => {
        axios.get(process.env.REACT_APP_API_URL + "/logout", { withCredentials: true })
            .then(response => window.location.replace("/")
            )
    }

    let render = <p></p>
    if (window.location.pathname === "/list/") {
        render = <List mode={mode} signedin={signedin} />
    } else if (window.location.pathname === "/profile/") {
        render = <Profile mode={mode} />
    }

    const chat = () => {
        setopenchat(true)
    }

    const sendmessage=( data)=>{
        axios.post(process.env.REACT_APP_API_URL + "/sendmail", data, { withCredentials: true })
        .then((response) =>  {if(response.data.message === "ok") {
            showSuccess() 
            reset()
            setopenchat(false)
        }
        }
        )

    }

    const showSuccess = () => {
        toast.current.show({ severity: 'success', summary: 'Dati apstrādāti veiksmīgi!', life: 3000 });
    }

    return (
        <>
            <Toast ref={toast} />
            <section>
                <div className="leftContainer">
                    <div className="image">
                        <img src={logo} width={70} />
                    </div>
                    <div className="moon" onClick={modechange}>{mode === true ? <FaMoon color="white" size={20} /> : <IoMdSunny color="white" size={20} />}</div>
                    <Avatar image={picture} className="mr-2 signout" size="large" shape="circle" onClick={(e) => op.current.toggle(e)} />
                    <OverlayPanel ref={op}>
                        <Menu model={items} />
                    </OverlayPanel>
                </div>
                {render}
                <Tooltip target=".messageme" mouseTrack mouseTrackTop={45} position="top">Atradi kļūdu vai ir ieteikums ? Raksti</Tooltip>

                <div className="messageme" onClick={chat}><FiMessageCircle size={25} /></div>
               {openchat  && <div className="chat">
                <IoClose onClick={()=> setopenchat(false)} className="close"/>

                    <div className="chathead">Paldies, ka raksti. Mēs izskatīsim tavu ziņu un veiksim uzlabojumus. </div>
                        <form className="textinput" onSubmit={handleSubmit(sendmessage)}>
                    <InputText className="p-inputtext-sm " placeholder="E-pasts" type="email" style={{ width: 250, marginBottom: 20 }} id="email"  {...register("email")}/>

                    <InputTextarea  rows={8} cols={40} {...register("text")}/>
                    <Button type="submit" severity="primary">NOSŪTĪT</Button>
                    </form>
                    </div>}
            </section>
        </>

    )
}
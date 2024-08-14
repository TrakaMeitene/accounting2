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

import { Toast } from 'primereact/toast';
import Profile from "../profile/profile";

import List from "./list";
import logo from "../../assets/rekinilogosmall.png"

export default function MainList() {
    const [mode, setMode] = useState(false)
    const op = useRef(null);
    const [picture, setPicture] = useState("")
    const [signedin, setSigned] = useState(false)

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
        render = <List mode={mode} signedin={signedin}/>
    } else if (window.location.pathname === "/profile/") {
        render = <Profile mode={mode}/>
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
            </section>
        </>

    )
}